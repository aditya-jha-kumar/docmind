-- CreateIndex
CREATE INDEX "chats_userId_documentId_idx" ON "chats"("userId", "documentId");

-- CreateIndex
CREATE INDEX "document_chunks_documentId_idx" ON "document_chunks"("documentId");

-- CreateIndex
CREATE INDEX "document_chunks_pineconeId_idx" ON "document_chunks"("pineconeId");

-- CreateIndex
CREATE INDEX "documents_userId_createdAt_idx" ON "documents"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "messages_chatId_createdAt_idx" ON "messages"("chatId", "createdAt");
