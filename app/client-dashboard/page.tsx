import { RoleGuard } from "@/components/auth/role-guard"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ClientOverview } from "@/components/client/overview"

export default function ClientDashboardPage() {
  return (
    <RoleGuard allowedRoles={["client-admin", "client-user"]}>
      <DashboardLayout title="Client Portal" showHeaderNav={true}>
        <ClientOverview />
      </DashboardLayout>
    </RoleGuard>
  )
}
