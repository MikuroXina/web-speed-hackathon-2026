import "@web-speed-hackathon-2026/server/src/utils/express_websocket_support";
import { app } from "@web-speed-hackathon-2026/server/src/app";

import { initializeSequelize } from "./sequelize";
import { serve } from "@hono/node-server";
import { injectWebSocket } from "./routes/api/direct_message";

async function main() {
  await initializeSequelize();

  const port = Number(process.env["PORT"] || 3000);
  const server = serve(
    {
      fetch: (req) => {
        const url = new URL(req.url);
        url.protocol = req.headers.get("x-forwarded-proto") ?? url.protocol;
        return app.fetch(new Request(url, req));
      },
      port,
    },
    (info) => {
      console.log(`Listening on http://localhost:${info.port}`);
    },
  );
  injectWebSocket(server);
}

main().catch(console.error);
