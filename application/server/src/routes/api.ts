import httpErrors from "http-errors";
import { ValidationError } from "sequelize";

import { authRouter } from "@web-speed-hackathon-2026/server/src/routes/api/auth";
import { crokRouter } from "@web-speed-hackathon-2026/server/src/routes/api/crok";
import { directMessageRouter } from "@web-speed-hackathon-2026/server/src/routes/api/direct_message";
import { imageRouter } from "@web-speed-hackathon-2026/server/src/routes/api/image";
import { initializeRouter } from "@web-speed-hackathon-2026/server/src/routes/api/initialize";
import { movieRouter } from "@web-speed-hackathon-2026/server/src/routes/api/movie";
import { postRouter } from "@web-speed-hackathon-2026/server/src/routes/api/post";
import { searchRouter } from "@web-speed-hackathon-2026/server/src/routes/api/search";
import { soundRouter } from "@web-speed-hackathon-2026/server/src/routes/api/sound";
import { userRouter } from "@web-speed-hackathon-2026/server/src/routes/api/user";
import { Hono } from "hono";
import { ContentfulStatusCode } from "hono/utils/http-status";

export const apiRouter = new Hono();

apiRouter.route("/", initializeRouter);
apiRouter.route("/", userRouter);
apiRouter.route("/", postRouter);
apiRouter.route("/", directMessageRouter);
apiRouter.route("/", searchRouter);
apiRouter.route("/", movieRouter);
apiRouter.route("/", imageRouter);
apiRouter.route("/", soundRouter);
apiRouter.route("/", authRouter);
apiRouter.route("/", crokRouter);

apiRouter.onError(async (err) => {
  if (err instanceof ValidationError) {
    console.error(err);
    throw new httpErrors.BadRequest();
  }
  throw err;
});

apiRouter.onError(async (err, c) => {
  if (!httpErrors.isHttpError(err) || err.status === 500) {
    console.error(err);
  }

  const statusCode: ContentfulStatusCode = httpErrors.isHttpError(err)
    ? (err.status as ContentfulStatusCode)
    : 500;
  return c.json({ message: err.message }, statusCode);
});
