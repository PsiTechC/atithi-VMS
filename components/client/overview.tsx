"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { UserCheck, Users, Clock, TrendingUp,Settings,Notebook, Calendar, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
// Mock data - in real app this would come from API
const mockStats = {
  todayVisitors: 12,
  activeVisitors: 8,
  totalVisitors: 156,
  avgVisitDuration: "2.5 hours",
}

export function ClientOverview() {
  // const [recentVisitors, setRecentVisitors] = useState<any[]>([])
  // add next to your existing state
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

  // Helper function to count today's visitors
  function getTodayCount(visitors: any[]): number {
    const today = new Date()
    return visitors.filter((visitor) => {
      if (!visitor.checkInDate) return false
      const checkIn = new Date(visitor.checkInDate)
      return (
        checkIn.getDate() === today.getDate() &&
        checkIn.getMonth() === today.getMonth() &&
        checkIn.getFullYear() === today.getFullYear()
      )
    }).length
  }

  const [topPurpose, setTopPurpose] = useState<{ name: string; count: number } | null>(null)

  function computeTopPurposeToday(visitors: any[]) {
    const today = new Date()
    const counts: Record<string, number> = {}

    for (const v of visitors) {
      if (!v?.checkInDate) continue
      const d = new Date(v.checkInDate)
      const isToday =
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
      if (!isToday) continue

      const purpose: string = v.purposeOfVisit || v.purpose || "Other"
      counts[purpose] = (counts[purpose] || 0) + 1
    }

    let best: { name: string; count: number } | null = null
    for (const [name, count] of Object.entries(counts)) {
      if (!best || count > best.count) best = { name, count }
    }
    return best
  }


  useEffect(() => {
    async function fetchRecentVisitors() {
      setLoading(true)
      setError("")
      try {
        // Fetch all visitors (adjust endpoint as needed)
        const res = await fetch("/api/visitor-pass/all")
        if (!res.ok) throw new Error("Failed to fetch visitors")
        const data = await res.json()
        let visitors = Array.isArray(data.passes) ? data.passes : []
        // Sort by latest check-in
        visitors = visitors.sort((a: any, b: any) => {
          const aDate = a.checkInDate ? new Date(a.checkInDate) : null
          const bDate = b.checkInDate ? new Date(b.checkInDate) : null
          return (bDate?.getTime() || 0) - (aDate?.getTime() || 0)
        })
        //setRecentVisitors(visitors.slice(0, 5))
        setTodayCount(getTodayCount(visitors))
        // Count currently on-site visitors (not checked out and not expired)
        const onSite = visitors.filter((v: any) => {
          let isExpired = false;
          const now = new Date();
          // Check expiry by expectedCheckOutTime if present
          if (v.expectedCheckOutTime) {
            const expiry = new Date(v.expectedCheckOutTime);
            if (!isNaN(expiry.getTime()) && expiry < now && (v.status === "checked_in" || v.status === "active")) {
              isExpired = true;
              v.status = "expired";
            }
          }
          // Fallback to other expiry logic
          if (!isExpired) {
            if (
              v.status === "expired" ||
              v.passStatus === "expired" ||
              v.expired === true ||
              v.isExpired === true
            ) {
              isExpired = true;
            } else if (v.expiryDate) {
              const expiry = new Date(v.expiryDate);
              if (!isNaN(expiry.getTime()) && expiry < now) {
                isExpired = true;
              }
            }
            if (!isExpired && (v.validTo || v.validUntil)) {
              const expiry = new Date(v.validTo || v.validUntil);
              if (!isNaN(expiry.getTime()) && expiry < now) {
                isExpired = true;
              }
            }
          }
          return !v.checkOutDate && !v.checkOutTime && !isExpired;
        }).length;
        setOnSiteCount(onSite)
        setTopPurpose(computeTopPurposeToday(visitors))


        // Calculate total visitors for this month and last month
        const now = new Date()
        const thisMonth = now.getMonth()
        const thisYear = now.getFullYear()
        const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1
        const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear

        const thisMonthVisitors = visitors.filter((v: any) => {
          if (!v.checkInDate) return false
          const d = new Date(v.checkInDate)
          return d.getMonth() === thisMonth && d.getFullYear() === thisYear
        }).length
        const lastMonthVisitors = visitors.filter((v: any) => {
          if (!v.checkInDate) return false
          const d = new Date(v.checkInDate)
          return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear
        }).length
        setThisMonthCount(thisMonthVisitors)
        setLastMonthCount(lastMonthVisitors)
        // Calculate percent change
        let percent = 0
        if (lastMonthVisitors > 0) {
          percent = ((thisMonthVisitors - lastMonthVisitors) / lastMonthVisitors) * 100
        } else if (thisMonthVisitors > 0) {
          percent = 100
        }
        setMonthPercent(percent)
      } catch (err: any) {
        setError(err.message || "Failed to load visitors")
      } finally {
        setLoading(false)
      }
    }
    fetchRecentVisitors()
  }, [])

  // You can fetch stats for cards similarly if needed

  useEffect(() => {
    async function fetchRecentOnly() {
      setRecentLoading(true)
      setRecentError("")
      try {
        const res = await fetch("/api/visitor-pass/all?limit=50&sort=desc")
        if (!res.ok) throw new Error("Failed to fetch recent visitors")
        const data = await res.json()
        let visitors = Array.isArray(data.passes) ? data.passes : []

        // sort newest first, then cap to 50 in case backend ignores params
        visitors = visitors
          .sort((a: any, b: any) => {
            const aDate = a.checkInDate ? new Date(a.checkInDate) : null
            const bDate = b.checkInDate ? new Date(b.checkInDate) : null
            return (bDate?.getTime() || 0) - (aDate?.getTime() || 0)
          })
          .slice(0, 50)

        setRecentVisitors(visitors)
      } catch (err: any) {
        setRecentError(err.message || "Failed to load recent visitors")
      } finally {
        setRecentLoading(false)
      }
    }
    fetchRecentOnly()
  }, [])


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground1">Dashboard Overview</h1>
        <p className="text-muted-foreground fonr-semibold">Monitor visitor activity and manage your facility access</p>
      </div>

      {/* Stats Cards - keep mock for now, replace with live if needed */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Visitors</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "--" : todayCount}</div>
            <p className="text-xs text-muted-foreground">
              {/* Optionally show delta or other info here */}
            </p>
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
          {/* <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="text-muted-foreground text-center py-8">Loading...</div>
              ) : error ? (
                <div className="text-red-500 text-center py-8">{error}</div>
              ) : recentVisitors.length === 0 ? (
                <div className="text-muted-foreground text-center py-8">No recent visitors</div>
              ) : (
                recentVisitors.map((visitor) => (
                  <div key={visitor._id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {(!visitor.checkOutDate && !visitor.checkOutTime) ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-600" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{visitor.name}</p>
                        <p className="text-xs text-muted-foreground">{visitor.company || visitor.comingFrom || "-"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{visitor.checkInDate ? new Date(visitor.checkInDate).toLocaleTimeString() : "--"}</p>
                      <Badge
                        variant={(!visitor.checkOutDate && !visitor.checkOutTime) ? "default" : "secondary"}
                        className={
                          (!visitor.checkOutDate && !visitor.checkOutTime)
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                        }
                      >
                        {(!visitor.checkOutDate && !visitor.checkOutTime) ? "On-site" : "Left"}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent> */}

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
                  // Enhanced expired logic: check expectedCheckOutTime first
                  let isExpired = false;
                  const now = new Date();
                  if (visitor.expectedCheckOutTime) {
                    const expiry = new Date(visitor.expectedCheckOutTime);
                    if (!isNaN(expiry.getTime()) && expiry < now && (visitor.status === "checked_in" || visitor.status === "active")) {
                      isExpired = true;
                      visitor.status = "expired";
                    }
                  }
                  // 1. Explicit status fields
                  if (!isExpired) {
                    if (
                      visitor.status === "expired" ||
                      visitor.passStatus === "expired" ||
                      visitor.expired === true ||
                      visitor.isExpired === true
                    ) {
                      isExpired = true;
                    } else if (visitor.expiryDate) {
                      // 2. Check expiryDate if present
                      const expiry = new Date(visitor.expiryDate);
                      if (!isNaN(expiry.getTime()) && expiry < now) {
                        isExpired = true;
                      }
                    }
                    // 3. Fallback: check if pass has a validTo or validUntil field
                    if (!isExpired && (visitor.validTo || visitor.validUntil)) {
                      const expiry = new Date(visitor.validTo || visitor.validUntil);
                      if (!isNaN(expiry.getTime()) && expiry < now) {
                        isExpired = true;
                      }
                    }
                  }
                  const isOnSite = !visitor.checkOutDate && !visitor.checkOutTime && !isExpired;
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
                        <p className="text-xs text-muted-foreground">
                          {visitor.checkInDate ? new Date(visitor.checkInDate).toLocaleTimeString() : "--"}
                        </p>
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

        {/* Quick Actions (replacing Upcoming Visits) */}
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
              {/* <Button className="w-40 h-12 flex items-center gap-2 border-black">
                <Link href="/client-dashboard/license">
                <Notebook className="h-4 w-4" />
                License
                </Link>
              </Button> */}
              {/* <Button className="w-40 h-12 flex items-center gap-2 border-black">
                <Link href="/client-dashboard/reports">
                <TrendingUp className="h-4 w-4" />
                Reports
                </Link>
              </Button> */}
              <Button className="w-40 h-12 flex items-center gap-2 border-black">
                <Link href="/client-dashboard/settings">
                <Settings className="h-4 w-4" />
                Settings
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}