"use server";

import { auth } from "@trigger.dev/sdk";
import { chat } from "@trigger.dev/sdk/ai";

/** Starts (or resumes) a durable session of the `overtaxed` chat agent. */
export const startChatSession = chat.createStartSessionAction("overtaxed");

/** Mints a short-lived public token scoped to a single chat session. */
export async function mintChatAccessToken(chatId: string) {
  return auth.createPublicToken({
    scopes: {
      read: { sessions: [chatId] },
      write: { sessions: [chatId] },
    },
    expirationTime: "1h",
  });
}
