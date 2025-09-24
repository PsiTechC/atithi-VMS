"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, CreditCard, Lock, Mail } from "lucide-react"

interface LicenseInfo {
  id: string
  status: "active" | "expired" | "expiring_soon" | "suspended"
  daysRemaining: number
  maxUsers: number
  currentUsers: number
}

interface LicenseGuardProps {
  children: React.ReactNode
  requiredFeatures?: string[]
  fallbackComponent?: React.ReactNode
}

// Mock license check - in real app this would be from API/context
function useLicenseStatus(): { license: LicenseInfo | null; loading: boolean } {
  const [license, setLicense] = useState<LicenseInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock license check based on current user/client
    const mockLicense: LicenseInfo = {
      id: "license-1",
      status: "active", // Change to "expired" or "suspended" to test
      daysRemaining: 45,
      maxUsers: 50,
      currentUsers: 15,
    }

    setTimeout(() => {
      setLicense(mockLicense)
      setLoading(false)
    }, 500)
  }, [])

  return { license, loading }
}

export function LicenseGuard({ children, requiredFeatures = [], fallbackComponent }: LicenseGuardProps) {
  const { license, loading } = useLicenseStatus()

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Checking license...</p>
        </div>
      </div>
    )
  }

  if (!license) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Unable to verify license status. Please contact support.</AlertDescription>
        </Alert>
      </div>
    )
  }

  // Check if license is expired or suspended
  if (license.status === "expired" || license.status === "suspended") {
    if (fallbackComponent) {
      return <>{fallbackComponent}</>
    }

    return (
      <div className="p-6 space-y-6">
        <Alert variant="destructive">
          <Lock className="h-4 w-4" />
          <AlertDescription>
            {license.status === "expired"
              ? "Your license has expired. Please renew to continue using the service."
              : "Your license has been suspended. Please contact support for assistance."}
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              License Required
            </CardTitle>
            <CardDescription>
              {license.status === "expired"
                ? "Your access has been restricted due to an expired license."
                : "Your access has been restricted due to license suspension."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">What you can do:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Contact your administrator to renew the license</li>
                <li>• Reach out to support for assistance</li>
                <li>• Check your email for renewal notifications</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                {license.status === "expired" ? "Renew License" : "Contact Support"}
              </Button>
              <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                <Mail className="h-4 w-4" />
                Email Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if approaching user limit
  const userUsagePercentage = (license.currentUsers / license.maxUsers) * 100
  const showUserLimitWarning = userUsagePercentage > 90

  // Show expiring soon warning
  const showExpiringWarning = license.status === "expiring_soon" || license.daysRemaining < 30

  return (
    <div className="space-y-4">
      {showExpiringWarning && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            Your license expires in {license.daysRemaining} days. Please renew soon to avoid service interruption.
          </AlertDescription>
        </Alert>
      )}

      {showUserLimitWarning && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            You are approaching your user limit ({license.currentUsers}/{license.maxUsers} users). Consider upgrading
            your license.
          </AlertDescription>
        </Alert>
      )}

      {children}
    </div>
  )
}
