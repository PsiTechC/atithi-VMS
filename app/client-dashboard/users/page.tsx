import { RoleGuard } from "@/components/auth/role-guard"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserManagement } from "@/components/client/user-management"

export default function UsersPage() {
  return (
    <RoleGuard allowedRoles={["client-admin"]}>
      <DashboardLayout title="Client Portal" showHeaderNav={true}>
        <UserManagement />
      </DashboardLayout>
    </RoleGuard>
  )
}
