"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"

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
  status: "checked-in" | "checked-out" | "expired" | string
  // extra fields used for UI expiry override
  expiryDate?: string | null
  validTo?: string | null
  validUntil?: string | null
  expectedCheckOutTime?: string | null
  rawStatus?: string
  passStatus?: string
  expiredFlag?: boolean
  isExpiredFlag?: boolean
}

type PurposeType = {
  _id: string
  name: string
  description?: string
}

type Cursor = { cursorDate: string | null; cursorId: string | null } | null

export function VisitorManagement() {
  // Icons in component scope
  const { Search, UserCheck, Users, Calendar, Download } = require("lucide-react")

  // -------------------- Cards (overview) state --------------------
  const [cardsLoading, setCardsLoading] = useState(true)
  const [cardsError, setCardsError] = useState("")
  const [todayCount, setTodayCount] = useState<number>(0)
  const [onSiteCount, setOnSiteCount] = useState<number>(0)
  const [todayCheckedOutCount, setTodayCheckedOutCount] = useState<number>(0)

  useEffect(() => {
    ;(async () => {
      setCardsLoading(true)
      setCardsError("")
      try {
        const res = await fetch("/api/visitor-pass/overview?recentLimit=1")
        if (!res.ok) throw new Error("Failed to fetch overview")
        const data = await res.json()
        setTodayCount(data.todayCount ?? 0)
        setOnSiteCount(data.onSiteCount ?? 0)
        setTodayCheckedOutCount(data.todayCheckedOutCount ?? 0)
      } catch (e: any) {
        setCardsError(e?.message || "Failed to load cards")
      } finally {
        setCardsLoading(false)
      }
    })()
  }, [])

  // -------------------- Purposes (cards + filters) --------------------
  const [purposes, setPurposes] = useState<PurposeType[]>([])
  const [purposesLoading, setPurposesLoading] = useState(true)
  const [purposesError, setPurposesError] = useState("")

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

  // -------------------- Visitors table (cursor pagination) --------------------
  const [searchTerm, setSearchTerm] = useState("")
  const [visitors, setVisitors] = useState<VisitorType[]>([])
  const [visitorsLoading, setVisitorsLoading] = useState(true)
  const [visitorsError, setVisitorsError] = useState("")

  const [nextCursor, setNextCursor] = useState<Cursor>(null)
  const [hasMore, setHasMore] = useState(true)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const limit = 500

  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  // Filters
  const [checkInFrom, setCheckInFrom] = useState<string>("")
  const [checkInTo, setCheckInTo] = useState<string>("")
  const [visitorTypeFilter, setVisitorTypeFilter] = useState<string>("")
  const [purposeFilter, setPurposeFilter] = useState<string>("")

  // De-dupe + duplicate-request guards
  const seenIdsRef = useRef<Set<string>>(new Set())
  const requestedKeysRef = useRef<Set<string>>(new Set())
  const makeKey = (c: Cursor) => (c?.cursorDate && c?.cursorId ? `${c.cursorDate}|${c.cursorId}` : "FIRST")

  // Helper: normalize heterogeneous dates
  const toISO = (v: any): string | null => {
    if (!v) return null
    if (typeof v === "string") return v
    if (typeof v === "number") return new Date(v).toISOString()
    if (v?.$date) return new Date(v.$date).toISOString()
    if (v instanceof Date) return v.toISOString()
    return null
  }

  // Normalize server doc -> VisitorType (and carry extra expiry fields)
 const normalizeVisitor = (p: any): VisitorType => {
    const now = new Date()
    const checkIn = toISO(p.checkInDate)
    const checkOut = toISO(p.checkOutTime || p.checkOutDate)
    const expectedCheckout = toISO(p.expectedCheckOutTime)
    const expiryDate = toISO(p.expiryDate)
    const validTo = toISO(p.validTo)
    const validUntil = toISO(p.validUntil)

    const rawStatus = String(p.status || "").toLowerCase()
    const passStatus = p.passStatus
    const expiredFlag = Boolean(p.expired === true)
    const isExpiredFlag = Boolean(p.isExpired === true)

    // --- FIX: decide "expired" first, then checked-out, else checked-in ---
    const isExplicitExpired =
      expiredFlag ||
      isExpiredFlag ||
      rawStatus === "expired" ||
      String(passStatus || "").toLowerCase() === "expired" ||
      (expectedCheckout ? new Date(expectedCheckout) < now : false) ||
      (expiryDate ? new Date(expiryDate) < now : false) ||
      (validTo ? new Date(validTo) < now : false) ||
      (validUntil ? new Date(validUntil) < now : false)

    let status: "checked-in" | "checked-out" | "expired" | string
    if (isExplicitExpired) {
      status = "expired"
    } else if (checkOut || rawStatus === "checked-out" || rawStatus === "checked_out" || rawStatus === "closed") {
      status = "checked-out"
    } else {
      status = "checked-in"
    }

    return {
      id: p.passId || p._id,
      name: p.name || "-",
      email: p.email || "",
      company: p.company || p.comingFrom || "-",
      phone: p.phone || "",
      checkInTime: checkIn,
      checkOutTime: checkOut,
      purpose: p.purposeOfVisit || p.purpose || "",
      host: p.host || "",
      status, // <-- will now be "expired" when DB/fields indicate that
      expiryDate,
      validTo,
      validUntil,
      expectedCheckOutTime: expectedCheckout,
      rawStatus: p.status,
      passStatus,
      expiredFlag,
      isExpiredFlag,
    }
  }

  // Fetch a page via cursor
  const fetchVisitors = useCallback(
    async (cursor: Cursor = null) => {
      if (isFetchingMore) return
      if (cursor && !hasMore) return

      const key = makeKey(cursor)
      if (requestedKeysRef.current.has(key)) return
      requestedKeysRef.current.add(key)

      try {
        if (!cursor) setVisitorsLoading(true)
        setIsFetchingMore(true)
        setVisitorsError("")

        const url = new URL("/api/visitor-pass/all(50)", window.location.origin)
        url.searchParams.set("limit", String(limit))
        if (cursor?.cursorDate && cursor?.cursorId) {
          url.searchParams.set("cursorDate", cursor.cursorDate)
          url.searchParams.set("cursorId", cursor.cursorId)
        }

        const res = await fetch(url.toString(), { method: "GET" })
        if (!res.ok) throw new Error("Failed to fetch visitors")
        const data = await res.json()
        const passes: any[] = Array.isArray(data.passes) ? data.passes : []
        const normalized = passes.map(normalizeVisitor)

        // Deduplicate by id
        const fresh = normalized.filter((v) => {
          const id = String(v.id || "")
          if (!id || seenIdsRef.current.has(id)) return false
          seenIdsRef.current.add(id)
          return true
        })

        if (fresh.length === 0) {
          setHasMore(false)
          setNextCursor(null)
          return
        }

        setVisitors((prev) => (cursor ? [...prev, ...fresh] : fresh))

        const nextC: Cursor = data.nextCursor || null
        if (!nextC || makeKey(nextC) === key) {
          setHasMore(false)
          setNextCursor(null)
        } else {
          setHasMore(Boolean(data.hasMore))
          setNextCursor(nextC)
        }
      } catch (err: any) {
        setVisitorsError(err.message || "Failed to load visitors")
      } finally {
        setVisitorsLoading(false)
        setIsFetchingMore(false)
      }
    },
    [isFetchingMore, hasMore]
  )

  useEffect(() => {
    fetchVisitors(null)
  }, [fetchVisitors])

  // Infinite scroll
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return
    const handleScroll = () => {
      if (!hasMore || isFetchingMore || visitorsLoading) return
      const { scrollTop, scrollHeight, clientHeight } = container
      if (scrollHeight - scrollTop - clientHeight < 120) {
        fetchVisitors(nextCursor)
      }
    }
    container.addEventListener("scroll", handleScroll)
    return () => container.removeEventListener("scroll", handleScroll)
  }, [hasMore, isFetchingMore, visitorsLoading, nextCursor, fetchVisitors])

  // -------- PURPOSE CARDS: Today-only counts --------
  const todayPurposeCounts = useMemo(() => {
    const todayStr = new Date().toDateString()
    const acc = new Map<string, number>()
    for (const v of visitors) {
      if (!v.checkInTime) continue
      const isToday = new Date(v.checkInTime).toDateString() === todayStr
      if (!isToday) continue
      const name = v.purpose || "Other"
      acc.set(name, (acc.get(name) ?? 0) + 1)
    }
    return acc
  }, [visitors])

  // -------- Client-side filters for table --------
  const filteredVisitors = visitors.filter((visitor) => {
    const q = searchTerm.toLowerCase()

    if (
      q &&
      !(
        visitor.name.toLowerCase().includes(q) ||
        visitor.company.toLowerCase().includes(q) ||
        visitor.email.toLowerCase().includes(q)
      )
    ) {
      return false
    }

    if (checkInFrom) {
      if (!visitor.checkInTime) return false
      const checkInDateLocal = new Date(visitor.checkInTime)
      const fromDate = new Date(checkInFrom)
      fromDate.setHours(0, 0, 0, 0)
      const checkInLocalMidnight = new Date(checkInDateLocal)
      checkInLocalMidnight.setHours(0, 0, 0, 0)
      if (checkInLocalMidnight < fromDate) return false
    }

    if (checkInTo) {
      if (!visitor.checkInTime) return false
      const checkInDateLocal = new Date(visitor.checkInTime)
      const toDate = new Date(checkInTo)
      toDate.setHours(23, 59, 59, 999)
      if (checkInDateLocal > toDate) return false
    }

    if (visitorTypeFilter && visitorTypeFilter !== "All") {
      if ((visitor as any).visitorType !== visitorTypeFilter) return false
    }

    if (purposeFilter && purposeFilter !== "All") {
      if (visitor.purpose !== purposeFilter) return false
    }

    return true
  })

  // CSV export of filtered visitors
  const handleExportCSV = () => {
    if (!filteredVisitors.length) return
    const headers = ["Name", "Email", "Company", "Phone", "Purpose", "Host", "Check In", "Check Out", "Status"]
    const rows = filteredVisitors.map((v: VisitorType) => [
      v.name,
      v.email,
      v.company,
      v.phone,
      v.purpose,
      v.host,
      v.checkInTime ? new Date(v.checkInTime).toLocaleString() : "",
      v.checkOutTime ? new Date(v.checkOutTime).toLocaleString() : "",
      // export with UI-derived status (includes expiry override)
      deriveUIStatus(v),
    ])
    const csv = [headers, ...rows]
      .map((r: string[]) => r.map((x: string) => `"${String(x).replace(/"/g, '""')}"`).join(","))
      .join("\r\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `visitors_export_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 100)
  }

  // ---------- UI helpers: expiry override + badges ----------
  const isInPast = (iso?: string | null) => (iso ? new Date(iso).getTime() < Date.now() : false)

  // If status is "checked-in" but any expiry field is past, display as "expired"
  function deriveUIStatus(v: VisitorType): "checked-in" | "checked-out" | "expired" | string {
    if (v.status === "checked-in") {
      const anyExpired =
        v.expiredFlag === true ||
        v.isExpiredFlag === true ||
        String(v.passStatus || "").toLowerCase() === "expired" ||
        isInPast(v.expiryDate) ||
        isInPast(v.validTo) ||
        isInPast(v.validUntil) ||
        // expected checkout being past also implies it's effectively expired on UI
        isInPast(v.expectedCheckOutTime)

      if (anyExpired) return "expired"
    }
    return v.status
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "checked-in":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Checked In</Badge>
      case "checked-out":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Checked Out</Badge>
      case "expired":
        return <Badge className="bg-red-100 text-red-800">Expired</Badge>
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Scheduled</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

 // DD/MM/YYYY HH:mm (24-hour) for table cells
const formatDateTime = (iso: string | null) =>
  iso
    ? `${new Date(iso).toLocaleDateString('en-GB')} ${new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}`
    : "-";

  // -------------------- Render --------------------
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Visitor Management</h1>
          <p className="text-muted-foreground">Track and manage all visitor activities</p>
        </div>
      </div>

      {/* Summary Cards – backend-driven */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Currently On-Site</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {cardsLoading ? "--" : onSiteCount}
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
              {cardsLoading ? "--" : todayCount}
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
              {cardsLoading ? "--" : todayCheckedOutCount}
            </div>
            <p className="text-xs text-muted-foreground">From Facility (today)</p>
          </CardContent>
        </Card>
      </div>

      {/* Purpose Cards — **Today only** */}
      <div className="grid gap-4 md:grid-cols-3">
        {purposesLoading ? (
          <Card><CardContent>Loading purposes...</CardContent></Card>
        ) : purposesError ? (
          <Card><CardContent className="text-red-500">{purposesError}</CardContent></Card>
        ) : purposes.length === 0 ? (
          <Card><CardContent>No purposes found</CardContent></Card>
        ) : (
          purposes.map((purpose: PurposeType) => {
            const todayCountForPurpose = todayPurposeCounts.get(purpose.name) ?? 0
            return (
              <Card key={purpose._id}>
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <span>{purpose.name}</span>
                    <span className="text-green-600 text-lg font-bold">{todayCountForPurpose}</span>
                  </CardTitle>
                  {purpose.description && <CardDescription>{purpose.description}</CardDescription>}
                </CardHeader>
              </Card>
            )
          })
        )}
      </div>

      {/* All Visitors */}
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                onChange={(e) => setCheckInFrom(e.target.value)}
              />
            </div>
            {/* Check In To */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Check In To</label>
              <input
                type="date"
                className="border rounded px-2 py-1 text-sm"
                value={checkInTo}
                onChange={(e) => setCheckInTo(e.target.value)}
              />
            </div>
            {/* Visitor Type */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Visitor Type</label>
              <select
                className="border rounded px-2 py-1 text-sm min-w-[120px]"
                value={visitorTypeFilter}
                onChange={(e) => setVisitorTypeFilter(e.target.value)}
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
                onChange={(e) => setPurposeFilter(e.target.value)}
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
                    {filteredVisitors.map((visitor) => {
                      const uiStatus = deriveUIStatus(visitor)
                      return (
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
                          <TableCell>{formatDateTime(visitor.checkInTime)}</TableCell>
                          <TableCell>{formatDateTime(visitor.checkOutTime)}</TableCell>
                          <TableCell>{getStatusBadge(uiStatus)}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>

                {isFetchingMore && (
                  <div className="text-center py-2 text-muted-foreground text-xs">Loading more...</div>
                )}
                {!hasMore && visitors.length > 0 && (
                  <div className="text-center py-2 text-muted-foreground text-xs">No more visitors to load.</div>
                )}
                {visitorsError && (
                  <div className="text-center py-2 text-red-500 text-xs">{visitorsError}</div>
                )}
              </div>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}
