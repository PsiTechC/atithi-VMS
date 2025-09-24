
"use client"
import { useState, useEffect, useMemo, useRef, useCallback } from "react"

//import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"



type VisitorType = {
  id: string
  name: string
  email: string
  company: string
  phone: string
  checkInTime: string | null
  checkOutTime: string | null
  purpose: string
  host: string
  status: "checked-in" | "checked-out" | string
}
// Icon imports (must be in function scope for Next.js/React strict mode)
const { Plus, Search, MoreHorizontal, UserCheck, UserX, Edit, Trash2, Users, Calendar } = require("lucide-react");
const { Download } = require("lucide-react");
type PurposeType = {
  _id: string
  name: string
  description?: string
}

export function VisitorManagement() {
  // Icon imports (must be in function scope for Next.js/React strict mode)
  const { Plus, Search, MoreHorizontal, UserCheck, UserX, Edit, Trash2, Users, Calendar, Download } = require("lucide-react");
  // Export filtered visitors as CSV
  const handleExportCSV = () => {
    if (!filteredVisitors.length) return;
    const headers = [
      "Name",
      "Email",
      "Company",
      "Phone",
      "Purpose",
      "Host",
      "Check In",
      "Check Out",
      "Status"
    ];
    const rows = filteredVisitors.map((v: VisitorType) => [
      v.name,
      v.email,
      v.company,
      v.phone,
      v.purpose,
      v.host,
      v.checkInTime ? new Date(v.checkInTime).toLocaleString() : "",
      v.checkOutTime ? new Date(v.checkOutTime).toLocaleString() : "",
      v.status
    ]);
    const csv = [headers, ...rows].map((r: string[]) => r.map((x: string) => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `visitors_export_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };
  const [searchTerm, setSearchTerm] = useState("")
  const [visitors, setVisitors] = useState<VisitorType[]>([])
  const [visitorsLoading, setVisitorsLoading] = useState(true)
  const [visitorsError, setVisitorsError] = useState("")
  const [hasMore, setHasMore] = useState(true)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const limit = 500
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const [purposes, setPurposes] = useState<PurposeType[]>([])
  const [purposesLoading, setPurposesLoading] = useState(true)
  const [purposesError, setPurposesError] = useState("")
  // Filters
  const [checkInFrom, setCheckInFrom] = useState<string>("")
  const [checkInTo, setCheckInTo] = useState<string>("")
  const [visitorTypeFilter, setVisitorTypeFilter] = useState<string>("")
  const [purposeFilter, setPurposeFilter] = useState<string>("")

  // --- fetch purposes ---
  useEffect(() => {
    async function fetchPurposes() {
      setPurposesLoading(true)
      setPurposesError("")
      try {
        const res = await fetch("/api/client/settings/purposes")
        if (!res.ok) throw new Error("Failed to fetch purposes")
        const data = await res.json()
        setPurposes(Array.isArray(data) ? data : [])
      } catch (err: any) {
        setPurposesError(err.message || "Failed to load purposes")
      } finally {
        setPurposesLoading(false)
      }
    }
    fetchPurposes()
  }, [])

  // --- fetch visitors (infinite scroll) ---
  const toISO = (v: any): string | null => {
    if (!v) return null
    if (typeof v === "string") return v
    if (typeof v === "number") return new Date(v).toISOString()
    if (v?.$date) return new Date(v.$date).toISOString()
    if (v instanceof Date) return v.toISOString()
    return null
  }

  const normalizeVisitor = (p: any): VisitorType => {
    const checkedOut =
      !!p.checkOutTime ||
      !!p.checkOutDate ||
      ["checked-out", "checked_out", "expired", "closed"].includes(String(p.status || "").toLowerCase())

    return {
      id: p.passId || p._id,
      name: p.name || "-",
      email: p.email || "",
      company: p.company || p.comingFrom || "-",
      phone: p.phone || "",
      checkInTime: toISO(p.checkInDate),
      checkOutTime: toISO(p.checkOutTime || p.checkOutDate),
      purpose: p.purposeOfVisit || p.purpose || "",
      host: p.host || "",
      status: checkedOut ? "checked-out" : "checked-in",
    }
  }

  const fetchVisitors = useCallback(async (startOffset = 0, append = false) => {
    try {
      if (startOffset === 0) setVisitorsLoading(true)
      setIsFetchingMore(true)
      setVisitorsError("")
      const res = await fetch(`/api/visitor-pass/all?limit=${limit}&sort=desc&offset=${startOffset}`)
      if (!res.ok) throw new Error("Failed to fetch visitors")
      const data = await res.json()
      const passes: any[] = Array.isArray(data.passes) ? data.passes : []
      const normalized: VisitorType[] = passes.map(normalizeVisitor)

      // Sort descending by check-in time
      normalized.sort((a, b) => {
        const aTime = a.checkInTime ? new Date(a.checkInTime).getTime() : 0;
        const bTime = b.checkInTime ? new Date(b.checkInTime).getTime() : 0;
        return bTime - aTime; // newest first
      });
      if (append) {
        setVisitors((prev) => [...prev, ...normalized])
      } else {
        setVisitors(normalized)
      }
      setHasMore(passes.length === limit)
      setOffset(startOffset + passes.length)
    } catch (err: any) {
      setVisitorsError(err.message || "Failed to load visitors")
    } finally {
      setVisitorsLoading(false)
      setIsFetchingMore(false)
    }
  }, [])

  useEffect(() => {
    fetchVisitors(0, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Infinite scroll handler
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return
    const handleScroll = () => {
      if (!hasMore || isFetchingMore || visitorsLoading) return
      const { scrollTop, scrollHeight, clientHeight } = container
      if (scrollHeight - scrollTop - clientHeight < 100) {
        fetchVisitors(offset, true)
      }
    }
    container.addEventListener("scroll", handleScroll)
    return () => container.removeEventListener("scroll", handleScroll)
  }, [hasMore, isFetchingMore, visitorsLoading, offset, fetchVisitors])

  const filteredVisitors = visitors.filter((visitor) => {
    const q = searchTerm.toLowerCase();
    // Search
    if (
      q &&
      !(
        visitor.name.toLowerCase().includes(q) ||
        visitor.company.toLowerCase().includes(q) ||
        visitor.email.toLowerCase().includes(q)
      )
    ) {
      return false;
    }
    // Date filter (compare only local date part)
    if (checkInFrom) {
      if (!visitor.checkInTime) return false;
      const checkInDateLocal = new Date(visitor.checkInTime);
      const fromDate = new Date(checkInFrom);
      // Set fromDate to local midnight
      fromDate.setHours(0, 0, 0, 0);
      // Set checkInDateLocal to local midnight
      const checkInLocalMidnight = new Date(checkInDateLocal);
      checkInLocalMidnight.setHours(0, 0, 0, 0);
      if (checkInLocalMidnight < fromDate) return false;
    }
    if (checkInTo) {
      if (!visitor.checkInTime) return false;
      const checkInDateLocal = new Date(visitor.checkInTime);
      const toDate = new Date(checkInTo);
      // Set toDate to end of day
      toDate.setHours(23, 59, 59, 999);
      if (checkInDateLocal > toDate) return false;
    }
    // Visitor type filter
    if (visitorTypeFilter && visitorTypeFilter !== "All") {
      if ((visitor as any).visitorType !== visitorTypeFilter) return false;
    }
    // Purpose filter
    if (purposeFilter && purposeFilter !== "All") {
      if (visitor.purpose !== purposeFilter) return false;
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "checked-in":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Checked In</Badge>
      case "checked-out":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Checked Out</Badge>
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Scheduled</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const todayCount = useMemo(() => {
    const today = new Date().toDateString()
    return visitors.filter((v) => {
      if (!v.checkInTime) return false
      const d = new Date(v.checkInTime)
      return d.toDateString() === today
    }).length
  }, [visitors])

  const todayCheckedOutCount = useMemo(() => {
  const today = new Date().toDateString();
  return visitors.filter((v) => {
    if (!v.checkOutTime) return false;
    const d = new Date(v.checkOutTime);
    return d.toDateString() === today && v.status === "checked-out";
  }).length;
}, [visitors]);


  const formatTime = (timeString: string | null) => {
    if (!timeString) return "-"
    return new Date(timeString).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Visitor Management</h1>
          <p className="text-muted-foreground">Track and manage all visitor activities</p>
        </div>
     

      
      </div>

      {/* Summary Cards (unchanged logic, but now read live visitors) */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Currently On-Site</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {visitors.filter((v) => v.status === "checked-in").length}
            </div>
            <p className="text-xs text-muted-foreground">Active visitors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {typeof visitorsLoading !== "undefined" && visitorsLoading ? "--" : todayCount}
            </div>
            <p className="text-xs text-muted-foreground">All visitors today</p>
          </CardContent>
        </Card>


        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Checked-Out</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
  {visitorsLoading ? "--" : todayCheckedOutCount}
</div>
            <p className="text-xs text-muted-foreground">From Facility</p>
          </CardContent>
        </Card>
      </div>

      {/* Purpose Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {purposesLoading ? (
          <Card><CardContent>Loading purposes...</CardContent></Card>
        ) : purposesError ? (
          <Card><CardContent className="text-red-500">{purposesError}</CardContent></Card>
        ) : purposes.length === 0 ? (
          <Card><CardContent>No purposes found</CardContent></Card>
        ) : (
          purposes.map((purpose) => {
            const checkedInCount = visitors.filter(
              (v) => v.status === "checked-in" && v.purpose === purpose.name
            ).length
            return (
              <Card key={purpose._id}>
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <span>{purpose.name}</span>
                    <span className="text-green-600 text-lg font-bold">{checkedInCount}</span>
                  </CardTitle>
                  {purpose.description && <CardDescription>{purpose.description}</CardDescription>}
                </CardHeader>
              </Card>
            )
          })
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Visitors
          </CardTitle>
          <CardDescription>View and manage all visitor records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap md:flex-nowrap items-end gap-4 mb-6 w-full">
            {/* Search box */}
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search visitors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {/* Check In From */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Check In From</label>
              <input
                type="date"
                className="border rounded px-2 py-1 text-sm"
                value={checkInFrom}
                onChange={e => setCheckInFrom(e.target.value)}
              />
            </div>
            {/* Check In To */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Check In To</label>
              <input
                type="date"
                className="border rounded px-2 py-1 text-sm"
                value={checkInTo}
                onChange={e => setCheckInTo(e.target.value)}
              />
            </div>
            {/* Visitor Type */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Visitor Type</label>
              <select
                className="border rounded px-2 py-1 text-sm min-w-[120px]"
                value={visitorTypeFilter}
                onChange={e => setVisitorTypeFilter(e.target.value)}
              >
                <option value="">All</option>
                {[...new Set(visitors.map(v => (v as any).visitorType).filter(Boolean))].map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            {/* Purpose */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Purpose</label>
              <select
                className="border rounded px-2 py-1 text-sm min-w-[120px]"
                value={purposeFilter}
                onChange={e => setPurposeFilter(e.target.value)}
              >
                <option value="">All</option>
                {purposes.map((p) => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
            {/* Export Button */}
            <div className="flex items-end">
              <Button type="button" variant="outline" className="flex gap-2" onClick={handleExportCSV}>
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              {/* adjust the height as you like */}
              <div
                className="max-h-[420px] overflow-y-auto"
                ref={scrollContainerRef}
                style={{ position: "relative" }}
              >
                <Table className="min-w-[900px]">
                  <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Host</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVisitors.map((visitor) => (
                      <TableRow key={visitor.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{visitor.name}</p>
                            <p className="text-xs text-muted-foreground">{visitor.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{visitor.company}</TableCell>
                        <TableCell>{visitor.purpose}</TableCell>
                        <TableCell>{visitor.host}</TableCell>
                        <TableCell>
                          {visitor.checkInTime
                            ? `${new Date(visitor.checkInTime).toLocaleDateString()} ${new Date(visitor.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {visitor.checkOutTime
                            ? `${new Date(visitor.checkOutTime).toLocaleDateString()} ${new Date(visitor.checkOutTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                            : "-"}
                        </TableCell>
<TableCell>{getStatusBadge(visitor.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {isFetchingMore && (
                  <div className="text-center py-2 text-muted-foreground text-xs">Loading more...</div>
                )}
                {!hasMore && visitors.length > 0 && (
                  <div className="text-center py-2 text-muted-foreground text-xs">No more visitors to load.</div>
                )}
              </div>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}
