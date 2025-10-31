/*
  Warnings:

  - You are about to drop the column `customColors` on the `Layout` table. All the data in the column will be lost.
  - You are about to drop the column `particlesVisible` on the `Layout` table. All the data in the column will be lost.
  - You are about to drop the column `visualizerSize` on the `Layout` table. All the data in the column will be lost.
  - You are about to drop the column `visualizerX` on the `Layout` table. All the data in the column will be lost.
  - You are about to drop the column `visualizerY` on the `Layout` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Layout" DROP COLUMN "customColors",
DROP COLUMN "particlesVisible",
DROP COLUMN "visualizerSize",
DROP COLUMN "visualizerX",
DROP COLUMN "visualizerY",
ADD COLUMN     "componentLayouts" TEXT DEFAULT '{"chat":{"position":"top-left","x":0,"y":80,"maxWidth":400},"nowPlaying":{"position":"top-left","x":0,"y":0,"width":400},"countdown":{"position":"top-left","x":0,"y":0,"scale":1},"weather":{"density":1}}',
ADD COLUMN     "countdownVisible" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "CountdownTimer" (
    "id" TEXT NOT NULL,
    "layoutId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CountdownTimer_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CountdownTimer" ADD CONSTRAINT "CountdownTimer_layoutId_fkey" FOREIGN KEY ("layoutId") REFERENCES "Layout"("id") ON DELETE CASCADE ON UPDATE CASCADE;
