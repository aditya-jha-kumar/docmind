import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { retrieveRelevantChunks } from "@/lib/retrieval";

const bodySchema = z.object({
  documentId: z.string(),
  chatId: z.string().optional(),
  message: z.string().min(1),
});

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = bodySchema.parse(await request.json());

  const document = await prisma.document.findFirst({
    where: { id: body.documentId, userId },
  });

  if (!document) {
    return new Response("Document not found", { status: 404 });
  }

  if (document.status !== "READY") {
    return new Response("Document is not ready for chat", { status: 400 });
  }

  const chunks = await retrieveRelevantChunks(
    body.message,
    document.id,
    userId,
  );
  const context = chunks.map((chunk) => chunk.content).join("\n\n");

  let chat =
    body.chatId != null
      ? await prisma.chat.findFirst({
          where: { id: body.chatId, userId, documentId: document.id },
        })
      : null;

  if (!chat) {
    chat = await prisma.chat.create({
      data: { userId, documentId: document.id },
    });
  }

  await prisma.message.create({
    data: {
      chatId: chat.id,
      role: "USER",
      content: body.message,
    },
  });

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system:
      "You are a helpful assistant answering questions about a PDF document. Answer using only the provided context. If the context does not contain the answer, say you do not know.",
    prompt: `Context:\n${context || "No relevant context found."}\n\nQuestion: ${body.message}`,
    onFinish: async ({ text }) => {
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
    headers: { "X-Chat-Id": chat.id },
  });
}
