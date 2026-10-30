-- AlterTable
ALTER TABLE "CollectionItem" ADD COLUMN "sourceUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "CollectionItem_sourceUrl_key" ON "CollectionItem"("sourceUrl");
