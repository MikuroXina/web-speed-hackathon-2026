import fs from "node:fs/promises";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

import { initializeSequelize } from "../../sequelize";
import { clearSessions } from "../../session";
import { Hono } from "hono";

export const initializeRouter = new Hono();

initializeRouter.post("/initialize", async (c) => {
  // DBリセット
  await initializeSequelize();
  // sessionStoreをクリア
  clearSessions();
  // uploadディレクトリをクリア
  await fs.rm(UPLOAD_PATH, { force: true, recursive: true });

  return c.json({});
});
