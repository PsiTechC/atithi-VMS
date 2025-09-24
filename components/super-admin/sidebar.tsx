"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Building2, CreditCard, Users, Settings, Shield } from "lucide-react"

const navigation = [
    {
        name: "Overview",
        href: "/super-admin",
        icon: LayoutDashboard,
    },
    {
        name: "Client Management",
        href: "/super-admin/clients",
        icon: Building2,
    },
    // {
    //     name: "License Management",
    //     href: "/super-admin/licenses",
    //     icon: CreditCard,
    // },
    // {
    //     name: "User Activity",
    //     href: "/super-admin/activity",
    //     icon: Users,
    // },
    // {
    //     name: "System Settings",
    //     href: "/super-admin/settings",
    //     icon: Settings,
    // },
]

export function SuperAdminSidebar() {
    const pathname = usePathname()

    return (
        <nav className="p-4 space-y-2">
            <div className="flex items-center gap-2 px-3 py-2 mb-4">
                <Shield className="h-5 w-5 text-sidebar-primary" />
                <span className="font-medium text-sidebar-foreground">Super Admin</span>
            </div>

            {navigation.map((item) => {
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
