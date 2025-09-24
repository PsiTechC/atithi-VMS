"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Building2, Users, CreditCard, AlertTriangle, TrendingUp, Clock, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"

type DashboardStats = {
    totalClients: number
    activeClients: number
    expiredLicenses: number
    recentActivity: Array<{
        id: string
        action: string
        client: string
        time: string
        type: "success" | "warning" | "error" | "info"
    }>
    upcomingExpirations: Array<{
        id: string
        client: string
        expiresIn: string
        status: "warning" | "info"
    }>
}

export function SuperAdminOverview() {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchStats() {
            try {
                const response = await fetch('/api/super-admin/dashboard')
                if (!response.ok) {
                    throw new Error('Failed to fetch dashboard stats')
                }
                const data = await response.json()
                setStats(data)
            } catch (err: any) {
                setError(err.message || 'Failed to load dashboard data')
            } finally {
                setLoading(false)
            }
        }

        fetchStats()
    }, [])

    if (loading) {
        return (
            <div className="space-y-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground1">Dashboard Overview</h1>
                    <p className="text-muted-foreground font-semibold">Monitor and manage your entire client ecosystem</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <div className="h-4 bg-muted rounded animate-pulse"></div>
                                <div className="h-4 w-4 bg-muted rounded animate-pulse"></div>
                            </CardHeader>
                            <CardContent>
                                <div className="h-8 bg-muted rounded animate-pulse mb-2"></div>
                                <div className="h-3 bg-muted rounded animate-pulse w-3/4"></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    if (error || !stats) {
        return (
            <div className="space-y-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground1">Dashboard Overview</h1>
                    <p className="text-muted-foreground font-semibold">Monitor and manage your entire client ecosystem</p>
                </div>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-destructive">Error loading dashboard: {error}</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-3xl font-bold text-foreground1">Dashboard Overview</h1>
                <p className="text-muted-foreground font-semibold">Monitor and manage your entire client ecosystem</p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalClients}</div>
                        <p className="text-xs text-muted-foreground">
                            Live data from database
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeClients}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.totalClients > 0 ? Math.round((stats.activeClients / stats.totalClients) * 100) : 0}% of total
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Expired Licenses</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{stats.expiredLicenses}</div>
                        <p className="text-xs text-muted-foreground">Require immediate attention</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">NA</div>
                        <p className="text-xs text-muted-foreground">
                            Across all clients
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Recent Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Recent Activity
                        </CardTitle>
                        <CardDescription>Latest system events and client actions</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats.recentActivity.map((activity) => (
                                <div key={activity.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {activity.type === "success" && <CheckCircle className="h-4 w-4 text-green-600" />}
                                        {activity.type === "warning" && <AlertTriangle className="h-4 w-4 text-orange-600" />}
                                        {activity.type === "error" && <XCircle className="h-4 w-4 text-red-600" />}
                                        {activity.type === "info" && <Clock className="h-4 w-4 text-blue-600" />}
                                        <div>
                                            <p className="text-sm font-medium">{activity.action}</p>
                                            <p className="text-xs text-muted-foreground">{activity.client}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Upcoming Expirations */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Upcoming License Expirations
                        </CardTitle>
                        <CardDescription>Clients requiring license renewal attention</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats.upcomingExpirations.map((item) => (
                                <div key={item.id} className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium">{item.client}</p>
                                        <p className="text-xs text-muted-foreground">Expires in {item.expiresIn}</p>
                                    </div>
                                    <Badge variant={item.status === "warning" ? "destructive" : "secondary"}>{item.expiresIn}</Badge>
                                </div>
                            ))}
                            <Button variant="outline" className="w-full mt-4 bg-transparent">
                               {/* <Link href= "/super-admin/licenses"> */}
                               <Link href= "/super-admin/clients">
                                View All Licenses
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>Common administrative tasks</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-3">
                            <Button asChild variant="outline" className="flex items-center gap-2 h-10 w-50">
                                <Link href="/super-admin/clients/new">
                                    <Building2 className="h-4 w-4" />
                                    Add New Client
                                </Link>
                            </Button>
                            {/* <Button asChild variant="outline" className="flex items-center gap-2 h-10 w-50">
                                <Link href="/super-admin/licenses">
                                    <CreditCard className="h-4 w-4" />
                                    Manage Licenses
                                </Link>
                            </Button> */}
                            <Button asChild variant="outline" className="flex items-center gap-2 h-10 w-50">
                                <Link href="/super-admin/clients">
                                    <Users className="h-4 w-4" />
                                    Manage Clients
                                </Link>
                            </Button>
                            {/* <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                                <TrendingUp className="h-4 w-4" />
                                View Reports
                            </Button> */}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
