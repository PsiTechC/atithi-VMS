"use client"

import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Mail, Phone, MapPin, ShieldCheck, ShieldAlert, Calendar, Clock } from "lucide-react"

type ClientDoc = {
    _id: string
    name: string
    email?: string
    contacts?: string
    address?: string
    instructions?: string
    licenseStart?: string
    licenseEnd?: string
    isActive?: boolean
    otpRequired?: boolean
    logoUrl?: string | null
    users?: number
    lastActive?: string
    status?: "active" | "expired" | "suspended" | string
}

function StatusBadge({ status }: { status?: string }) {
    const s = (status || "unknown").toLowerCase()
    if (s === "active") return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
    if (s === "expired") return <Badge variant="destructive">Expired</Badge>
    if (s === "suspended") return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Suspended</Badge>
    return <Badge variant="secondary">Unknown</Badge>
}

export default function ClientDetailsDialog({
    open,
    onOpenChange,
    clientId,
}: {
    open: boolean
    onOpenChange: (v: boolean) => void
    clientId: string | null
}) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [client, setClient] = useState<ClientDoc | null>(null)

    // Load details when opened or clientId changes
    useEffect(() => {
        let ignore = false
        async function load() {
            if (!open || !clientId) return
            setLoading(true)
            setError(null)
            try {
                const res = await fetch(`/api/super-admin/clients/${clientId}`, { cache: "no-store" })
                if (!res.ok) throw new Error(`Failed to load client (${res.status})`)
                const data: ClientDoc = await res.json()
                if (!ignore) setClient(data)
            } catch (e: any) {
                if (!ignore) setError(e.message || "Failed to load")
            } finally {
                if (!ignore) setLoading(false)
            }
        }
        load()
        return () => { ignore = true }
    }, [open, clientId])

    // Derive status if API didn’t send one
    const derivedStatus = useMemo(() => {
        if (!client) return "unknown"
        if (client.status) return client.status
        const end = client.licenseEnd ? new Date(client.licenseEnd).getTime() : NaN
        if (!isNaN(end)) return end >= Date.now() ? "active" : "expired"
        return client.isActive ? "active" : "suspended"
    }, [client])

    const toYmd = (d?: string) => (d ? new Date(d).toISOString().split("T")[0] : "—")
    const toYmdhm = (d?: string) =>
        d ? new Date(d).toLocaleString() : "—"

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[640px] p-0 overflow-hidden">
                <div className="p-5">
                    <DialogHeader className="mb-2">
                        <DialogTitle className="text-xl">Client Details</DialogTitle>
                    </DialogHeader>

                    {/* Header: Logo + Name + Status */}
                    <div className="flex gap-4 items-start">
                        <div className="h-24 w-24 rounded-md border bg-muted/20 overflow-hidden flex-shrink-0">
                            {client?.logoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={client.logoUrl} alt={`${client.name} logo`} className="h-full w-full object-contain p-2" />
                            ) : (
                                <div className="h-full w-full grid place-items-center text-sm text-muted-foreground">No logo</div>
                            )}
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center gap-3">
                                <h2 className="text-lg font-semibold">{client?.name || "—"}</h2>
                                <StatusBadge status={derivedStatus} />
                            </div>
                            <div className="mt-1 text-sm text-muted-foreground flex items-center gap-3 flex-wrap">
                                <span className="inline-flex items-center gap-1">
                                    <ShieldCheck className="h-4 w-4" />
                                    {client?.isActive ? "Active" : "Inactive"}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                    {client?.otpRequired ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                                    {client?.otpRequired ? "OTP required" : "OTP not required"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <Separator className="my-4" />

                    {/* Core fields */}
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <div className="text-xs uppercase text-muted-foreground">Contact Email</div>
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{client?.email || "—"}</span>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="text-xs uppercase text-muted-foreground">Contacts</div>
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{client?.contacts || "—"}</span>
                            </div>
                        </div>

                        <div className="space-y-1 sm:col-span-2">
                            <div className="text-xs uppercase text-muted-foreground">Address</div>
                            <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <span className="text-sm">{client?.address || "—"}</span>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="text-xs uppercase text-muted-foreground">License Start</div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{toYmd(client?.licenseStart)}</span>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="text-xs uppercase text-muted-foreground">License End</div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{toYmd(client?.licenseEnd)}</span>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="text-xs uppercase text-muted-foreground">Users</div>
                            <div className="text-sm">{typeof client?.users === "number" ? client.users : "—"}</div>
                        </div>

                        <div className="space-y-1">
                            <div className="text-xs uppercase text-muted-foreground">Last Active</div>
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{toYmdhm(client?.lastActive)}</span>
                            </div>
                        </div>

                        <div className="space-y-1 sm:col-span-2">
                            <div className="text-xs uppercase text-muted-foreground">Instructions</div>
                            <div className="text-sm whitespace-pre-wrap">
                                {client?.instructions?.trim() || "—"}
                            </div>
                        </div>
                    </div>

                    {/* Loading & error */}
                    {loading && <p className="mt-4 text-sm">Loading…</p>}
                    {error && <p className="mt-4 text-sm text-destructive">Error: {error}</p>}
                </div>
            </DialogContent>
        </Dialog>
    )
}
