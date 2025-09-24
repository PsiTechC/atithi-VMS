"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, MoreHorizontal, RefreshCw, Pause, Play, CreditCard, Calendar, AlertTriangle } from "lucide-react"

// Mock license data
const mockLicenses = [
  {
    id: "1",
    clientName: "Acme Corporation",
    licenseType: "Enterprise",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    status: "active",
    maxUsers: 50,
    currentUsers: 15,
  },
  {
    id: "2",
    clientName: "TechStart Inc",
    licenseType: "Professional",
    startDate: "2023-06-01",
    endDate: "2024-01-10",
    status: "expired",
    maxUsers: 20,
    currentUsers: 8,
  },
  {
    id: "3",
    clientName: "Global Solutions",
    licenseType: "Enterprise",
    startDate: "2023-12-15",
    endDate: "2024-06-15",
    status: "active",
    maxUsers: 100,
    currentUsers: 25,
  },
  {
    id: "4",
    clientName: "Beta Corp",
    licenseType: "Standard",
    startDate: "2023-09-20",
    endDate: "2024-03-20",
    status: "expiring_soon",
    maxUsers: 25,
    currentUsers: 12,
  },
]

export function LicenseManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [licenses, setLicenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Fetch licenses from API
  useEffect(() => {
    async function fetchLicenses() {
      setLoading(true)
      setError("")
      try {
        const res = await fetch("/api/super-admin/licenses")
        if (!res.ok) throw new Error("Failed to fetch licenses")
        const data = await res.json()
        setLicenses(data.licenses || [])
      } catch (err) {
        setError("Could not load licenses.")
      } finally {
        setLoading(false)
      }
    }
    fetchLicenses()
  }, [])

  const filteredLicenses = licenses.filter(
    (license) =>
      (license.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
      case "expired":
        return <Badge variant="destructive">Expired</Badge>
      case "expiring_soon":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Expiring Soon</Badge>
      case "suspended":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Suspended</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  // Stat card values
  const activeLicenses = licenses.filter(l => l.status === "active").length;
  const expiringSoonLicenses = licenses.filter(l => {
    if (!l.licenseEnd) return false;
    const days = (new Date(l.licenseEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return days > 0 && days <= 30;
  }).length;
  const expiredLicenses = licenses.filter(l => {
    if (!l.licenseEnd) return false;
    return new Date(l.licenseEnd) < new Date();
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">License Management</h1>
          <p className="text-muted-foreground">Monitor and manage client licenses and renewals</p>
        </div>
        {/* <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2 bg-transparent">
            <RefreshCw className="h-4 w-4" />
            Bulk Renewal
          </Button>
          <Button className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Create License
          </Button>
        </div> */}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Licenses</CardTitle>
            <CreditCard className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLicenses}</div>
            <p className="text-xs text-muted-foreground">{licenses.length > 0 ? ((activeLicenses / licenses.length) * 100).toFixed(1) : 0}% of total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{expiringSoonLicenses}</div>
            <p className="text-xs text-muted-foreground">Within 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <Calendar className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{expiredLicenses}</div>
            <p className="text-xs text-muted-foreground">Require renewal</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            All Licenses
          </CardTitle>
          <CardDescription>View and manage all client licenses and their status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search licenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>License End</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-red-500">{error}</TableCell>
                  </TableRow>
                ) : filteredLicenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">No licenses found.</TableCell>
                  </TableRow>
                ) : (
                  filteredLicenses.map((license: any) => (
                    <TableRow key={license._id}>
                      <TableCell className="font-medium">{license.name || "-"}</TableCell>
                      <TableCell>{license.licenseEnd ? new Date(license.licenseEnd).toLocaleDateString() : "-"}</TableCell>
                      <TableCell>{license.status}</TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {license.users}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Renew License
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Calendar className="mr-2 h-4 w-4" />
                              Extend License
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {license.status === "active" ? (
                              <DropdownMenuItem>
                                <Pause className="mr-2 h-4 w-4" />
                                Suspend License
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem>
                                <Play className="mr-2 h-4 w-4" />
                                Activate License
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
