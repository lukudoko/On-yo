import { getSession } from "@/lib/auth";
import { getTestableKanji, prepareReviewItems } from "@/utils/tests/kanjitests";
import ReviewClient from "./ReviewClient";

export default async function ReviewPage() {
  const session = await getSession();
  if (!session) return <div>Please sign in</div>;

  const userId = session.user.id;

  const allTestable = await getTestableKanji(userId);

  if (!allTestable || allTestable.length < 15) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">You’ve tested all your kanji (for now!)</div>
      </div>
    );
  }

  const kanji = await prepareReviewItems(allTestable, userId);

  return <ReviewClient testData={kanji} />;
}