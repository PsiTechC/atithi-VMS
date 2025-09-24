import { RoleGuard } from "@/components/auth/role-guard"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { VisitorManagement } from "@/components/client/visitor-management"

export default function VisitorsPage() {
  return (
    <RoleGuard allowedRoles={["client-admin", "client-user"]}>
      <DashboardLayout title="Client Portal" showHeaderNav={true}>
        <VisitorManagement />
      </DashboardLayout>
    </RoleGuard>
  )
}
