import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGroupsData, getAggregatedStats } from "@/lib/groups";
import GroupsPageClient from "./GroupsPageClient";

const INITIAL_BATCH = 30;

export default async function GroupsPage({ searchParams }) {
  const session = await getSession();
  if (!session) return <div>Please sign in</div>;

  const userId = session.user.id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { track: true },
  });
  const track = user?.track || "stat";

  const params = await searchParams;
  const jlptLevel = params.jlpt || null;

  const allGroups = await getGroupsData(userId, track, jlptLevel);

  const totalStats = {
    totalGroups: allGroups.length,
    totalKanji: allGroups.reduce((sum, g) => sum + g.total, 0),
    mastered: allGroups.reduce((sum, g) => sum + g.mastered, 0),
    learning: allGroups.reduce((sum, g) => sum + g.learning, 0),
  };

  const initialGroups = allGroups.slice(0, INITIAL_BATCH);

  return (
    <GroupsPageClient
      initialGroups={initialGroups}
      totalStats={totalStats}
      allGroupsLength={allGroups.length}   
      track={track}
      jlptLevel={jlptLevel}
      batchSize={INITIAL_BATCH}
    />
  );
}