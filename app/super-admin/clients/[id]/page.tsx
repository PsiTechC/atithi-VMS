

import { RoleGuard } from "@/components/auth/role-guard"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { SuperAdminSidebar } from "@/components/super-admin/sidebar"
import EditClientPage from "@/components/super-admin/editclient"

export default function EditClient() {
    return (
        <RoleGuard allowedRoles={["super-admin"]}>
            <DashboardLayout title="Admin Portal" sidebar={<SuperAdminSidebar />}>
                <EditClientPage />
            </DashboardLayout>
        </RoleGuard>
    )
}
