import { RoleGuard } from "@/components/auth/role-guard"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { SuperAdminSidebar } from "@/components/super-admin/sidebar"
import { ClientManagement } from "@/components/super-admin/client-management"

export default function ClientsPage() {
  return (
    <RoleGuard allowedRoles={["super-admin"]}>
      <DashboardLayout title="Admin Portal" sidebar={<SuperAdminSidebar />}>
        <ClientManagement />
      </DashboardLayout>
    </RoleGuard>
  )
}
