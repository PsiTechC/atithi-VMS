"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth/role-guard"
import { LayoutDashboard, Users, UserCheck, UserPlus, BarChart3, Settings, Building2, CreditCard } from "lucide-react"

const navigation = [
  {
    name: "Overview",
    href: "/client-dashboard",
    icon: LayoutDashboard,
    roles: ["client-admin", "client-user"],
  },
  {
    name: "Visitor Check-In",
    href: "/client-dashboard/check-in",
    icon: UserCheck,
    roles: ["client-admin", "client-user"],
  },
  {
    name: "Visitor Management",
    href: "/client-dashboard/visitors",
    icon: Users,
    roles: ["client-admin", "client-user"],
  },
  {
    name: "User Management",
    href: "/client-dashboard/users",
    icon: UserPlus,
    roles: ["client-admin"],
  },
  {
    name: "License",
    href: "/client-dashboard/license",
    icon: CreditCard,
    roles: ["client-admin"],
  },
  {
    name: "Reports",
    href: "/client-dashboard/reports",
    icon: BarChart3,
    roles: ["client-admin"],
  },
  {
    name: "Settings",
    href: "/client-dashboard/settings",
    icon: Settings,
    roles: ["client-admin"],
  },
]

export function ClientSidebar() {
  const pathname = usePathname()
  const { user } = useAuth()

  const filteredNavigation = navigation.filter((item) => item.roles.includes(user?.role || ""))

  return (
    <nav className="p-4 space-y-2">
      <div className="flex items-center gap-2 px-3 py-2 mb-4">
        <Building2 className="h-5 w-5 text-sidebar-primary" />
        <div>
          <span className="font-medium text-sidebar-foreground block">Client Portal</span>
          <span className="text-xs text-sidebar-foreground/70">Acme Corporation</span>
        </div>
      </div>

      {filteredNavigation.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.name}
          </Link>
        )
      })}
    </nav>
  )
}

