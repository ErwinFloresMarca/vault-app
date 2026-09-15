-- CreateTable
CREATE TABLE "UserWishlistItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserWishlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserWishlistItem_itemId_idx" ON "UserWishlistItem"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "UserWishlistItem_userId_itemId_key" ON "UserWishlistItem"("userId", "itemId");

-- AddForeignKey
ALTER TABLE "UserWishlistItem" ADD CONSTRAINT "UserWishlistItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWishlistItem" ADD CONSTRAINT "UserWishlistItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "CollectionItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
