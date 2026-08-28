-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "CollectionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('DRAFT', 'AVAILABLE', 'SOLD_OUT', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "InventoryMovementType" AS ENUM ('IN', 'OUT', 'ADJUSTMENT', 'SALE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "lastLoginAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OAuthAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OAuthAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "path" TEXT,
    "mimeType" TEXT,
    "size" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "status" "CollectionStatus" NOT NULL DEFAULT 'DRAFT',
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionItem" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "soldQuantity" INTEGER NOT NULL DEFAULT 0,
    "status" "ItemStatus" NOT NULL DEFAULT 'DRAFT',
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollectionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionTag" (
    "collectionId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "CollectionTag_pkey" PRIMARY KEY ("collectionId","tagId")
);

-- CreateTable
CREATE TABLE "CollectionFile" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "alt" TEXT,

    CONSTRAINT "CollectionFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemFile" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "alt" TEXT,

    CONSTRAINT "ItemFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCollectedItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "obtainedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCollectedItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryMovement" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "type" "InventoryMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "OAuthAccount_userId_idx" ON "OAuthAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthAccount_provider_providerId_key" ON "OAuthAccount"("provider", "providerId");

-- CreateIndex
CREATE UNIQUE INDEX "File_url_key" ON "File"("url");

-- CreateIndex
CREATE INDEX "File_url_idx" ON "File"("url");

-- CreateIndex
CREATE UNIQUE INDEX "Collection_slug_key" ON "Collection"("slug");

-- CreateIndex
CREATE INDEX "Collection_status_idx" ON "Collection"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionItem_slug_key" ON "CollectionItem"("slug");

-- CreateIndex
CREATE INDEX "CollectionItem_collectionId_idx" ON "CollectionItem"("collectionId");

-- CreateIndex
CREATE INDEX "CollectionItem_status_idx" ON "CollectionItem"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

-- CreateIndex
CREATE INDEX "CollectionTag_tagId_idx" ON "CollectionTag"("tagId");

-- CreateIndex
CREATE INDEX "CollectionFile_fileId_idx" ON "CollectionFile"("fileId");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionFile_collectionId_fileId_key" ON "CollectionFile"("collectionId", "fileId");

-- CreateIndex
CREATE INDEX "ItemFile_fileId_idx" ON "ItemFile"("fileId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemFile_itemId_fileId_key" ON "ItemFile"("itemId", "fileId");

-- CreateIndex
CREATE INDEX "UserCollectedItem_itemId_idx" ON "UserCollectedItem"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "UserCollectedItem_userId_itemId_key" ON "UserCollectedItem"("userId", "itemId");

-- CreateIndex
CREATE INDEX "InventoryMovement_itemId_idx" ON "InventoryMovement"("itemId");

-- AddForeignKey
ALTER TABLE "OAuthAccount" ADD CONSTRAINT "OAuthAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionItem" ADD CONSTRAINT "CollectionItem_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionTag" ADD CONSTRAINT "CollectionTag_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionTag" ADD CONSTRAINT "CollectionTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionFile" ADD CONSTRAINT "CollectionFile_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionFile" ADD CONSTRAINT "CollectionFile_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemFile" ADD CONSTRAINT "ItemFile_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "CollectionItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemFile" ADD CONSTRAINT "ItemFile_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCollectedItem" ADD CONSTRAINT "UserCollectedItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCollectedItem" ADD CONSTRAINT "UserCollectedItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "CollectionItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "CollectionItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
