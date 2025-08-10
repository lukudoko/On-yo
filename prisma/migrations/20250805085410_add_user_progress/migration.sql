-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserProgress" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "kanjiId" INTEGER NOT NULL,
    "masteryLevel" INTEGER NOT NULL DEFAULT 0,
    "lastStudied" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserProgress_userId_kanjiId_key" ON "public"."UserProgress"("userId", "kanjiId");

-- AddForeignKey
ALTER TABLE "public"."UserProgress" ADD CONSTRAINT "UserProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserProgress" ADD CONSTRAINT "UserProgress_kanjiId_fkey" FOREIGN KEY ("kanjiId") REFERENCES "public"."Kanji"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
