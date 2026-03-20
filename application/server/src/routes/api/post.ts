import httpErrors from "http-errors";

import { Comment, Image, Movie, Post, Sound } from "@web-speed-hackathon-2026/server/src/models";
import { Hono } from "hono";
import { Env } from "../../env";

export const postRouter = new Hono<Env>();

postRouter.get("/posts", async (c) => {
  const posts = await Post.findAll({
    limit: c.req.query("limit") != null ? Number(c.req.query("limit")) : undefined,
    offset: c.req.query("offset") != null ? Number(c.req.query("offset")) : undefined,
  });

  return c.json(posts);
});

postRouter.get("/posts/:postId", async (c) => {
  const post = await Post.findByPk(c.req.param("postId"));

  if (post === null) {
    throw new httpErrors.NotFound();
  }

  return c.json(post);
});

postRouter.get("/posts/:postId/comments", async (c) => {
  const posts = await Comment.findAll({
    limit: c.req.query("limit") != null ? Number(c.req.query("limit")) : undefined,
    offset: c.req.query("offset") != null ? Number(c.req.query("offset")) : undefined,
    where: {
      postId: c.req.param("postId"),
    },
  });

  return c.json(posts);
});

postRouter.post("/posts", async (c) => {
  const userId = c.get("session").get("userId");
  if (userId == undefined) {
    throw new httpErrors.Unauthorized();
  }

  const body = await c.req.json<{ text: string; images: Image[]; movie?: Movie; sound?: Sound }>();
  const post = await Post.create(
    {
      ...body,
      userId: userId,
    },
    {
      include: [
        {
          association: "images",
          through: { attributes: [] },
        },
        { association: "movie" },
        { association: "sound" },
      ],
    },
  );

  return c.json(post);
});
