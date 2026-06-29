import { auth } from "@clerk/nextjs/server";
import { google } from "@ai-sdk/google";
import {
  convertToModelMessages,
  streamText,
  type UIMessage,
} from "ai";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { retrieveRelevantChunks } from "@/lib/retrieval";
import { buildSystemPrompt } from "@/lib/prompt";
import { GEMINI_CHAT_MODEL, CHAT_TEMPERATURE } from "@/lib/gemini";
import { CHAT_HISTORY_LIMIT } from "@/lib/config";

export const maxDuration = 60;

function getLastUserMessageText(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (message.role !== "user") continue;

    const text = message.parts
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("");

    if (text.trim()) return text.trim();
  }

  return "";
}

function trimChatHistory(messages: UIMessage[]): UIMessage[] {
  if (messages.length <= CHAT_HISTORY_LIMIT) return messages;
  return messages.slice(-CHAT_HISTORY_LIMIT);
}

function dbMessageToUIMessage(message: {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
}): UIMessage {
  return {
    id: message.id,
    role: message.role === "USER" ? "user" : "assistant",
    parts: [{ type: "text", text: message.content }],
  };
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as {
      messages: UIMessage[];
      documentId: string;
      chatId?: string;
    };

    const { messages, documentId, chatId } = body;

    if (!documentId || !messages?.length) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const userQuery = getLastUserMessageText(messages);
    if (!userQuery) {
      return NextResponse.json({ error: "No user message" }, { status: 400 });
    }

    const [document, chat] = await Promise.all([
      prisma.document.findFirst({
        where: { id: documentId, userId },
      }),
      (async () => {
        const existing = chatId
          ? await prisma.chat.findFirst({
              where: { id: chatId, userId, documentId },
            })
          : null;
        if (existing) return existing;
        return prisma.chat.create({ data: { userId, documentId } });
      })(),
    ]);

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (document.status !== "READY") {
      return NextResponse.json(
        { error: "Document is not ready for chat" },
        { status: 400 }
      );
    }

    const [chunks] = await Promise.all([
      retrieveRelevantChunks(userQuery, documentId, userId),
      prisma.message
        .create({
          data: { chatId: chat.id, role: "USER", content: userQuery },
        })
        .catch(() => {
          /* duplicate send on retry */
        }),
    ]);

    const system = buildSystemPrompt(chunks, document.filename);
    const trimmedMessages = trimChatHistory(messages);

    const result = streamText({
      model: google(GEMINI_CHAT_MODEL),
      system,
      messages: await convertToModelMessages(trimmedMessages),
      temperature: CHAT_TEMPERATURE,
      maxOutputTokens: 2048,
      onFinish: async ({ text }) => {
        if (!text.trim()) return;

        await prisma.message.create({
          data: {
            chatId: chat.id,
            role: "ASSISTANT",
            content: text,
          },
        });
      },
    });

    return result.toTextStreamResponse({
      headers: {
        "X-Chat-Id": chat.id,
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Failed to process chat" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const documentId = searchParams.get("documentId");
  const chatId = searchParams.get("chatId");

  if (!documentId) {
    return NextResponse.json({ error: "documentId required" }, { status: 400 });
  }

  const document = await prisma.document.findFirst({
    where: { id: documentId, userId },
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  let chat = chatId
    ? await prisma.chat.findFirst({
        where: { id: chatId, userId, documentId },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      })
    : await prisma.chat.findFirst({
        where: { userId, documentId },
        orderBy: { createdAt: "desc" },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });

  if (!chat) {
    return NextResponse.json({ chatId: null, messages: [] });
  }

  return NextResponse.json({
    chatId: chat.id,
    messages: chat.messages.map(dbMessageToUIMessage),
  });
}
