import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import httpErrors from "http-errors";

import { QaSuggestion } from "@web-speed-hackathon-2026/server/src/models";
import { Hono } from "hono";
import { Env } from "../../env";
import { streamSSE } from "hono/streaming";

export const crokRouter = new Hono<Env>();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const response = fs.readFileSync(path.join(__dirname, "crok-response.md"), "utf-8");

crokRouter.get("/crok/suggestions", async (c) => {
  const suggestions = await QaSuggestion.findAll({ logging: false });
  return c.json({ suggestions: suggestions.map((s) => s.question) });
});

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

crokRouter.get("/crok", async (c) => {
  const userId = c.get("session").get("userId");
  if (userId == undefined) {
    throw new httpErrors.Unauthorized();
  }

  return streamSSE(c, async (stream) => {
    let messageId = 0;

    // TTFT (Time to First Token)
    await stream.sleep(300);

    for (const char of response) {
      if (stream.closed) {
        break;
      }

      const data = JSON.stringify({ text: char, done: false });
      stream.writeSSE({
        event: "message",
        id: `${messageId++}`,
        data,
      });

      await sleep(10);
    }

    if (!stream.closed) {
      const data = JSON.stringify({ text: "", done: true });
      stream.writeSSE({
        event: "message",
        id: `${messageId}`,
        data,
      });
    }

    await stream.close();
  });
});
