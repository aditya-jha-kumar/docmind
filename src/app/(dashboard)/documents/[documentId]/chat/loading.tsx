import { ChatPageSkeleton } from "@/app/components/skeletons";

export default function ChatLoading() {
  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
      <ChatPageSkeleton />
    </div>
  );
}
