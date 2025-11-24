


"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle } from "lucide-react"
import { FileText, MessageCircle, Mail } from "lucide-react"
import { generateVisitorPassPDF } from "@/lib/pdfUtils"



interface CheckInFormData {
  name: string
  email: string
  phone: string
  company: string
  purpose: string
  hostId: string
  expectedDuration: string
  notes: string
  visitorType: string
  idType: string
  accessPoint: string
}

type Cursor = { cursorDate: string | null; cursorId: string | null } | null

export function VisitorCheckIn() {
  const router = useRouter()


  const [insetAlert, setInsetAlert] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null)

//const [data, setData] = useState<any>(null);
  // UI / form
  const [activeTab, setActiveTab] = useState("check-in")
  const [checkInForm, setCheckInForm] = useState<CheckInFormData>({
    name: "", email: "", phone: "", company: "", purpose: "",
    hostId: "", expectedDuration: "", notes: "", visitorType: "",
    idType: "", accessPoint: "",
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const [selectedVisitor, setSelectedVisitor] = useState("")

  const autoCheckInTriggeredRef = useRef<Set<string>>(new Set());

  // client profile
  const [clientLogoUrl, setClientLogoUrl] = useState<string>("")
  const [clientId, setClientId] = useState<string>("")
  const [clientName, setClientName] = useState<string>("")
  const [clientInstructions, setClientInstructions] = useState<string>("")
  // hosts cache (by id and by lowercase name)
  const [hostsById, setHostsById] = useState<Record<string, any>>({})
  const [hostsByName, setHostsByName] = useState<Record<string, any>>({})

  // pagination state (newest-first by checkInDate)
  const [visitors, setVisitors] = useState<any[]>([])
  const [nextCursor, setNextCursor] = useState<Cursor>(null)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [isFetching, setIsFetching] = useState<boolean>(false)
  const [initialLoaded, setInitialLoaded] = useState<boolean>(false)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // de-dupe and de-bounce helpers
  const seenIdsRef = useRef<Set<string>>(new Set())                 // avoid duplicate rows
  const requestedKeysRef = useRef<Set<string>>(new Set())           // avoid duplicate page requests
  const makeKey = (c: Cursor) => (c?.cursorDate && c?.cursorId ? `${c.cursorDate}|${c.cursorId}` : "FIRST")

  const toDate = (v: any) => (v ? new Date(typeof v === "string" ? v : v?.$date ?? v) : null)

  // get clientId from JWT
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]))
        if (payload.clientId) setClientId(payload.clientId)
      } catch {
        setClientId("")
      }
    }
  }, [])

  // profile
  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch("/api/client/profile")
        if (!res.ok) throw new Error("Failed to fetch client profile")
        const data = await res.json()
        setClientLogoUrl(data.logoUrl || "/uploads/default-logo.png")
        setClientName(data.name || "")
        setClientInstructions(data.instructions || "")
      } catch {
        setClientLogoUrl("/uploads/default-logo.png")
        setClientName("")
        setClientInstructions("")
      }
    })()
  }, [])

  // Fetch hosts once so we can detect if a host requires approval even when the pass
  // document itself doesn't have approval fields (legacy passes).
  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch("/api/client/settings/hosts")
        if (!res.ok) return
        const data = await res.json()
        const list = Array.isArray(data.hosts) ? data.hosts : (Array.isArray(data) ? data : (data?.hostsList || []))
        const byId: Record<string, any> = {}
        const byName: Record<string, any> = {}
        for (const h of list) {
          if (!h) continue
          const id = h._id || h.id
          if (id) byId[String(id)] = h
          if (h.name) byName[String(h.name).toLowerCase()] = h
        }
        setHostsById(byId)
        setHostsByName(byName)
      } catch (e) {
        // ignore
      }
    })()
  }, [])

  // fetch a page (50 items), newest-first by checkInDate with (date,_id) cursor
  const fetchPage = useCallback(
    async (cursor?: Cursor) => {
      if (isFetching) return
      if (cursor && !hasMore) return

      // prevent requesting the same cursor twice
      const key = makeKey(cursor ?? null)
      if (requestedKeysRef.current.has(key)) return
      requestedKeysRef.current.add(key)

      setIsFetching(true)
      try {
        const url = new URL("/api/visitor-pass/all(50)", window.location.origin)
        url.searchParams.set("limit", "50")
        if (cursor?.cursorDate && cursor?.cursorId) {
          url.searchParams.set("cursorDate", cursor.cursorDate)
          url.searchParams.set("cursorId", cursor.cursorId)
        }

        const res = await fetch(url.toString(), { method: "GET" })
        if (!res.ok) throw new Error("Failed to fetch passes")
        const data = await res.json()

        const incoming: any[] = Array.isArray(data.passes) ? data.passes : []

        // dedupe by _id
        const newItems = incoming.filter(item => {
          const id = String(item._id ?? item.passId ?? "")
          if (!id || seenIdsRef.current.has(id)) return false
          seenIdsRef.current.add(id)
          return true
        })

        // if API returned nothing new, stop further paging
        if (newItems.length === 0) {
          setHasMore(false)
          setInitialLoaded(true)
          setIsFetching(false)
          return
        }

        setVisitors(prev => prev.concat(newItems))

        const nextC: Cursor = data.nextCursor || null
        if (!nextC || makeKey(nextC) === key) {
          // cursor didn't advance → stop
          setNextCursor(null)
          setHasMore(false)
        } else {
          setNextCursor(nextC)
          setHasMore(Boolean(data.hasMore))
        }

        setInitialLoaded(true)
      } catch (e) {
        console.error(e)
        setError("Failed to fetch visitor passes")
      } finally {
        setIsFetching(false)
      }
    },
    [isFetching, hasMore]
  )

  // initial load
  useEffect(() => {
    fetchPage(null)
  }, [fetchPage])

  // infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return
    const el = sentinelRef.current

    const io = new IntersectionObserver(
      entries => {
        const first = entries[0]
        if (!first.isIntersecting) return
        if (!initialLoaded || isFetching || !hasMore) return
        fetchPage(nextCursor) // pass the object {cursorDate, cursorId}
      },
      { root: null, rootMargin: "200px", threshold: 0.01 }
    )

    io.observe(el)
    return () => io.disconnect()
  }, [fetchPage, nextCursor, hasMore, isFetching, initialLoaded])

  // actions (unchanged)
  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(""); setSuccess("")
    try {
      setCheckInForm({
        name: "", email: "", phone: "", company: "", purpose: "",
        hostId: "", expectedDuration: "", notes: "",
        visitorType: "", idType: "", accessPoint: "",
      })
    } catch {
      setError("Failed to check in visitor. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleCheckOut = async () => {
    if (!selectedVisitor) return
    setLoading(true); setError(""); setSuccess("")
    try {
      const res = await fetch(`/api/client/visitors/check-out`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId: selectedVisitor }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to check out visitor")

      setSuccess(`${data.visitor?.name || "Visitor"} has been successfully checked out.`)
      setSelectedVisitor("")

      // reset paging and reload from top
      setVisitors([])
      setNextCursor(null)
      setHasMore(true)
      setInitialLoaded(false)
      seenIdsRef.current.clear()
      requestedKeysRef.current.clear()
      fetchPage(null)
    } catch {
      setError("Failed to check out visitor. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const rows = visitors // newest-first by checkInDate

  // per-pass WhatsApp send status: 'idle' | 'loading' | 'success' | 'error'
  const [whatsappStatus, setWhatsappStatus] = useState<Record<string, 'idle'|'loading'|'success'|'error'>>({})
  const setWhatsapp = (id: string, status: 'idle'|'loading'|'success'|'error') => {
    setWhatsappStatus(prev => ({ ...prev, [id]: status }))
  }

  // ---- DD/MM/YYYY HH:mm formatting helpers (en-GB) ----
  const formatDDMMYYYY_HHMM = (d: Date | null) =>
    d ? `${d.toLocaleDateString('en-GB')} ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}` : "--"

  // Poll pending approvals for visible rows and update their statuses
  useEffect(() => {
    let mounted = true
    const interval = setInterval(async () => {
      try {
        if (!mounted) return
        // gather ids for rows that look pending (hostRequiresApproval true but not approved)
        const pendingIds: string[] = []
        for (const p of visitors) {
          const hostId = p?.hostId || null
          const requires = Boolean(p?.approvalRequired) || (p?.host && hostsByName[String(p.host).toLowerCase()] && hostsByName[String(p.host).toLowerCase()].approvalRequired) || (hostId && hostsById[String(hostId)] && hostsById[String(hostId)].approvalRequired)
          if (requires && p?.approvalStatus !== 'approved') {
            pendingIds.push(p.passId || p._id)
          }
        }
        if (pendingIds.length === 0) return

        const res = await fetch('/api/visitor-pass/statuses', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ids: pendingIds }) })
        if (!res.ok) return
        const data = await res.json()
        if (!data?.statuses) return

        // Merge statuses and auto check-in newly approved ones
        setVisitors(prev => {
          const map = new Map(prev.map(item => [String(item.passId || item._id), { ...item }]))

          for (const s of data.statuses) {
            const id = String(s.id)
            const item = map.get(id)
            if (!item) continue

            const wasApproved = item.approvalStatus === "approved"
            item.approvalStatus = s.approvalStatus
            item.approvalRequired = s.approvalRequired
            map.set(id, item)

            // 🔔 If just approved (and not yet auto-checked), call our new API once
            const nowApproved = item.approvalStatus === "approved"
            if (nowApproved && !wasApproved && !autoCheckInTriggeredRef.current.has(id)) {
              autoCheckInTriggeredRef.current.add(id)

              // optional AP — not present in this component, so send null and a label
              const apId = null
              const apName = "Auto (WhatsApp Approval)"

              ;(async () => {
                try {
                  const r = await fetch("/api/visitor-pass/check-in/whatsapp", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({
                      passId: item.passId || id,
                      accessPointId: apId,
                      accessPointName: apName,
                    }),
                  })
                  if (r.ok) {
                    const j = await r.json()
                    // update local row with check-in info
                    setVisitors(curr => {
                      const mm = new Map(curr.map(it => [String(it.passId || it._id), { ...it }]))
                      const row = mm.get(id)
                      if (row) {
                        row.status = "checked-in"
                        row.checkInDate = j.checkInDate || new Date().toISOString()
                        mm.set(id, row)
                      }
                      return Array.from(mm.values())
                    })
                  } else {
                    // allow retry on next poll by removing the flag
                    autoCheckInTriggeredRef.current.delete(id)
                  }


                } catch {
                  autoCheckInTriggeredRef.current.delete(id)
                }
              })()
            }
          }

          return Array.from(map.values())
        })
      } catch (e) {
        // ignore polling errors
      }
    }, 5000)
    return () => { mounted = false; clearInterval(interval) }
  }, [visitors, hostsById, hostsByName])

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-5 px-2 sm:px-4 lg:px-6 ">
      {/* header + cards */}
      <div className="flex justify-center mb-2 sm:mb-3 lg:mb-4 px-2">
        {clientLogoUrl ? (
          <img src={clientLogoUrl} alt="Client Logo" className="h-30 w-auto rounded-lg shadow" style={{maxWidth:500}} />
        ) : null}
      </div>

      <div className="text-center px-2">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground1">Visitor Check-In/Out</h1>
        {/* <p className="text-muted-foreground font-semibold">Manage visitor entry and exit from your facility</p> */}
      </div>

      <div className="flex justify-center gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 lg:mb-8 px-2">
        <Card onClick={() => router.push("/client-dashboard/check-in/process")} className="cursor-pointer w-32 sm:w-36 md:w-40 hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="text-sm sm:text-base md:text-lg font-semibold text-center">Check-In</CardTitle>
            {/* <CardDescription>Check in visitors entering the facility</CardDescription> */}
          </CardHeader>
        </Card>
        <Card onClick={() => router.push("/client-dashboard/check-out/process")} className="cursor-pointer w-32 sm:w-36 md:w-40 hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="text-sm sm:text-base md:text-lg font-semibold text-center">Check-Out</CardTitle>
            {/* <CardDescription>Check out visitors leaving the facility</CardDescription> */}
          </CardHeader>
        </Card>
      </div>



      {/* table */}
      <div className="overflow-x-auto min-h-[300px] max-h-[50vh] sm:max-h-[55vh] md:max-h-[60vh] lg:max-h-[480px] overflow-y-auto">
        <table className="min-w-full border rounded-lg bg-white text-xs sm:text-sm" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
          <thead className="bg-muted text-white" style={{ position: "sticky", top: 0, zIndex: 2 }}>
            <tr>
              <th className="px-2 py-1.5 sm:px-3 sm:py-2 text-left bg-foreground1 text-xs sm:text-sm">Pass ID</th>
              <th className="px-2 py-1.5 sm:px-3 sm:py-2 text-left bg-foreground1 hidden md:table-cell text-xs sm:text-sm">Picture</th>
              <th className="px-2 py-1.5 sm:px-3 sm:py-2 text-left bg-foreground1 text-xs sm:text-sm">Visitor Details</th>
              <th className="px-2 py-1.5 sm:px-3 sm:py-2 text-left bg-foreground1 hidden lg:table-cell text-xs sm:text-sm">Coming From</th>
              <th className="px-2 py-1.5 sm:px-3 sm:py-2 text-left bg-foreground1 hidden lg:table-cell text-xs sm:text-sm">Purpose</th>
              <th className="px-2 py-1.5 sm:px-3 sm:py-2 text-left bg-foreground1 hidden sm:table-cell text-xs sm:text-sm">Host</th>
              {/* <th className="px-2 py-1.5 sm:px-3 sm:py-2 text-left bg-foreground1">Visitor ID</th> */}
              <th className="px-2 py-1.5 sm:px-3 sm:py-2 text-left bg-foreground1 text-xs sm:text-sm">Check In</th>
              <th className="px-2 py-1.5 sm:px-3 sm:py-2 text-left bg-foreground1 hidden md:table-cell text-xs sm:text-sm">Check Out</th>
              <th className="px-2 py-1.5 sm:px-3 sm:py-2 text-left bg-foreground1 text-xs sm:text-sm">Status</th>
              <th className="px-2 py-1.5 sm:px-3 sm:py-2 text-left bg-foreground1 text-xs sm:text-sm">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((pass) => {
              const checkInDate = toDate(pass.checkInDate)
              const checkOutDate = toDate(pass.checkOutDate)

              // ✅ DD/MM/YYYY HH:mm
              const checkInDisplay = formatDDMMYYYY_HHMM(checkInDate)
              const checkOutDisplay = formatDDMMYYYY_HHMM(checkOutDate)

              // whatsapp icon status for this pass
              const _id = String(pass.passId ?? pass._id ?? "")
              const waStatus = whatsappStatus[_id] ?? 'idle'
              let waIconClass = 'h-4 w-4 text-green-600'
              if (waStatus === 'loading') waIconClass = 'h-4 w-4 animate-spin text-gray-600'
              else if (waStatus === 'success') waIconClass = 'h-4 w-4 text-green-600 font-bold'
              else if (waStatus === 'error') waIconClass = 'h-4 w-4 text-red-600 font-bold'

               return (
                 <tr
                   key={pass._id ?? pass.passId}
                   className="border-b cursor-pointer hover:bg-gray-50"
                   onClick={() => router.push(`/client-dashboard/visitor/${pass.passId || pass._id}`)}
                 >
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm">{pass.passId || pass._id}</td>
                  <td className="px-2 py-1 hidden md:table-cell">
                    <img src={pass.photoUrl} alt="Visitor" className="h-10 w-10 sm:h-12 sm:w-12 md:h-13 md:w-13 rounded-full object-cover border border-gray-300 shadow-sm" />
                  </td>
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                    <div className="font-medium text-xs sm:text-sm">{pass.name}</div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">{pass.phone}</div>
                  </td>
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2 hidden lg:table-cell text-xs sm:text-sm">{pass.comingFrom || "Reception"}</td>
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2 hidden lg:table-cell text-xs sm:text-sm">{pass.purposeOfVisit}</td>
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2 hidden sm:table-cell text-xs sm:text-sm">{pass.host}</td>
                  {/* <td className="px-2 py-1.5 sm:px-3 sm:py-2">{pass.visitorIdText || pass.visitorId || pass._id}</td> */}
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs">{checkInDisplay}</td>
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2 hidden md:table-cell text-[10px] sm:text-xs">{checkOutDisplay}</td>
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                    {/* Status badge: Approved, Pending approval, Default approved */}
                    {
                      (() => {
                        // Determine if host requires approval (pass-level flag preferred, then host lookup)
                        const passHasApproval = Boolean(pass?.approvalRequired)
                        const passApproved = pass?.approvalStatus === 'approved'
                        const passRejected = pass?.approvalStatus === 'rejected'

                        let hostRequiresApproval = false
                        if (passHasApproval) {
                          hostRequiresApproval = true
                        } else {
                          // Try hostId
                          const hostId = pass?.hostId || pass?.hostId?._id || pass?.hostId
                          if (hostId && hostsById[String(hostId)]) {
                            hostRequiresApproval = Boolean(hostsById[String(hostId)].approvalRequired)
                          } else if (pass?.host) {
                            const nameKey = String(pass.host).toLowerCase()
                            if (hostsByName[nameKey]) hostRequiresApproval = Boolean(hostsByName[nameKey].approvalRequired)
                          }
                        }

                        if (hostRequiresApproval) {
                          // If there's an explicit pass approvalStatus and it's approved, show Approved
                          if (passApproved) {
                            return <span className="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full bg-green-100 text-green-800 text-[10px] sm:text-xs md:text-sm whitespace-nowrap">Approved</span>
                          }
                           if (passRejected) {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full bg-red-100 text-red-800 text-[10px] sm:text-xs md:text-sm whitespace-nowrap">
          Rejected
        </span>
      )
    }
                          // Otherwise pending
                          return <span className="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full bg-red-100 text-red-800 text-[10px] sm:text-xs md:text-sm whitespace-nowrap">Pending Approval</span>
                        }

                        // Default behaviour for passes/hosts without approvals configured
                        return <span className="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full bg-green-100 text-green-800 text-[10px] sm:text-xs md:text-sm whitespace-nowrap"> Default Approved</span>
                      })()
                    }
                  </td>
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2 flex gap-1 sm:gap-2">
  {(() => {
    // Determine if the pass is pending approval
    const isPendingApproval =
      (pass?.approvalRequired && pass?.approvalStatus === "pending") ||
      (!pass?.approvalStatus && pass?.approvalRequired);

    // If pending → disable action buttons
    const disableActions = isPendingApproval;

    return (
      <>
        <Button
          variant="outline"
          size="sm"
          title={disableActions ? "Disabled until approved" : "Download PDF"}
          disabled={disableActions}
          className="min-w-[32px] min-h-[32px] sm:min-w-[36px] sm:min-h-[36px] p-1 sm:p-2"
        >
          <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          title={disableActions ? "Disabled until approved" : "Send WhatsApp"}
          disabled={disableActions || waStatus === "loading"}
          className="min-w-[32px] min-h-[32px] sm:min-w-[36px] sm:min-h-[36px] p-1 sm:p-2"
          onClick={async (e) => {
            if (disableActions) return; // safeguard
            e.stopPropagation();
            const id = _id;
            try {
              setWhatsapp(id, "loading");

              // generate PDF
              const pdfBlob = await generateVisitorPassPDF(
                pass,
               null,
                clientName || "",
                clientLogoUrl,
                clientInstructions || ""
              );

              // upload
              const formData = new FormData();
              formData.append(
                "file",
                new File([pdfBlob], `VisitorPass_${pass.passId}.pdf`, {
                  type: "application/pdf",
                })
              );
              const uploadRes = await fetch("/api/upload", {
                method: "POST",
                body: formData,
              });
              if (!uploadRes.ok) throw new Error("Upload failed");
              const uploadJson = await uploadRes.json();
              const pdfUrl = uploadJson?.url;
              if (!pdfUrl) throw new Error("Upload did not return url");

              // send via backend
              const wsRes = await fetch("/api/send-whatsapp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: pass.name,
                  number: pass.phone,
                  pdfUrl,
                  mediaName: `VisitorPass_${pass.passId}.pdf`,
                  passId: pass.passId,
                }),
              });

              if (!wsRes.ok) {
                const errData = await wsRes.json().catch(() => ({}));
                throw new Error(errData.error || "Failed to send WhatsApp message");
              }

              // setWhatsapp(id, "success");
              // alert("WhatsApp message sent!");

              setWhatsapp(id, "success");
setInsetAlert({ type: "success", message: "WhatsApp message sent!" });


            } catch (err) {
              console.error(err);
              // setWhatsapp(id, "error");
              // alert("Failed to send WhatsApp message");

              setWhatsapp(id, "error");
setInsetAlert({ type: "error", message: "Failed to send WhatsApp message" });

            }
          }}
        >
          <MessageCircle className={waIconClass.replace('h-4 w-4', 'h-3 w-3 sm:h-4 sm:w-4')} />
        </Button>
      </>
    );
  })()}
</td>

                </tr>
              )
            })}

            {rows.length === 0 && !isFetching && (
              <tr><td colSpan={10} className="text-center py-6 sm:py-8 text-xs sm:text-sm text-muted-foreground">No visitors currently on-site</td></tr>
            )}

            {isFetching && (
              <tr><td colSpan={10} className="text-center py-3 sm:py-4 text-xs sm:text-sm">Loading…</td></tr>
            )}
          </tbody>
        </table>

        <div ref={sentinelRef} style={{ height: 1 }} />
      </div>

      {success && (
        <Alert className="border-green-200 bg-green-50 mx-2 sm:mx-0">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 text-xs sm:text-sm">{success}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive" className="mx-2 sm:mx-0">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
        </Alert>
      )}


      {/* Floating Alert Modal
{insetAlert && (
  <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
    <div className="bg-white border rounded shadow-lg p-6 max-w-sm w-full flex flex-col gap-4">
      <div className={`font-medium text-sm ${
        insetAlert.type === "success" ? "text-green-700" :
        insetAlert.type === "error" ? "text-red-700" :
        "text-blue-700"
      }`}>
        {insetAlert.message}
      </div>

      <button
        className="self-end text-gray-500 hover:text-gray-800 text-sm"
        onClick={() => setInsetAlert(null)}
      >
        Close
      </button>
    </div>
  </div>
)} */}


{/* ✅ Floating Alert Overlay */}
{insetAlert && (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999] transition-all duration-200 px-4">
    <div
      className={`flex flex-col items-center gap-2 sm:gap-3 px-4 py-4 sm:px-6 sm:py-5 rounded-xl sm:rounded-2xl shadow-lg text-center border w-[90%] max-w-sm
        ${insetAlert.type === "success" ? "bg-green-50 border-green-300 text-green-800" :
          insetAlert.type === "error" ? "bg-red-50 border-red-300 text-red-800" :
          "bg-blue-50 border-blue-300 text-blue-800"}
      `}
    >
      {insetAlert.type === "success" && <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />}
      {insetAlert.type === "error" && <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />}
      <AlertDescription className="text-xs sm:text-sm font-medium">{insetAlert.message}</AlertDescription>

      <Button
        variant="outline"
        onClick={() => setInsetAlert(null)}
        className="mt-1 sm:mt-2 text-xs sm:text-sm border-gray-300 min-h-[32px] sm:min-h-[36px]"
      >
        OK
      </Button>
    </div>
  </div>
)}

    </div>
  )
}
