import {
  initializeImageMagick,
  ImageMagick,
  MagickFormat,
  ImageProfile,
} from "@imagemagick/magick-wasm";

interface Options {
  extension: MagickFormat;
}

export async function convertImage(file: File, options: Options): Promise<Blob> {
  await initializeImageMagick(new URL("@imagemagick/magick-wasm/magick.wasm?url", import.meta.url));

  const byteArray = new Uint8Array(await file.arrayBuffer());

  return new Promise((resolve) => {
    ImageMagick.read(byteArray, (img) => {
      img.format = options.extension;

      const comment = img.comment;
      if (comment) {
        const profile = new ImageProfile(
          "image:imageDescription",
          new TextEncoder().encode(comment),
        );
        img.setProfile(profile);
      }

      img.write((output) => {
        resolve(new Blob([output as Uint8Array<ArrayBuffer>]));
      });
    });
  });
}
