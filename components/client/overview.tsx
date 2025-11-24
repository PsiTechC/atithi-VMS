
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { UserCheck, Users, Calendar, CheckCircle, XCircle, AlertCircle, Settings, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

type TopPurpose = { name: string; count: number } | null

export function ClientOverview() {
  const [recentVisitors, setRecentVisitors] = useState<any[]>([])
  const [recentLoading, setRecentLoading] = useState(true)
  const [recentError, setRecentError] = useState("")

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [todayCount, setTodayCount] = useState<number>(0)
  const [onSiteCount, setOnSiteCount] = useState<number>(0)
  const [thisMonthCount, setThisMonthCount] = useState<number>(0)
  const [lastMonthCount, setLastMonthCount] = useState<number>(0)
  const [monthPercent, setMonthPercent] = useState<number>(0)
  const [topPurpose, setTopPurpose] = useState<TopPurpose>(null)

  useEffect(() => {
    async function loadOverview() {
      setLoading(true)
      setError("")
      setRecentLoading(true)
      setRecentError("")

      try {
        const res = await fetch("/api/visitor-pass/overview?recentLimit=50")
        if (!res.ok) throw new Error("Failed to fetch overview")
        const data = await res.json()

        setTodayCount(data.todayCount ?? 0)
        setOnSiteCount(data.onSiteCount ?? 0)
        setThisMonthCount(data.thisMonthCount ?? 0)
        setLastMonthCount(data.lastMonthCount ?? 0)
        setMonthPercent(data.monthPercent ?? 0)
        setTopPurpose(data.topPurpose ?? null)
        setRecentVisitors(Array.isArray(data.recentVisitors) ? data.recentVisitors : [])
      } catch (err: any) {
        const msg = err?.message || "Failed to load overview"
        setError(msg)
        setRecentError(msg)
      } finally {
        setLoading(false)
        setRecentLoading(false)
      }
    }
    loadOverview()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground1">Dashboard Overview</h1>
        <p className="text-muted-foreground fonr-semibold">Monitor visitor activity and manage your facility access</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Visitors</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "--" : todayCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Currently On-Site</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{loading ? "--" : onSiteCount}</div>
            <p className="text-xs text-muted-foreground">Active visitors in building</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total This Month</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "--" : thisMonthCount}</div>
            <p className="text-xs text-muted-foreground">
              {loading ? null : (
                <span className={monthPercent >= 0 ? "text-green-600" : "text-red-600"}>
                  {monthPercent >= 0 ? "+" : ""}{monthPercent.toFixed(1)}%
                </span>
              )} from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Purpose Today</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "--" : topPurpose?.name ?? "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading
                ? ""
                : topPurpose
                  ? `${topPurpose.count} visit${topPurpose.count > 1 ? "s" : ""}${todayCount > 0
                    ? ` (${Math.round((topPurpose.count / todayCount) * 100)}%)`
                    : ""
                  }`
                  : "No visits yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Visitors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recent Visitors
            </CardTitle>
            <CardDescription>Latest visitor check-ins and current status</CardDescription>
          </CardHeader>

          <CardContent>
            {recentLoading ? (
              <div className="text-muted-foreground text-center py-8">Loading...</div>
            ) : recentError ? (
              <div className="text-red-500 text-center py-8">{recentError}</div>
            ) : recentVisitors.length === 0 ? (
              <div className="text-muted-foreground text-center py-8">No recent visitors</div>
            ) : (
              <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                {recentVisitors.map((visitor) => {
                  // Expiry/onsite logic (unchanged)
                  let isExpired = false;
                  const now = new Date();
                  if (visitor.expectedCheckOutTime) {
                    const expiry = new Date(visitor.expectedCheckOutTime);
                    if (!isNaN(expiry.getTime()) && expiry < now && (visitor.status === "checked_in" || visitor.status === "active")) {
                      isExpired = true;
                      visitor.status = "expired";
                    }
                  }
                  if (!isExpired) {
                    if (
                      visitor.status === "expired" ||
                      visitor.passStatus === "expired" ||
                      visitor.expired === true ||
                      visitor.isExpired === true
                    ) {
                      isExpired = true;
                    } else if (visitor.expiryDate) {
                      const expiry = new Date(visitor.expiryDate);
                      if (!isNaN(expiry.getTime()) && expiry < now) isExpired = true;
                    }
                    if (!isExpired && (visitor.validTo || visitor.validUntil)) {
                      const expiry = new Date(visitor.validTo || visitor.validUntil);
                      if (!isNaN(expiry.getTime()) && expiry < now) isExpired = true;
                    }
                  }
                  const isOnSite = !visitor.checkOutDate && !visitor.checkOutTime && !isExpired;

                  // ✅ Show DATE + TIME
                  // const dt =
                  //   visitor.checkInDate
                  //     ? `${new Date(visitor.checkInDate).toLocaleDateString()} ${new Date(visitor.checkInDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                  //     : "--";

                  // ✅ DD/MM/YYYY HH:mm (24-hour) using en-GB locale
const dt = visitor.checkInDate
  ? `${new Date(visitor.checkInDate).toLocaleDateString('en-GB')} ${new Date(visitor.checkInDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}`
  : "--";


                  return (
                    <div key={visitor._id} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-3">
                        {isExpired ? (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        ) : isOnSite ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-600" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{visitor.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {visitor.company || visitor.comingFrom || "-"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{dt}</p>
                        <Badge
                          variant={isExpired ? "destructive" : isOnSite ? "default" : "secondary"}
                          className={
                            isExpired
                              ? "bg-red-100 text-red-800 hover:bg-red-100"
                              : isOnSite
                                ? "bg-green-100 text-green-800 hover:bg-green-100"
                                : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                          }
                        >
                          {isExpired ? "Expired" : isOnSite ? "On-site" : "Left"}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common visitor management tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button className="w-40 h-12 flex items-center gap-2 border-black">
                <Link href="/client-dashboard/check-in">
                  <UserCheck className="h-4 w-4" />
                  Visitor Check-In
                </Link>
              </Button>
              <Button className="w-40 h-12 flex items-center gap-2 border-black">
                <Link href="/client-dashboard/visitors">
                  <TrendingUp className="h-4 w-4" />
                  Reports
                </Link>
              </Button>
              <Button className="w-40 h-12 flex items-center gap-2 border-black">
                <Link href="/client-dashboard/users">
                  <Calendar className="h-4 w-4" />
                  User Management
                </Link>
              </Button>
              <Button className="w-40 h-12 flex items-center gap-2 border-black">
                <Link href="/client-dashboard/settings">
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card> */}

        <Card>
  <CardHeader>
    <CardTitle>Quick Actions</CardTitle>
    <CardDescription>Common visitor management tasks</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="flex flex-wrap gap-3">
      <Link href="/client-dashboard/check-in" className="w-40">
        <Button className="w-full h-12 flex items-center justify-center gap-2 border-black">
          <UserCheck className="h-4 w-4" />
          <span>Visitor Check-In</span>
        </Button>
      </Link>

      <Link href="/client-dashboard/visitors" className="w-40">
        <Button className="w-full h-12 flex items-center justify-center gap-2 border-black">
          <TrendingUp className="h-4 w-4" />
          <span>Reports</span>
        </Button>
      </Link>

      <Link href="/client-dashboard/users" className="w-40">
        <Button className="w-full h-12 flex items-center justify-center gap-2 border-black">
          <Calendar className="h-4 w-4" />
          <span>User Management</span>
        </Button>
      </Link>

      <Link href="/client-dashboard/settings" className="w-40">
        <Button className="w-full h-12 flex items-center justify-center gap-2 border-black">
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </Button>
      </Link>
    </div>
  </CardContent>
</Card>

      </div>
    </div>
  )
}
