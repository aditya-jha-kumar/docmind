import { Pinecone } from "@pinecone-database/pinecone";
import { GEMINI_EMBEDDING_DIMENSIONS } from "./gemini";

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

export const PINECONE_INDEX_NAME =
  process.env.PINECONE_INDEX ?? "knowledge-base";

let indexReadyPromise: Promise<void> | null = null;

export async function ensurePineconeIndex(): Promise<void> {
  if (!indexReadyPromise) {
    indexReadyPromise = createIndexIfMissing();
  }
  await indexReadyPromise;
}

async function createIndexIfMissing(): Promise<void> {
  const { indexes } = await pinecone.listIndexes();
  const exists = indexes?.some((index) => index.name === PINECONE_INDEX_NAME);

  if (exists) return;

  await pinecone.createIndex({
    name: PINECONE_INDEX_NAME,
    dimension: GEMINI_EMBEDDING_DIMENSIONS,
    metric: "cosine",
    spec: {
      serverless: {
        cloud: (process.env.PINECONE_CLOUD as "aws" | "gcp" | "azure") ?? "aws",
        region: process.env.PINECONE_REGION ?? "us-east-1",
      },
    },
    waitUntilReady: true,
  });
}

export async function getPineconeIndex() {
  await ensurePineconeIndex();
  return pinecone.index(PINECONE_INDEX_NAME);
}

/** @deprecated Use getPineconeIndex() so the index is created if missing */
export const pineconeIndex = pinecone.index(PINECONE_INDEX_NAME);
