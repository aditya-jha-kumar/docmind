import path from "node:path";
import { pathToFileURL } from "node:url";
import { PDFParse } from "pdf-parse";

let workerConfigured = false;

function ensurePdfWorker() {
  if (workerConfigured) return;

  const workerPath = path.join(
    process.cwd(),
    "node_modules/pdf-parse/dist/pdf-parse/esm/pdf.worker.mjs"
  );
  PDFParse.setWorker(pathToFileURL(workerPath).href);
  workerConfigured = true;
}

export async function extractTextFromPDF(fileUrl: string): Promise<{
  text: string;
  pageCount: number;
}> {
  ensurePdfWorker();

  const response = await fetch(fileUrl);
  const buffer = await response.arrayBuffer();

  const parser = new PDFParse({ data: Buffer.from(buffer) });

  try {
    const textResult = await parser.getText();
    return {
      text: textResult.text,
      pageCount: textResult.total,
    };
  } finally {
    await parser.destroy();
  }
}
