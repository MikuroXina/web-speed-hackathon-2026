import { promises as fs } from "fs";
import path from "path";

import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { extractMetadataFromSound } from "@web-speed-hackathon-2026/server/src/utils/extract_metadata_from_sound";
import { Hono } from "hono";
import { Env } from "../../env";

// 変換した音声の拡張子
const EXTENSION = "mp3";

export const soundRouter = new Hono<Env>();

soundRouter.post("/sounds", async (c) => {
  const userId = c.get("session").get("userId");
  if (userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  const body = await c.req.arrayBuffer();

  const type = await fileTypeFromBuffer(body);
  if (type === undefined || type.ext !== EXTENSION) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  const soundId = uuidv4();

  const { artist, title } = await extractMetadataFromSound(new Uint8Array(body));

  const filePath = path.resolve(UPLOAD_PATH, `./sounds/${soundId}.${EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "sounds"), { recursive: true });
  await fs.writeFile(filePath, Buffer.from(body));

  return c.json({ artist, id: soundId, title });
});
