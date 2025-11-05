-- AlterTable
ALTER TABLE "Layout" ADD COLUMN     "ttsVisible" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "TTSConfig" (
    "id" TEXT NOT NULL,
    "layoutId" TEXT NOT NULL,
    "voice" TEXT NOT NULL DEFAULT 'Google US English',
    "rate" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "pitch" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "volume" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "maxQueueSize" INTEGER NOT NULL DEFAULT 5,
    "showVisualizer" BOOLEAN NOT NULL DEFAULT true,
    "visualizerPosition" TEXT NOT NULL DEFAULT 'bottom-right',
    "visualizerStyle" TEXT NOT NULL DEFAULT 'waveform',
    "backgroundColor" TEXT NOT NULL DEFAULT '#000000',
    "textColor" TEXT NOT NULL DEFAULT '#ffffff',
    "filterProfanity" BOOLEAN NOT NULL DEFAULT true,
    "allowedSources" TEXT NOT NULL DEFAULT 'chat,alerts,manual',
    "position" TEXT NOT NULL DEFAULT 'bottom-right',
    "scale" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TTSConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TTSConfig_layoutId_key" ON "TTSConfig"("layoutId");

-- AddForeignKey
ALTER TABLE "TTSConfig" ADD CONSTRAINT "TTSConfig_layoutId_fkey" FOREIGN KEY ("layoutId") REFERENCES "Layout"("id") ON DELETE CASCADE ON UPDATE CASCADE;
