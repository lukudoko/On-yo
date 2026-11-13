import { getSession } from "@/lib/auth";
import VocabClient from "./VocabClient";

export default async function VocabPage() {
  const session = await getSession();
  if (!session) return <div>Please sign in</div>;

  return <VocabClient />;
}