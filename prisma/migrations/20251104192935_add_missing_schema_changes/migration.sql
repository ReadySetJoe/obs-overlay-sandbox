-- CreateTable
CREATE TABLE "Chatter" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "totalSentiment" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageSentiment" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "positiveMessages" INTEGER NOT NULL DEFAULT 0,
    "negativeMessages" INTEGER NOT NULL DEFAULT 0,
    "neutralMessages" INTEGER NOT NULL DEFAULT 0,
    "firstMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chatter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertConfig" (
    "id" TEXT NOT NULL,
    "layoutId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "imageUrl" TEXT,
    "imagePublicId" TEXT,
    "animationType" TEXT NOT NULL DEFAULT 'slide-down',
    "duration" INTEGER NOT NULL DEFAULT 5,
    "position" TEXT NOT NULL DEFAULT 'top-center',
    "soundUrl" TEXT,
    "soundPublicId" TEXT,
    "volume" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "messageTemplate" TEXT NOT NULL DEFAULT '{username} just {event}!',
    "fontSize" INTEGER NOT NULL DEFAULT 32,
    "textColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "textShadow" BOOLEAN NOT NULL DEFAULT true,
    "showBackground" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaintTemplateCustom" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "regions" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imagePublicId" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaintTemplateCustom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WheelConfig" (
    "id" TEXT NOT NULL,
    "layoutId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "segments" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "position" TEXT NOT NULL DEFAULT 'center',
    "scale" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "spinDuration" INTEGER NOT NULL DEFAULT 5,
    "soundEnabled" BOOLEAN NOT NULL DEFAULT true,
    "soundVolume" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WheelConfig_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Layout" ADD COLUMN     "backgroundBlur" INTEGER DEFAULT 0,
ADD COLUMN     "backgroundColors" TEXT,
ADD COLUMN     "backgroundImageName" TEXT,
ADD COLUMN     "backgroundImagePublicId" TEXT,
ADD COLUMN     "backgroundImageUrl" TEXT,
ADD COLUMN     "backgroundOpacity" DOUBLE PRECISION DEFAULT 1.0,
ADD COLUMN     "backgroundUploadedAt" TIMESTAMP(3),
ADD COLUMN     "chatHighlightVisible" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "eventLabelsData" TEXT,
ADD COLUMN     "eventLabelsVisible" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fontFamily" TEXT NOT NULL DEFAULT 'Inter',
ADD COLUMN     "streamStatsConfig" TEXT,
ADD COLUMN     "streamStatsData" TEXT,
ADD COLUMN     "streamStatsVisible" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "wheelVisible" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "weatherVisible" SET DEFAULT false,
ALTER COLUMN "chatVisible" SET DEFAULT false,
ALTER COLUMN "nowPlayingVisible" SET DEFAULT false,
ALTER COLUMN "countdownVisible" SET DEFAULT false,
ALTER COLUMN "paintByNumbersVisible" SET DEFAULT false;

-- CreateIndex
CREATE INDEX "Chatter_sessionId_averageSentiment_idx" ON "Chatter"("sessionId", "averageSentiment");

-- CreateIndex
CREATE INDEX "Chatter_sessionId_messageCount_idx" ON "Chatter"("sessionId", "messageCount");

-- CreateIndex
CREATE UNIQUE INDEX "Chatter_sessionId_username_key" ON "Chatter"("sessionId", "username");

-- CreateIndex
CREATE UNIQUE INDEX "AlertConfig_layoutId_eventType_key" ON "AlertConfig"("layoutId", "eventType");

-- AddForeignKey
ALTER TABLE "AlertConfig" ADD CONSTRAINT "AlertConfig_layoutId_fkey" FOREIGN KEY ("layoutId") REFERENCES "Layout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaintTemplateCustom" ADD CONSTRAINT "PaintTemplateCustom_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WheelConfig" ADD CONSTRAINT "WheelConfig_layoutId_fkey" FOREIGN KEY ("layoutId") REFERENCES "Layout"("id") ON DELETE CASCADE ON UPDATE CASCADE;
