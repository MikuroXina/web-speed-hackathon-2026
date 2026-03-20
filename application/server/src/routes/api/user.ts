import httpErrors from "http-errors";

import { Post, User } from "@web-speed-hackathon-2026/server/src/models";
import { Hono } from "hono";
import { Env } from "../../env";

export const userRouter = new Hono<Env>();

userRouter.get("/me", async (c) => {
  const userId = c.get("session").get("userId");
  if (userId == undefined) {
    throw new httpErrors.Unauthorized();
  }
  const user = await User.findByPk(userId);

  if (user === null) {
    throw new httpErrors.NotFound();
  }

  return c.json(user);
});

userRouter.put("/me", async (c) => {
  const userId = c.get("session").get("userId");
  if (userId == undefined) {
    throw new httpErrors.Unauthorized();
  }
  const user = await User.findByPk(userId);

  if (user === null) {
    throw new httpErrors.NotFound();
  }

  Object.assign(user, await c.req.json());
  await user.save();

  return c.json(user);
});

userRouter.get("/users/:username", async (c) => {
  const user = await User.findOne({
    where: {
      username: c.req.param("username"),
    },
  });

  if (user === null) {
    throw new httpErrors.NotFound();
  }

  return c.json(user);
});

userRouter.get("/users/:username/posts", async (c) => {
  const user = await User.findOne({
    where: {
      username: c.req.param("username"),
    },
  });

  if (user === null) {
    throw new httpErrors.NotFound();
  }

  const posts = await Post.findAll({
    limit: c.req.query("limit") != null ? Number(c.req.query("limit")) : undefined,
    offset: c.req.query("offset") != null ? Number(c.req.query("offset")) : undefined,
    where: {
      userId: user.id,
    },
  });

  return c.json(posts);
});
