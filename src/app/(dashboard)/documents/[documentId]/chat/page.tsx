import { Suspense } from "react";
import ChatPageContent from "@/app/components/chat-page-content";
import { ChatPageSkeleton } from "@/app/components/skeletons";

export default async function DocumentChatPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<ChatPageSkeleton />}>
        <ChatPageContent documentId={documentId} />
      </Suspense>
    </div>
  );
}
