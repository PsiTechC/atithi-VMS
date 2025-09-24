// components/layout/dashboard-layout.tsx
"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/components/auth/role-guard"
import { LicenseGuard } from "@/components/license/license-guard"
import { LicenseStatus } from "@/components/license/license-status"
import { LogOut, Settings, User, CreditCard } from "lucide-react"
import { ClientHeaderNav } from "@/components/client/header-nav"

interface DashboardLayoutProps {
  children: React.ReactNode
  sidebar?: React.ReactNode
  title: string
  showHeaderNav?: boolean
}

// Mock license for header/aside footer (optional UI)
const mockHeaderLicense = {
  id: "license-1",
  type: "Enterprise",
  status: "active" as const,
  startDate: "2024-01-01",
  endDate: "2024-12-31",
  maxUsers: 50,
  currentUsers: 15,
  features: [],
  daysRemaining: 320,
}

export function DashboardLayout({ children, sidebar, title, showHeaderNav = false }: DashboardLayoutProps) {
  const { user } = useAuth()

  const handleLogout = () => {
    // TODO: hook into your real auth
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem("user")
      window.location.href = "/login"
    }
  }

  return (
    <LicenseGuard>
      <div className="flex min-h-screen bg-background">
        {/* Sidebar (only show if provided and not showing header nav) */}
        {sidebar && !showHeaderNav && (
          <aside className="w-64 bg-sidebar border-r border-sidebar-border">
            <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
              <h2 className="text-lg font-semibold text-sidebar-foreground">{title}</h2>
            </div>
            <div className="flex-1 overflow-y-auto">{sidebar}</div>
            {user?.role?.startsWith("client") && (
              <div className="p-4 border-t border-sidebar-border">
                <LicenseStatus license={mockHeaderLicense} showActions={false} compact={true} />
              </div>
            )}
          </aside>
        )}

        {/* Main column */}
        <div className="flex flex-1 flex-col">
          {/* Header: sticky, thicker (h-16), flush to very top */}
          <header className="sticky top-0 z-30 bg-card/80 backdrop-blur border-b border-border">
            <div className="flex items-center justify-between px-6 h-16">
              {/* Left side - Navigation or Title */}
              <div className="flex items-center">
                {showHeaderNav ? (
                  <ClientHeaderNav />
                ) : (
                  <h1 className="text-xl font-semibold">{title}</h1>
                )}
              </div>

              {/* Right side - User menu */}
              <div className="flex items-center gap-4">
                {/* Show client email next to avatar */}
                {user?.email && (
                  <span className="text-sm text-muted-foreground mr-2">{user.email}</span>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {user?.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <div className="flex items-center gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{user?.name}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                      </div>
                    </div>
                    {/* Only for client-user role: show Change Password */}
                    {user?.role === "client-user" && (
                      <>                       
                        <DropdownMenuItem asChild>
                          <a href="/client-dashboard/settings/change-user-password">Change Password</a>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} variant="destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </LicenseGuard>
  )
}
