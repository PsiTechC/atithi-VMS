"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CreditCard, Calendar, Users, AlertTriangle, CheckCircle, Clock, Mail } from "lucide-react"

interface LicenseInfo {
  id: string
  type: string
  status: "active" | "expired" | "expiring_soon" | "suspended"
  startDate: string
  endDate: string
  maxUsers: number
  currentUsers: number
  features: string[]
  daysRemaining: number
}

interface LicenseStatusProps {
  license: LicenseInfo
  showActions?: boolean
  compact?: boolean
}

export function LicenseStatus({ license, showActions = true, compact = false }: LicenseStatusProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
      case "expired":
        return <Badge variant="destructive">Expired</Badge>
      case "expiring_soon":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Expiring Soon</Badge>
      case "suspended":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Suspended</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "expired":
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      case "expiring_soon":
        return <Clock className="h-5 w-5 text-orange-600" />
      case "suspended":
        return <AlertTriangle className="h-5 w-5 text-gray-600" />
      default:
        return <CreditCard className="h-5 w-5 text-muted-foreground" />
    }
  }

  const userUsagePercentage = (license.currentUsers / license.maxUsers) * 100

  if (compact) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(license.status)}
              <div>
                <p className="font-medium">{license.type} License</p>
                <p className="text-sm text-muted-foreground">
                  {license.currentUsers}/{license.maxUsers} users
                </p>
              </div>
            </div>
            <div className="text-right">
              {getStatusBadge(license.status)}
              <p className="text-xs text-muted-foreground mt-1">
                {license.status === "expired" ? "Expired" : `${license.daysRemaining} days left`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* License Status Alert */}
      {license.status === "expired" && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Your license has expired. Please contact your administrator to renew your license and restore full access.
          </AlertDescription>
        </Alert>
      )}

      {license.status === "expiring_soon" && (
        <Alert className="border-orange-200 bg-orange-50">
          <Clock className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            Your license expires in {license.daysRemaining} days. Please renew soon to avoid service interruption.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            License Information
          </CardTitle>
          <CardDescription>Current license status and usage details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* License Overview */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">License Type:</span>
                <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">{license.type}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status:</span>
                {getStatusBadge(license.status)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Start Date:</span>
                <span className="text-sm">{new Date(license.startDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">End Date:</span>
                <span className="text-sm">{new Date(license.endDate).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Days Remaining:</span>
                <span className={`text-sm font-medium ${license.daysRemaining < 30 ? "text-orange-600" : ""}`}>
                  {license.status === "expired" ? "Expired" : `${license.daysRemaining} days`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">User Limit:</span>
                <span className="text-sm">{license.maxUsers} users</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current Usage:</span>
                <span className="text-sm">
                  {license.currentUsers}/{license.maxUsers} users
                </span>
              </div>
            </div>
          </div>

          {/* User Usage Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                User Usage
              </span>
              <span className="text-sm text-muted-foreground">{Math.round(userUsagePercentage)}%</span>
            </div>
            <Progress value={userUsagePercentage} className="h-2" />
            {userUsagePercentage > 90 && <p className="text-xs text-orange-600">Warning: Approaching user limit</p>}
          </div>

          {/* License Features */}
          <div className="space-y-2">
            <span className="text-sm font-medium">Included Features:</span>
            <div className="flex flex-wrap gap-2">
              {license.features.map((feature, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex flex-wrap gap-3 pt-4 border-t">
              {license.status === "expired" && (
                <Button className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Renew License
                </Button>
              )}
              {license.status === "expiring_soon" && (
                <Button className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Extend License
                </Button>
              )}
              <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                <Mail className="h-4 w-4" />
                Contact Support
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
