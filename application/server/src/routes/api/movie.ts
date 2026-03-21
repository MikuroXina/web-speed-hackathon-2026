import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import child_process from "child_process";
import { promisify } from "util";

const exec = promisify(child_process.exec);

// 変換した動画の拡張子
const EXTENSION = "webm";

export const movieRouter = Router();

movieRouter.post("/movies", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const movieId = uuidv4();

  const type = await fileTypeFromBuffer(req.body);
  if (type === undefined) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  const originalFilePath = path.resolve(UPLOAD_PATH, `../temp/${movieId}.${type.ext}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "../temp"), { recursive: true });
  await fs.mkdir(path.resolve(UPLOAD_PATH, "movies"), { recursive: true });
  await fs.writeFile(originalFilePath, req.body);

  const cropOptions = `'min(iw\\,ih)':'min(iw\\,ih)'`;
  const exportFile = path.resolve(UPLOAD_PATH, `./movies/${movieId}.${EXTENSION}`);

  await exec(
    [
      "ffmpeg",
      "-i",
      originalFilePath,
      "-t",
      "5",
      "-r",
      "10",
      "-vf",
      `crop=${cropOptions}`,
      "-an",
      "-c:v",
      "libvpx-vp9",
      "-b:v",
      "0",
      "-crf",
      "35",
      "-deadline",
      "good",
      "-loop",
      "0",
      exportFile,
    ].join(" "),
  );

  await fs.rm(originalFilePath);

  return res.status(200).type("application/json").send({ id: movieId });
});
