-- CreateTable
CREATE TABLE "ItemSpec" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "scale" TEXT,
    "material" TEXT,
    "lighting" TEXT,
    "base" TEXT,

    CONSTRAINT "ItemSpec_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ItemSpec_itemId_key" ON "ItemSpec"("itemId");

-- AddForeignKey
ALTER TABLE "ItemSpec" ADD CONSTRAINT "ItemSpec_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "CollectionItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
