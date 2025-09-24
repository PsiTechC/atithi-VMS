"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Save } from "lucide-react"

type ClientDoc = {
    _id: string
    name: string
    email: string            // map to your schema if using primaryEmail
    contacts?: string
    address?: string
    instructions?: string
    licenseStart?: string    // ISO string
    licenseEnd?: string      // ISO string
    isActive?: boolean
    otpRequired?: boolean
    logoUrl?: string | null
}

export default function EditClientPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [err, setErr] = useState<string | null>(null)

    // form state
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [contacts, setContacts] = useState("")
    const [address, setAddress] = useState("")
    const [instructions, setInstructions] = useState("")
    const [licenseStart, setLicenseStart] = useState("")
    const [licenseEnd, setLicenseEnd] = useState("")
    const [isActive, setIsActive] = useState(false)
    const [otpRequired, setOtpRequired] = useState(false)
    const [logoPreview, setLogoPreview] = useState<string | null>(null)
    const [logoFile, setLogoFile] = useState<File | null>(null)

    // fetch current client
    useEffect(() => {
        let ignore = false
        async function load() {
            try {
                setLoading(true)
                const res = await fetch(`/api/super-admin/clients/${id}`, { cache: "no-store" })
                if (!res.ok) throw new Error(`Failed to load client: ${res.status}`)
                const c: ClientDoc = await res.json()
                if (ignore) return

                setName(c.name || "")
                setEmail(c.email || "")
                setContacts(c.contacts || "")
                setAddress(c.address || "")
                setInstructions(c.instructions || "")

                // convert ISO -> yyyy-mm-dd for <input type="date">
                const toDateInput = (iso?: string) => {
                    if (!iso) return ""
                    const d = new Date(iso)
                    if (Number.isNaN(d.getTime())) return ""
                    const yyyy = d.getFullYear()
                    const mm = String(d.getMonth() + 1).padStart(2, "0")
                    const dd = String(d.getDate()).padStart(2, "0")
                    return `${yyyy}-${mm}-${dd}`
                }
                setLicenseStart(toDateInput(c.licenseStart))
                setLicenseEnd(toDateInput(c.licenseEnd))

                setIsActive(!!c.isActive)
                setOtpRequired(!!c.otpRequired)
                setLogoPreview(c.logoUrl || null)
            } catch (e: any) {
                setErr(e.message || "Error loading client")
            } finally {
                setLoading(false)
            }
        }
        load()
        return () => { ignore = true }
    }, [id])

    const onFileChange = (f?: File) => {
        setLogoFile(f || null)
        if (f) {
            const url = URL.createObjectURL(f)
            setLogoPreview(url)
        } else {
            // keep existing preview if no file chosen
            setLogoPreview(prev => prev || null)
        }
    }

    const canSubmit = useMemo(() => {
        return !!name && !!email && !!licenseStart && !!licenseEnd
    }, [name, email, licenseStart, licenseEnd])

    // Submit via fetch so we can send PATCH (HTML forms don't support PATCH)
    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErr(null)
        if (!canSubmit) return

        try {
            setSubmitting(true)

            const form = new FormData()
            form.append("name", name)
            form.append("email", email)
            form.append("contacts", contacts)
            form.append("address", address)
            form.append("instructions", instructions)
            form.append("licenseStart", licenseStart)
            form.append("licenseEnd", licenseEnd)
            // switches
            form.append("isActive", isActive ? "on" : "")
            form.append("otpRequired", otpRequired ? "on" : "")
            // optional logo
            if (logoFile) form.append("logo", logoFile)

            const res = await fetch(`/api/super-admin/clients/${id}`, {
                method: "PATCH",
                body: form,
            })
            if (!res.ok) {
                const j = await res.json().catch(() => ({}))
                throw new Error(j?.error || `Update failed with ${res.status}`)
            }
            // On success, go back to list
            router.replace("/super-admin/clients")
        } catch (e: any) {
            setErr(e.message || "Failed to update client")
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return <div className="p-6">Loading client…</div>
    }

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-foreground">Edit Client</h1>
                    <p className="text-muted-foreground">Update client details, license, and settings</p>
                </div>
                <Button asChild variant="outline" className="bg-transparent">
                    <Link href="/super-admin/clients">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Clients
                    </Link>
                </Button>
            </div>

            <Card className="border">
                <CardHeader>
                    <CardTitle>Client Information</CardTitle>
                    <CardDescription>Fields marked * are required.</CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={onSubmit} className="space-y-8">
                        {/* Basic details */}
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name *</Label>
                                <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Contact Email *</Label>
                                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="contacts">Contacts</Label>
                                <Input id="contacts" value={contacts} onChange={e => setContacts(e.target.value)} />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="address">Address</Label>
                                <Textarea id="address" value={address} onChange={e => setAddress(e.target.value)} rows={3} />
                            </div>
                        </div>

                        {/* Instructions */}
                        <div className="space-y-2">
                            <Label htmlFor="instructions">General Instructions</Label>
                            <Textarea
                                id="instructions"
                                value={instructions}
                                onChange={e => setInstructions(e.target.value)}
                                rows={4}
                            />
                        </div>

                        {/* License block */}
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="licenseStart">License Start Date *</Label>
                                <Input id="licenseStart" type="date" value={licenseStart} onChange={e => setLicenseStart(e.target.value)} required />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="licenseEnd">License End Date *</Label>
                                <Input id="licenseEnd" type="date" value={licenseEnd} onChange={e => setLicenseEnd(e.target.value)} required />
                            </div>

                            <div className="flex items-center justify-between rounded-lg border p-4 md:col-span-1">
                                <div className="space-y-1">
                                    <Label htmlFor="isActive">Is Active?</Label>
                                    <p className="text-xs text-muted-foreground">Toggle to activate or suspend the client.</p>
                                </div>
                                <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
                            </div>

                            <div className="flex items-center justify-between rounded-lg border p-4 md:col-span-1">
                                <div className="space-y-1">
                                    <Label htmlFor="otpRequired">OTP Validation</Label>
                                    <p className="text-xs text-muted-foreground">Require OTP for client logins and approvals.</p>
                                </div>
                                <Switch id="otpRequired" checked={otpRequired} onCheckedChange={setOtpRequired} />
                            </div>
                        </div>

                        {/* Logo upload */}
                        <div className="grid gap-6 md:grid-cols-[1fr_auto] items-start">
                            <div className="space-y-2">
                                <Label htmlFor="logo">Replace Logo</Label>
                                <Input
                                    id="logo"
                                    name="logo"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => onFileChange(e.target.files?.[0])}
                                />
                                <p className="text-xs text-muted-foreground">PNG/JPG/WEBP, up to ~2MB.</p>
                            </div>

                            <div className="h-24 w-24 rounded-md border overflow-hidden">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                {logoPreview
                                    ? <img src={logoPreview} alt="Logo preview" className="h-full w-full object-cover" />
                                    : <div className="h-full w-full grid place-items-center text-xs text-muted-foreground">No logo</div>}
                            </div>
                        </div>

                        {/* Errors */}
                        {err && <p className="text-sm text-destructive">{err}</p>}

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3">
                            <Button asChild variant="outline" className="bg-transparent">
                                <Link href="/super-admin/clients">Cancel</Link>
                            </Button>
                            <Button type="submit" disabled={submitting || !canSubmit} className="min-w-32">
                                <Save className="h-4 w-4 mr-2" />
                                {submitting ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
