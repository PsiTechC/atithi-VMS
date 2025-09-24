// app/super-admin/clients/new/page.tsx (wrapper version)
import { RoleGuard } from "@/components/auth/role-guard"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { SuperAdminSidebar } from "@/components/super-admin/sidebar"
import NewClientForm from "@/components/super-admin/newclient" // move the big component above into ./_form.tsx and export default
import NewClientPage from "@/components/super-admin/newclient"

export default function NewClient() {
    return (
        <RoleGuard allowedRoles={["super-admin"]}>
            <DashboardLayout title="Admin Portal" sidebar={<SuperAdminSidebar />}>
                <NewClientPage />
            </DashboardLayout>
        </RoleGuard>
    )
}
