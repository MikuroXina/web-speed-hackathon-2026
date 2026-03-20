import { promises as fs } from "fs";
import path from "path";

import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { Hono } from "hono";
import { Env } from "../../env";

// 変換した画像の拡張子
const EXTENSION = "avif";

export const imageRouter = new Hono<Env>();

imageRouter.post("/images", async (c) => {
  const userId = c.get("session").get("userId");
  if (userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  const body = await c.req.arrayBuffer();

  const type = await fileTypeFromBuffer(body);
  if (type === undefined || type.ext !== EXTENSION) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  const imageId = uuidv4();

  const filePath = path.resolve(UPLOAD_PATH, `./images/${imageId}.${EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "images"), { recursive: true });
  await fs.writeFile(filePath, Buffer.from(body));

  return c.json({ id: imageId });
});
