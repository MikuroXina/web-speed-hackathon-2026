import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";

import { compress } from "hono/compress";

export const staticRouter = new Hono();

staticRouter.use(compress());

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.notFound(async (c) => c.redirect("/index.html"));

staticRouter.use(
  serveStatic({
    root: "../upload/",
  }),
);
staticRouter.use(
  serveStatic({
    root: "../public/",
  }),
);
staticRouter.use(
  serveStatic({
    root: "../dist/",
  }),
);
