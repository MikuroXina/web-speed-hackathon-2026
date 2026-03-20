import httpErrors from "http-errors";
import { UniqueConstraintError, ValidationError } from "sequelize";

import { User } from "@web-speed-hackathon-2026/server/src/models";
import { Hono } from "hono";
import { Env } from "../../env";

export const authRouter = new Hono<Env>();

authRouter.post("/signup", async (c) => {
  try {
    const { id: userId } = await User.create(await c.req.json());
    const user = await User.findByPk(userId);

    c.get("session").set("userId", userId);
    return c.json(user);
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      return c.json({ code: "USERNAME_TAKEN" }, 400);
    }
    if (err instanceof ValidationError) {
      return c.json({ code: "INVALID_USERNAME" }, 400);
    }
    throw err;
  }
});

authRouter.post("/signin", async (c) => {
  const body = await c.req.json();
  const user = await User.findOne({
    where: {
      username: body.username,
    },
  });

  if (user === null) {
    throw new httpErrors.BadRequest();
  }
  if (!user.validPassword(body.password)) {
    throw new httpErrors.BadRequest();
  }

  c.get("session").set("userId", user.id);
  return c.json(user);
});

authRouter.post("/signout", async (c) => {
  c.get("session").deleteSession();
  return c.json({});
});
