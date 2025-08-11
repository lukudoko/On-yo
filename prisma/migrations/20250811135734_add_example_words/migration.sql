-- CreateTable
CREATE TABLE "public"."ExampleWord" (
    "id" SERIAL NOT NULL,
    "word" TEXT NOT NULL,
    "reading" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "kanjiId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExampleWord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExampleWord_word_key" ON "public"."ExampleWord"("word");

-- AddForeignKey
ALTER TABLE "public"."ExampleWord" ADD CONSTRAINT "ExampleWord_kanjiId_fkey" FOREIGN KEY ("kanjiId") REFERENCES "public"."Kanji"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
