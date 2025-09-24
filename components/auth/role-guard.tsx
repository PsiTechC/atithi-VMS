"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { redirect } from "next/navigation"

export type UserRole = "super-admin" | "client-admin" | "client-user"

interface User {
    id: string
    email: string
    role: UserRole
    clientId?: string
    name: string
}

interface RoleGuardProps {
    allowedRoles: UserRole[]
    children: React.ReactNode
    fallbackPath?: string
}

// Mock authentication context - in real app this would be a proper auth provider
export function useAuth() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Mock authentication check
        const mockUser = getCurrentUser()
        setUser(mockUser)
        setLoading(false)
    }, [])

    return { user, loading, setUser }
}

function getCurrentUser(): User | null {
    // Keep super-admin mock credential for development/testing
    if (typeof window === "undefined") return null

    const path = window.location.pathname
    if (path.includes("super-admin")) {
        return {
            id: "1",
            email: "superadmin@system.com",
            role: "super-admin",
            name: "Super Administrator",
        }
    }

    // For client users, fetch live session data
    if (path.includes("client-dashboard")) {
        // Try to get live user from session
        try {
            const userStr = window.sessionStorage.getItem("user")
            if (userStr) {
                const user = JSON.parse(userStr)
                if (user && (user.role === "client-admin" || user.role === "client-user")) {
                    return user
                }
            }
        } catch {}
    }
    return null
}

export function RoleGuard({ allowedRoles, children, fallbackPath = "/login" }: RoleGuardProps) {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-2">Loading...</p>
                </div>
            </div>
        )
    }

    if (!user || !allowedRoles.includes(user.role)) {
        redirect(fallbackPath)
    }

    return <>{children}</>
}
