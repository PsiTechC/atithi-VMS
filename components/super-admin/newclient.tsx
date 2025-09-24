// app/super-admin/clients/new/page.tsx
"use client"

import Link from "next/link"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Save } from "lucide-react"

export default function NewClientPage() {
  const [submitting, setSubmitting] = useState(false)

  // Optional: client-side preview of logo
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)

    const formData = new FormData(e.currentTarget)

    try {
      const response = await fetch('/api/super-admin/clients', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        alert(`Failed to create client: ${errorData.error || 'Unknown error'}`)
        setSubmitting(false)
        return
      }

      // Redirect to client management page on success
      window.location.href = '/super-admin/clients'
    } catch (error) {
      alert('An error occurred while creating the client.')
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Create Client</h1>
          <p className="text-muted-foreground">Add a new client and configure their license & settings</p>
        </div>
        <Button asChild variant="outline" className="bg-transparent">
          <Link href="/super-admin/clients">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clients
          </Link>
        </Button>
      </div>

      {/* Big Card */}
      <Card className="border">
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
          <CardDescription>Fill out the details below. Fields marked * are required.</CardDescription>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleSubmit}
            encType="multipart/form-data"
            className="space-y-8"
          >
            {/* Basic details */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" name="name" placeholder="Acme Corporation" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Contact Email *</Label>
                <Input id="email" name="email" type="email" placeholder="admin@acme.com" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contacts">Contacts</Label>
                <Input id="contacts" name="contacts" placeholder="Enter Number" />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Textarea id="address" name="address" placeholder="Street, City, State, ZIP, Country" rows={3} />
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-2">
              <Label htmlFor="instructions">General Instructions</Label>
              <Textarea
                id="instructions"
                name="instructions"
                placeholder="Any onboarding notes, delivery instructions, or special requirements…"
                rows={4}
              />
            </div>

            {/* License block */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="licenseStart">License Start Date *</Label>
                <Input id="licenseStart" name="licenseStart" type="date" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="licenseEnd">License End Date</Label>
                    <Input id="licenseEnd" name="licenseEnd" type="date" />
                    <p className="text-xs text-muted-foreground">
                      If not provided, will be set to 1 year and 1 month from start date.
                 </p></div>

              <div className="flex items-center justify-between rounded-lg border p-4 md:col-span-1">
                <div className="space-y-1">
                  <Label htmlFor="isActive">Is Active?</Label>
                  <p className="text-xs text-muted-foreground">
                    Toggle to activate or suspend the client immediately.
                  </p>
                </div>
                <Switch id="isActive" name="isActive" />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4 md:col-span-1">
                <div className="space-y-1">
                  <Label htmlFor="otpRequired">OTP Validation</Label>
                  <p className="text-xs text-muted-foreground">Require OTP for client logins and approvals.</p>
                </div>
                <Switch id="otpRequired" name="otpRequired" />
              </div>
            </div>

            {/* Logo upload */}
            <div className="grid gap-6 md:grid-cols-[1fr_auto] items-start">
              <div className="space-y-2">
                <Label htmlFor="logo">Upload Logo</Label>
                <Input
                  id="logo"
                  name="logo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return setLogoPreview(null)
                    const url = URL.createObjectURL(file)
                    setLogoPreview(url)
                  }}
                />
                <p className="text-xs text-muted-foreground">PNG/JPG, up to ~2MB recommended.</p>
              </div>

              {logoPreview ? (
                <div className="h-24 w-24 rounded-md border overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoPreview} alt="Logo preview" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="h-24 w-24 rounded-md border bg-muted/40 grid place-items-center text-xs text-muted-foreground">
                  No preview
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <Button asChild variant="outline" className="bg-transparent">
                <Link href="/super-admin/clients">Cancel</Link>
              </Button>
              <Button type="submit" disabled={submitting} className="min-w-32">
                <Save className="h-4 w-4 mr-2" />
                {submitting ? "Saving..." : "Create Client"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
