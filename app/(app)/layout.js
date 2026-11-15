import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDashboardData } from "@/utils/dashboard";
import AppShell from "@/components/app.layout";

export default async function AppLayout({ children }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const stats = await getDashboardData(session.user.id);

  return <AppShell initialStats={stats}>{children}</AppShell>;
}