
// app/super-admin/page.tsx
import { RoleGuard } from "@/components/auth/role-guard"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { SuperAdminSidebar } from "@/components/super-admin/sidebar"
import { SuperAdminOverview } from "@/components/super-admin/overview"

export default function SuperAdminPage() {
  return (
    <RoleGuard allowedRoles={["super-admin"]}>
      <DashboardLayout title="Admin Portal" sidebar={<SuperAdminSidebar />}>
        <SuperAdminOverview />
      </DashboardLayout>
    </RoleGuard>
  )
}

