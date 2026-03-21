import { initializeImageMagick, ImageMagick, MagickFormat } from "@imagemagick/magick-wasm";
import ExifReader from "exifreader";

interface Options {
  extension: MagickFormat;
}

export async function convertImage(
  file: File,
  options: Options,
): Promise<{ blob: Blob; alt: string | undefined }> {
  await initializeImageMagick(new URL("@imagemagick/magick-wasm/magick.wasm?url", import.meta.url));

  const buf = await file.arrayBuffer();
  const byteArray = new Uint8Array(buf);
  const tags = ExifReader.load(buf);
  const alt = tags?.["ImageDescription"]?.description as string | undefined;

  return new Promise((resolve) => {
    ImageMagick.read(byteArray, (img) => {
      img.format = options.extension;

      img.write((output) => {
        resolve({ blob: new Blob([output as Uint8Array<ArrayBuffer>]), alt });
      });
    });
  });
}
