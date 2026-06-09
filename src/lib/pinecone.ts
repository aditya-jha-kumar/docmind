import { Pinecone } from "@pinecone-database/pinecone";

const globalForPinecone = globalThis as unknown as {
  pinecone: Pinecone | undefined;
};

function createPineconeClient() {
  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey) {
    throw new Error("PINECONE_API_KEY is not set");
  }

  return new Pinecone({ apiKey });
}

export function getPinecone() {
  if (!globalForPinecone.pinecone) {
    globalForPinecone.pinecone = createPineconeClient();
  }

  return globalForPinecone.pinecone;
}

export function getPineconeIndex() {
  const indexName = process.env.PINECONE_INDEX;
  if (!indexName) {
    throw new Error("PINECONE_INDEX is not set");
  }

  return getPinecone().index({ name: indexName });
}
