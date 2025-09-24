import { RoleGuard } from "@/components/auth/role-guard"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { SuperAdminSidebar } from "@/components/super-admin/sidebar"
import { LicenseManagement } from "@/components/super-admin/license-management"

export default function LicensesPage() {
  return (
    <RoleGuard allowedRoles={["super-admin"]}>
      <DashboardLayout title="Admin Portal" sidebar={<SuperAdminSidebar />}>
        <LicenseManagement />
      </DashboardLayout>
    </RoleGuard>
  )
}
