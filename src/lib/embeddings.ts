import { google } from "@ai-sdk/google";
import { embed, embedMany } from "ai";
import { NonRetriableError } from "inngest";
import {
  GEMINI_EMBEDDING_DIMENSIONS,
  GEMINI_EMBEDDING_MODEL,
} from "./gemini";

type EmbeddingMode = "query" | "passage";

function googleEmbedOptions(mode: EmbeddingMode) {
  return {
    google: {
      taskType:
        mode === "query" ? ("RETRIEVAL_QUERY" as const) : ("RETRIEVAL_DOCUMENT" as const),
      outputDimensionality: GEMINI_EMBEDDING_DIMENSIONS,
    },
  };
}

function handleGeminiError(error: unknown): never {
  const message = error instanceof Error ? error.message : String(error);

  if (/API key|API_KEY|401|403|invalid/i.test(message)) {
    throw new NonRetriableError(
      "Invalid Gemini API key. Check GOOGLE_GENERATIVE_AI_API_KEY in .env.local"
    );
  }

  if (/quota|429|rate limit|RESOURCE_EXHAUSTED/i.test(message)) {
    throw new NonRetriableError(
      "Gemini quota exceeded. Check usage at https://aistudio.google.com"
    );
  }

  throw error;
}

export async function generateEmbedding(
  text: string,
  mode: EmbeddingMode = "query"
): Promise<number[]> {
  try {
    const { embedding } = await embed({
      model: google.embeddingModel(GEMINI_EMBEDDING_MODEL),
      value: text,
      providerOptions: googleEmbedOptions(mode),
    });
    return embedding;
  } catch (error) {
    handleGeminiError(error);
  }
}

export async function generateEmbeddings(
  texts: string[],
  mode: EmbeddingMode = "passage"
): Promise<number[][]> {
  if (texts.length === 0) return [];

  try {
    const { embeddings } = await embedMany({
      model: google.embeddingModel(GEMINI_EMBEDDING_MODEL),
      values: texts,
      maxParallelCalls: 2,
      providerOptions: googleEmbedOptions(mode),
    });
    return embeddings;
  } catch (error) {
    handleGeminiError(error);
  }
}
