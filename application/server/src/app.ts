import { Hono } from "hono";

import { apiRouter } from "@web-speed-hackathon-2026/server/src/routes/api";
import { staticRouter } from "@web-speed-hackathon-2026/server/src/routes/static";
import { sessionMiddleware } from "@web-speed-hackathon-2026/server/src/session";
import { bodyLimit } from "hono/body-limit";

export const app = new Hono();

app.use(sessionMiddleware);
app.use(bodyLimit({ maxSize: 10 * 1024 * 1024 }));

app.use((c, next) => {
  c.res.headers.set("Cache-Control", "max-age=0, no-transform");
  c.res.headers.set("Connection", "close");
  return next();
});

app.route("/api/v1", apiRouter);
app.route("/", staticRouter);
