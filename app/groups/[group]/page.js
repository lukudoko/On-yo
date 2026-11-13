import { getSession } from "@/lib/auth";
import { getOnyomiGroupKanji } from "@/services/progress/onyomiService";
import { ProgressService } from "@/services/progress";
import { prisma } from "@/lib/prisma";
import GroupDetailClient from "./GroupDetailClient";

export default async function GroupDetailPage({ params, searchParams }) {
  const session = await getSession();
  if (!session) return <div>Please sign in</div>;
  const userId = session.user.id;
  const { group: rawGroup } = await params;
  const onyomi = decodeURIComponent(rawGroup).normalize('NFC');
  const queryParams = await searchParams;
  const jlptParam = queryParams.jlpt || null;


  const groupKanji = await getOnyomiGroupKanji(onyomi, jlptParam);

  if (!groupKanji || groupKanji.length === 0) {
    return <div>No kanji found for this onyomi{jlptParam ? ` and JLPT ${jlptParam}` : ''}.</div>;
  }

  const kanjiCharacters = groupKanji.map(k => k.kanji);
  const masteryLevels = await ProgressService.getBatchKanjiMastery(userId, kanjiCharacters);

  const kanjiIds = await getKanjiIdsByCharacters(kanjiCharacters);

  const enrichedKanji = groupKanji.map(k => ({
    ...k,
    id: kanjiIds[k.kanji],
  }));

  return (
    <GroupDetailClient
      onyomi={onyomi}
      groupKanji={enrichedKanji}
      masteryLevels={masteryLevels}
      jlptFilter={jlptParam?.replace("N", "") || null}
    />
  );
}

async function getKanjiIdsByCharacters(chars) {
  const kanjiList = await prisma.kanji.findMany({
    where: { character: { in: chars } },
    select: { id: true, character: true },
  });
  const map = {};
  kanjiList.forEach(k => { map[k.character] = k.id; });
  return map;
}