import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import { processDocument } from "@/lib/inngest-functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processDocument],
});