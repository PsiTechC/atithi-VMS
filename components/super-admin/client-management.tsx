
"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Plus, Search, MoreHorizontal, Edit, Trash2, Mail, Pause, Play, Building2, LayoutGrid, Columns,
} from "lucide-react"

import ClientDetailsDialog from "@/components/super-admin/clientdetaildialog" 

type ClientUI = {
  id: string
  name: string
  email: string
  status: "active" | "expired" | "suspended" | "unknown"
  licenseExpiry: string
  users: number
  lastActive: string
  logoUrl?: string | null
}

type ViewMode = "table" | "grid"

export function ClientManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [clients, setClients] = useState<ClientUI[]>([])
  const [view, setView] = useState<ViewMode>("table")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<Record<string, boolean>>({})


  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const openDetails = (id: string) => { setSelectedId(id); setDetailsOpen(true) }


  // const [inviteBusy, setInviteBusy] = useState<Record<string, boolean>>({});
  // async function sendInvite(id: string, overwrite?: boolean) {
  //   setInviteBusy(p => ({ ...p, [id]: true }));
  //   try {
  //     const res = await fetch(`/api/super-admin/clients/${id}/invite${overwrite ? '?overwrite=true' : ''}`, {
  //       method: "POST",
  //     });
  //     const data = await res.json();
  //     if (!res.ok) throw new Error(data?.error || "Failed to send invitation");
  //     alert("Invitation email sent.");
  //   } catch (e) {
  //     alert(e.message);  
  //   } finally {
  //     setInviteBusy(p => ({ ...p, [id]: false }));
  //   }
  // }

  useEffect(() => {
    async function fetchClients() {
      try {
        const res = await fetch("/api/super-admin/clients", { cache: "no-store" })
        if (!res.ok) throw new Error(`Failed to fetch clients: ${res.statusText}`)
        const data = await res.json()

        const toYmd = (d?: string | Date) => (d ? new Date(d).toISOString().split("T")[0] : "")
        const mapped: ClientUI[] = data.map((c: any) => {
          let status: ClientUI["status"] = c.status || "unknown"
          if (!c.status) {
            const now = Date.now()
            const end = c.licenseEnd ? new Date(c.licenseEnd).getTime() : NaN
            if (!isNaN(end)) status = end >= now ? "active" : "expired"
          }
          return {
            id: String(c._id),
            name: c.name ?? "—",
            email: c.email ?? "—",
            status,
            licenseExpiry: toYmd(c.licenseEnd),
            users: typeof c.users === "number" ? c.users : 0,
            lastActive: toYmd(c.lastActive),
            logoUrl: c.logoUrl ?? null,
          }
        })
        setClients(mapped)
      } catch (e: any) {
        setError(e.message || "Failed to load clients")
      } finally {
        setLoading(false)
      }
    }
    fetchClients()
  }, [])

  const filtered = useMemo(
    () =>
      clients.filter(
        (c) =>
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.email.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [clients, searchTerm],
  )

  const getStatusBadge = (status: ClientUI["status"]) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
      case "expired":
        return <Badge variant="destructive">Expired</Badge>
      case "suspended":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Suspended</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const setRowBusy = (id: string, val: boolean) => setBusy((b) => ({ ...b, [id]: val }))
  const updateClientStatusLocal = (id: string, status: ClientUI["status"]) =>
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)))
  const removeClientLocal = (id: string) => setClients((prev) => prev.filter((c) => c.id !== id))

  const doAction = useCallback(async (id: string, action: "activate" | "suspend") => {
    const prev = clients.find((c) => c.id === id)
    if (!prev) return
    const optimistic: ClientUI["status"] = action === "activate" ? "active" : "suspended"
    updateClientStatusLocal(id, optimistic)
    setRowBusy(id, true)
    try {
      const res = await fetch(`/api/super-admin/clients/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) {
        updateClientStatusLocal(id, prev.status)
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || `Failed to ${action} client`)
      }
    } finally {
      setRowBusy(id, false)
    }
  }, [clients])

  const deleteClient = useCallback(async (id: string) => {
    const snapshot = clients
    if (!window.confirm("Delete this client? This cannot be undone.")) return
    removeClientLocal(id)
    setRowBusy(id, true)
    try {
      const res = await fetch(`/api/super-admin/clients/${id}`, { method: "DELETE" })
      if (!res.ok) {
        setClients(snapshot)
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || "Delete failed")
      }
    } finally {
      setRowBusy(id, false)
    }
  }, [clients])

  const sendInvite = useCallback(async (id: string) => {
    setRowBusy(id, true);
    try {
      const res = await fetch(`/api/super-admin/clients/${id}/invite`, { method: "POST" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Invite failed");
      }
      alert("Invitation sent.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      alert(msg);
    } finally {
      setRowBusy(id, false);
    }
  }, []);

  const ActionsMenu = ({ client }: { client: ClientUI }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 w-8 p-0"
          disabled={!!busy[client.id]}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem asChild>
          <Link href={`/super-admin/clients/${client.id}`} className="flex items-center">
            <Edit className="mr-2 h-4 w-4" />
            Edit Client
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => {sendInvite(client.id); }}>
          <Mail className="mr-2 h-4 w-4" />
          {busy[client.id] ? "Sending..." : "Send Invitation"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {client.status === "active" ? (
          <DropdownMenuItem onClick={() => doAction(client.id, "suspend")}>
            <Pause className="mr-2 h-4 w-4" />
            {busy[client.id] ? "Suspending..." : "Suspend Client"}
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => doAction(client.id, "activate")}>
            <Play className="mr-2 h-4 w-4" />
            {busy[client.id] ? "Activating..." : "Activate Client"}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive" onClick={() => deleteClient(client.id)}>
          <Trash2 className="mr-2 h-4 w-4" />
          {busy[client.id] ? "Deleting..." : "Delete Client"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const Initials = ({ name }: { name: string }) => {
    const parts = name.split(" ").filter(Boolean)
    const initials = (parts[0]?.[0] || "") + (parts[1]?.[0] || "")
    return (
      <div className="h-24 w-full rounded-md border bg-muted/40 grid place-items-center text-sm text-muted-foreground">
        {initials.toUpperCase() || "—"}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground1">Client Management</h1>
          <p className="text-muted-foreground font-semibold">Manage all client organizations and their access</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md border bg-card">
            <Button
              type="button"
              variant={view === "table" ? "default" : "ghost"}
              className={view === "table" ? "" : "bg-transparent"}
              onClick={() => setView("table")}
              title="Columns"
            >
              <Columns className="h-4 w-4 mr-1" />
            </Button>
            <Button
              type="button"
              variant={view === "grid" ? "default" : "ghost"}
              className={view === "grid" ? "" : "bg-transparent"}
              onClick={() => setView("grid")}
              title="Grid"
            >
              <LayoutGrid className="h-4 w-4 mr-1" />
            </Button>
          </div>

          <Button asChild className="flex items-center gap-2">
            <Link href="/super-admin/clients/new">
              <Plus className="h-4 w-4" />
              Add New Client
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            All Clients
          </CardTitle>
          <CardDescription>View and manage all client organizations in the system</CardDescription>
        </CardHeader>

        <CardContent>
          {/* Search */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading && <p>Loading clients...</p>}
          {error && <p className="text-destructive">Error: {error}</p>}

          {/* TABLE VIEW */}
          {!loading && !error && view === "table" && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Contact Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>License Expiry</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="w-[70px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((client) => (
                    <TableRow key={client.id} onClick={() => openDetails(client.id)} className="cursor-pointer">
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>{getStatusBadge(client.status)}</TableCell>
                      <TableCell>{client.licenseExpiry}</TableCell>
                      <TableCell>{client.users}</TableCell>
                      <TableCell>{client.lastActive}</TableCell>
                      <TableCell>
                        <ActionsMenu client={client} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* GRID VIEW */}
          {!loading && !error && view === "grid" && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((client) => (
                <Card key={client.id} className="border cursor-pointer" onClick={() => openDetails(client.id)}>
                  <CardHeader className="pb-3">
                    {/* Top: logo with object-contain */}
                    <div className="h-24 w-full rounded-md border bg-muted/20 overflow-hidden mb-3">
                      {client.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={client.logoUrl}
                          alt={`${client.name} logo`}
                          className="h-full w-full object-contain p-2"
                          loading="lazy"
                        />
                      ) : (
                        <Initials name={client.name} />
                      )}
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">{client.name}</CardTitle>
                        <CardDescription className="text-xs">{client.email}</CardDescription>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <ActionsMenu client={client} />
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      {getStatusBadge(client.status)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">License Expiry</span>
                      <span className="text-sm">{client.licenseExpiry || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Users</span>
                      <span className="text-sm">{client.users}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Last Active</span>
                      <span className="text-sm">{client.lastActive || "—"}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          <ClientDetailsDialog
            open={detailsOpen}
            onOpenChange={setDetailsOpen}
            clientId={selectedId}
          />
        </CardContent>
      </Card>
    </div>
  )
}
