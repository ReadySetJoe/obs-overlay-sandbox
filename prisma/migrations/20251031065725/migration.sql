-- AlterTable
ALTER TABLE "Layout" ADD COLUMN     "paintByNumbersVisible" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "weatherEffect" SET DEFAULT 'rain',
ALTER COLUMN "componentLayouts" SET DEFAULT '{"chat":{"position":"top-left","x":0,"y":80,"maxWidth":400},"nowPlaying":{"position":"top-left","x":0,"y":0,"width":400},"countdown":{"position":"top-left","x":0,"y":0,"scale":1},"weather":{"density":1},"paintByNumbers":{"position":"top-left","x":0,"y":0,"scale":1,"gridSize":20}}';
