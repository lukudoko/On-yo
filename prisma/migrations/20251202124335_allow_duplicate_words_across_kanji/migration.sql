/*
  Warnings:

  - A unique constraint covering the columns `[word,kanjiId]` on the table `ExampleWord` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."ExampleWord_word_key";

-- CreateIndex
CREATE UNIQUE INDEX "ExampleWord_word_kanjiId_key" ON "public"."ExampleWord"("word", "kanjiId");
