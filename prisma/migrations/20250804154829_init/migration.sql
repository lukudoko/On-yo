-- CreateTable
CREATE TABLE "public"."Kanji" (
    "id" SERIAL NOT NULL,
    "character" TEXT NOT NULL,
    "strokes" INTEGER NOT NULL,
    "grade" INTEGER,
    "freq" INTEGER,
    "jlpt_new" INTEGER,
    "meanings" TEXT[],
    "readings_on" TEXT[],
    "readings_kun" TEXT[],
    "primary_onyomi" TEXT,
    "usefulness_score" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Kanji_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OnyomiGroup" (
    "id" SERIAL NOT NULL,
    "reading" TEXT NOT NULL,
    "usefulness_score" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "OnyomiGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Kanji_character_key" ON "public"."Kanji"("character");

-- CreateIndex
CREATE UNIQUE INDEX "OnyomiGroup_reading_key" ON "public"."OnyomiGroup"("reading");

-- AddForeignKey
ALTER TABLE "public"."Kanji" ADD CONSTRAINT "Kanji_primary_onyomi_fkey" FOREIGN KEY ("primary_onyomi") REFERENCES "public"."OnyomiGroup"("reading") ON DELETE SET NULL ON UPDATE CASCADE;
