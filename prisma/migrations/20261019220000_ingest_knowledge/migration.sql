-- CreateTable
CREATE TABLE "StagedDocument" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "ext" TEXT NOT NULL,
    "uploaderId" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'STAGED',
    "data" BYTEA NOT NULL,

    CONSTRAINT "StagedDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestedDocument" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "cleaned" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IngestedDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IngestedDocument_sourceId_key" ON "IngestedDocument"("sourceId");

-- CreateIndex
CREATE INDEX "StagedDocument_status_idx" ON "StagedDocument"("status");

-- AddForeignKey
ALTER TABLE "IngestedDocument" ADD CONSTRAINT "IngestedDocument_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "StagedDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
