-- AlterTable
ALTER TABLE "TTSConfig" ADD COLUMN     "allowLinks" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "bannedWords" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "blockedUsers" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "requireApproval" BOOLEAN NOT NULL DEFAULT false;
