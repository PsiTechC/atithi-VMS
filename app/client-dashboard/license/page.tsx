import { RoleGuard } from "@/components/auth/role-guard"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { LicenseStatus } from "@/components/license/license-status"

// Mock license data - in real app this would come from API
const mockLicense = {
  id: "license-1",
  type: "Enterprise",
  status: "active" as const,
  startDate: "2024-01-01",
  endDate: "2024-12-31",
  maxUsers: 50,
  currentUsers: 15,
  features: [
    "Visitor Management",
    "User Management",
    "Advanced Reporting",
    "API Access",
    "Priority Support",
    "Custom Branding",
  ],
  daysRemaining: 320,
}

export default function LicensePage() {
  return (
    <RoleGuard allowedRoles={["client-admin"]}>
      <DashboardLayout title="Client Portal" showHeaderNav={true}>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">License Management</h1>
            <p className="text-muted-foreground">View your current license status and usage details</p>
          </div>

          <LicenseStatus license={mockLicense} />
        </div>
      </DashboardLayout>
    </RoleGuard>
  )
}
