import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { triggerDocumentProcessing } from "@/lib/document-processing";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { filename, fileUrl, fileSize } = await req.json();

    const existing = await prisma.document.findFirst({
      where: { userId, fileUrl },
    });
    if (existing) {
      return NextResponse.json({ documentId: existing.id });
    }

    const document = await prisma.document.create({
      data: {
        userId,
        filename,
        fileUrl,
        fileSize,
        status: "PROCESSING",
      },
    });

    console.log("✅ Document created:", document.id);

    void triggerDocumentProcessing({
      documentId: document.id,
      fileUrl,
      userId,
    });

    console.log("✅ Inngest event sent for:", document.id);

    return NextResponse.json({ documentId: document.id });

  } catch (error) {
    console.error("❌ Document creation failed:", error);
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 }
    );
  }
}