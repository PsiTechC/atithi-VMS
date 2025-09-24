import { RoleGuard } from "@/components/auth/role-guard"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { VisitorCheckIn } from "@/components/client/visitor-check-in"

export default function CheckInPage() {
  return (
    <RoleGuard allowedRoles={["client-admin", "client-user"]}>
      <DashboardLayout title="Client Portal" showHeaderNav={true}>
        <VisitorCheckIn />
      </DashboardLayout>
    </RoleGuard>
  )
}
