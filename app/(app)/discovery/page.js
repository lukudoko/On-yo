import { getSession } from "@/lib/auth";
import { getUserTrack } from "@/lib/userOptions";
import { getDiscoveryKanji } from "@/utils/tests/discovery";
import { getUserJlptLevel } from "@/utils/jlpt";
import DiscoveryClient from "./DiscoveryClient";
import EmptyDiscoveryState from "./EmptyDiscoveryState";

export default async function DiscoveryPage() {
  const session = await getSession();
  if (!session) return <div>Please sign in</div>;

  const userId = session.user.id;
  const track = await getUserTrack(userId);
  const jlptLevel = track === 'jlpt' ? await getUserJlptLevel(userId) : 5;

  const discoveryKanji = await getDiscoveryKanji(userId, track, jlptLevel, 7);

  if (discoveryKanji.length === 0) {
    const message =
      track === 'jlpt'
        ? `You've discovered all kanji in JLPT N${jlptLevel}! Keep reviewing to unlock the next level.`
        : "You've discovered all available kanji! Master more kanji in your review tests to unlock new groups.";
    return <EmptyDiscoveryState message={message} />;
  }

  const shuffled = [...discoveryKanji].sort(() => Math.random() - 0.5);
  const formatted = shuffled.map(k => ({
    kanjiId: k.id,
    testType: 'write-in',
    correctAnswer: k.onyomi,
    hints: k.knownPeers,
    masteryLevel: 0,
    kanji: {
      character: k.character,
      primary_onyomi: k.onyomi,
      jlpt: k.jlpt,
    },
  }));

  return <DiscoveryClient testData={formatted} />;
}