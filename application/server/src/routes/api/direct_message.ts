import httpErrors from "http-errors";
import { col, where, Op } from "sequelize";

import { eventhub } from "@web-speed-hackathon-2026/server/src/eventhub";
import {
  DirectMessage,
  DirectMessageConversation,
  User,
} from "@web-speed-hackathon-2026/server/src/models";
import { Context, Hono } from "hono";
import { Env } from "../../env";
import { createNodeWebSocket } from "@hono/node-ws";

export const directMessageRouter = new Hono<Env>();

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app: directMessageRouter });

export { injectWebSocket, upgradeWebSocket };

directMessageRouter.get("/dm", async (c) => {
  const userId = c.get("session").get("userId");
  if (userId == undefined) {
    throw new httpErrors.Unauthorized();
  }

  const conversations = await DirectMessageConversation.findAll({
    where: {
      [Op.and]: [
        { [Op.or]: [{ initiatorId: userId }, { memberId: userId }] },
        where(col("messages.id"), { [Op.not]: null }),
      ],
    },
    order: [[col("messages.createdAt"), "DESC"]],
  });

  const sorted = conversations.map((c) => ({
    ...c.toJSON(),
    messages: c.messages?.reverse(),
  }));

  return c.json(sorted);
});

directMessageRouter.post("/dm", async (c) => {
  const userId = c.get("session").get("userId");
  if (userId == undefined) {
    throw new httpErrors.Unauthorized();
  }

  const body = await c.req.json();
  const peer = await User.findByPk(body?.peerId);
  if (peer === null) {
    throw new httpErrors.NotFound();
  }

  const [conversation] = await DirectMessageConversation.findOrCreate({
    where: {
      [Op.or]: [
        { initiatorId: userId, memberId: peer.id },
        { initiatorId: peer.id, memberId: userId },
      ],
    },
    defaults: {
      initiatorId: userId,
      memberId: peer.id,
    },
  });
  await conversation.reload();

  return c.json(conversation);
});

directMessageRouter.get(
  "/dm/unread",
  upgradeWebSocket(async (c: Context<Env>) => {
    const userId = c.get("session").get("userId");
    if (userId == undefined) {
      throw new httpErrors.Unauthorized();
    }

    return {
      onOpen: async (_e, ws) => {
        const unreadCount = await DirectMessage.count({
          distinct: true,
          where: {
            senderId: { [Op.ne]: userId },
            isRead: false,
          },
          include: [
            {
              association: "conversation",
              where: {
                [Op.or]: [{ initiatorId: userId }, { memberId: userId }],
              },
              required: true,
            },
          ],
        });

        ws.send(JSON.stringify({ type: "dm:unread", payload: { unreadCount } }));
      },
    };
  }),
);

directMessageRouter.get("/dm/:conversationId", async (c) => {
  const userId = c.get("session").get("userId");
  if (userId == undefined) {
    throw new httpErrors.Unauthorized();
  }

  const conversation = await DirectMessageConversation.findOne({
    where: {
      id: c.req.param("conversationId"),
      [Op.or]: [{ initiatorId: userId }, { memberId: userId }],
    },
  });
  if (conversation === null) {
    throw new httpErrors.NotFound();
  }

  return c.json(conversation);
});

directMessageRouter.get(
  "/dm/:conversationId",
  upgradeWebSocket(async (c: Context<Env>) => {
    const userId = c.get("session").get("userId");
    if (userId == undefined) {
      throw new httpErrors.Unauthorized();
    }

    const conversation = await DirectMessageConversation.findOne({
      where: {
        id: c.req.param("conversationId"),
        [Op.or]: [{ initiatorId: userId }, { memberId: userId }],
      },
    });
    if (conversation == null) {
      throw new httpErrors.NotFound();
    }

    const peerId =
      conversation.initiatorId !== userId ? conversation.initiatorId : conversation.memberId;

    let handleMessageUpdated = (_payload: unknown) => {};

    let handleTyping = (_payload: unknown) => {};

    return {
      onOpen: async (_e, ws) => {
        handleMessageUpdated = (payload: unknown) => {
          ws.send(JSON.stringify({ type: "dm:conversation:message", payload }));
        };
        eventhub.on(`dm:conversation/${conversation.id}:message`, handleMessageUpdated);

        handleTyping = (payload: unknown) => {
          ws.send(JSON.stringify({ type: "dm:conversation:typing", payload }));
        };
        eventhub.on(`dm:conversation/${conversation.id}:typing/${peerId}`, handleTyping);
      },
      onClose: () => {
        eventhub.off(`dm:conversation/${conversation.id}:message`, handleMessageUpdated);
        eventhub.off(`dm:conversation/${conversation.id}:typing/${peerId}`, handleTyping);
      },
    };
  }),
);

directMessageRouter.post("/dm/:conversationId/messages", async (c) => {
  const userId = c.get("session").get("userId");
  if (userId == undefined) {
    throw new httpErrors.Unauthorized();
  }

  const body: unknown = (await c.req.json())?.body;
  if (typeof body !== "string" || body.trim().length === 0) {
    throw new httpErrors.BadRequest();
  }

  const conversation = await DirectMessageConversation.findOne({
    where: {
      id: c.req.param("conversationId"),
      [Op.or]: [{ initiatorId: userId }, { memberId: userId }],
    },
  });
  if (conversation === null) {
    throw new httpErrors.NotFound();
  }

  const message = await DirectMessage.create({
    body: body.trim(),
    conversationId: conversation.id,
    senderId: userId,
  });
  await message.reload();

  return c.json(message);
});

directMessageRouter.post("/dm/:conversationId/read", async (c) => {
  const userId = c.get("session").get("userId");
  if (userId == undefined) {
    throw new httpErrors.Unauthorized();
  }

  const conversation = await DirectMessageConversation.findOne({
    where: {
      id: c.req.param("conversationId"),
      [Op.or]: [{ initiatorId: userId }, { memberId: userId }],
    },
  });
  if (conversation === null) {
    throw new httpErrors.NotFound();
  }

  const peerId =
    conversation.initiatorId !== userId ? conversation.initiatorId : conversation.memberId;

  await DirectMessage.update(
    { isRead: true },
    {
      where: { conversationId: conversation.id, senderId: peerId, isRead: false },
      individualHooks: true,
    },
  );

  return c.json({});
});

directMessageRouter.post("/dm/:conversationId/typing", async (c) => {
  const userId = c.get("session").get("userId");
  if (userId == undefined) {
    throw new httpErrors.Unauthorized();
  }

  const conversation = await DirectMessageConversation.findByPk(c.req.param("conversationId"));
  if (conversation === null) {
    throw new httpErrors.NotFound();
  }

  eventhub.emit(`dm:conversation/${conversation.id}:typing/${userId}`, {});

  return c.json({});
});
