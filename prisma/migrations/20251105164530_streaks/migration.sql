-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "lastStudyDate" TIMESTAMP(3),
ADD COLUMN     "streak" INTEGER NOT NULL DEFAULT 0;
