import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import { processDocument } from "@/inngest/functions/process-document";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processDocument],
});
