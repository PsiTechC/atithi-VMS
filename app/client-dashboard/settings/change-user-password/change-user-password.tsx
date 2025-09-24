"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Lock } from "lucide-react"

export default function ChangeUserPassword() {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [show, setShow] = useState({ current: false, new: false, confirm: false })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccess("")
    setError("")
    if (form.newPassword !== form.confirmPassword) {
      setError("New passwords do not match")
      setLoading(false)
      return
    }
    try {
      const res = await fetch("/api/users/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword: form.currentPassword, newPassword: form.newPassword })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setSuccess("Password changed successfully")
        setForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
      } else {
        setError(data.error || "Failed to change password")
      }
    } catch {
      setError("Failed to change password")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Change Password
        </CardTitle>
        <CardDescription>Update your account password. Make sure to choose a strong password.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password *</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={show.current ? "text" : "password"}
                value={form.currentPassword}
                onChange={e => setForm({ ...form, currentPassword: e.target.value })}
                placeholder="Enter your current password"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShow({ ...show, current: !show.current })}
              >
                {show.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password *</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={show.new ? "text" : "password"}
                value={form.newPassword}
                onChange={e => setForm({ ...form, newPassword: e.target.value })}
                placeholder="Enter your new password"
                required
                minLength={8}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShow({ ...show, new: !show.new })}
              >
                {show.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Password must be at least 8 characters long</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password *</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={show.confirm ? "text" : "password"}
                value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="Confirm your new password"
                required
                minLength={8}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShow({ ...show, confirm: !show.confirm })}
              >
                {show.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          {success && <div className="text-green-600 text-sm">{success}</div>}
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Changing Password..." : "Change Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
