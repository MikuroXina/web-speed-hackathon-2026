import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";

import { compress } from "hono/compress";

export const staticRouter = new Hono();

staticRouter.use(compress());

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

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(
  "*",
  serveStatic({
    path: "../dist/index.html",
  }),
);
