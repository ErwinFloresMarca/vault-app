-- CreateEnum
CREATE TYPE "Rarity" AS ENUM ('COMMON', 'RARE', 'EPIC', 'LEGENDARY');

-- AlterTable
ALTER TABLE "CollectionItem" ADD COLUMN     "rarity" "Rarity" NOT NULL DEFAULT 'COMMON';
