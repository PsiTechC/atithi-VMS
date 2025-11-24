"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Building2, Users } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Always send credentials to both APIs, let backend handle role logic
      // Try super admin login first
      let response = await fetch('/api/super-admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      let data = await response.json();
      if (response.ok && data.token && data.role === "super-admin") {
        localStorage.setItem("accessToken", data.token);
        localStorage.setItem("role", "super-admin");
        window.location.href = "/super-admin";
        return;
      }

      // If not super admin, try client login
      response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
       });
      data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Login failed');
        return;
      }
      if (data.success) {
        // If user or client object exists, store it
        if (data.user) {
          window.sessionStorage.setItem("user", JSON.stringify(data.user));
        } else if (data.client) {
          window.sessionStorage.setItem("user", JSON.stringify({
            ...data.client,
            role: data.role || "client-admin"
          }));
        } else {
          // If only role/clientId/token present (user login fallback)
          window.sessionStorage.setItem("user", JSON.stringify({
            role: data.role,
            clientId: data.clientId,
            token: data.token
          }));
        }
        window.location.href = data.redirect || '/client-dashboard/check-in';
        return;
      }

    } catch (err) {
      setError("Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Blocks Art Background */}
      <svg
        aria-hidden="true"
        width="100%"
        height="100%"
        viewBox="0 0 800 600"
        fill="none"
        style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.13 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="40" y="60" width="80" height="80" rx="16" fill="#6366f1" />
        <rect x="180" y="120" width="60" height="60" rx="12" fill="#f59e42" />
        <rect x="320" y="40" width="100" height="100" rx="20" fill="#10b981" />
        <rect x="500" y="100" width="70" height="70" rx="14" fill="#f43f5e" />
        <rect x="650" y="60" width="90" height="90" rx="18" fill="#fbbf24" />
        <rect x="100" y="400" width="120" height="120" rx="24" fill="#3b82f6" />
        <rect x="300" y="350" width="80" height="80" rx="16" fill="#a21caf" />
        <rect x="500" y="420" width="110" height="110" rx="22" fill="#14b8a6" />
        <rect x="700" y="350" width="60" height="60" rx="12" fill="#f43f5e" />
        {/* More blocks for richer effect */}
        <rect x="30" y="520" width="60" height="60" rx="12" fill="#f59e42" />
        <rect x="200" y="500" width="50" height="50" rx="10" fill="#6366f1" />
        <rect x="400" y="520" width="70" height="70" rx="14" fill="#fbbf24" />
        <rect x="600" y="500" width="80" height="80" rx="16" fill="#10b981" />
        <rect x="720" y="520" width="40" height="40" rx="8" fill="#a21caf" />
        <rect x="60" y="250" width="40" height="40" rx="8" fill="#14b8a6" />
        <rect x="220" y="300" width="30" height="30" rx="6" fill="#f43f5e" />
        <rect x="700" y="200" width="50" height="50" rx="10" fill="#3b82f6" />
        <rect x="600" y="250" width="30" height="30" rx="6" fill="#f59e42" />
        <rect x="350" y="250" width="40" height="40" rx="8" fill="#6366f1" />
      </svg>
      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center">
          <div className="flex justify-center">
              <img
                src={process.env.NEXT_PUBLIC_LOGIN_PAGE_IMAGE_URL}
                alt="Atithi Logo"
                className="h-30 w-150"
                // style={{ borderRadius: '0%' }}
              />
          </div>
          <h1 className="text-3xl font-bold text-foreground1">Visitor Management</h1>
          <p className="text-muted-foreground font-semibold mt-2">Secure access to your management portal</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your credentials to access your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            {/* <div className="mt-6 pt-6 border-t border-border">
              <div className="text-sm text-muted-foreground text-center mb-4">Demo Accounts:</div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 p-2 bg-muted rounded">
                  <Shield className="h-4 w-4 text-accent" />
                  <span className="font-medium">Super Admin:</span>
                  <span>superadmin@system.com</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-muted rounded">
                  <Building2 className="h-4 w-4 text-accent" />
                  <span className="font-medium">Client Admin:</span>
                  <span>admin@client.com</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-muted rounded">
                  <Users className="h-4 w-4 text-accent" />
                  <span className="font-medium">Client User:</span>
                  <span>user@client.com</span>
                </div>
              </div>
            </div> */}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
