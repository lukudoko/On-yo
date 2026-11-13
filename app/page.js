import { getSession } from "@/lib/auth"
import { getDashboardData } from "@/utils/dashboard"
import DashboardContent from "./DashboardContent"
import { revalidateDashboard } from "./actions/dash"

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) return <div>Please sign in</div>

  const userId = session.user.id
  const dashboardData = await getDashboardData(userId)

  if (!dashboardData) return <div>Unable to load dashboard data.</div>

  return (
    <DashboardContent
      data={dashboardData}
      userEmail={session.user.email}
      onTrackChanged={revalidateDashboard}
    />
  )
}