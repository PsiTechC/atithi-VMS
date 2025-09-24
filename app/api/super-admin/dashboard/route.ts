import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import Client from "@/models/Client"

export async function GET() {
  try {
    await dbConnect()

    // Get all clients
    const clients = await Client.find({}).sort({ createdAt: -1 })

    // Calculate stats
    const totalClients = clients.length
    const activeClients = clients.filter(c => c.status === 'active').length
    const expiredLicenses = clients.filter(c => {
      const now = new Date()
      return c.licenseEnd && new Date(c.licenseEnd) < now
    }).length
    const totalUsers = clients.reduce((sum, c) => sum + (c.users || 0), 0)

    // Recent activity based on actual client creation/update times
    const recentActivity = clients.slice(0, 4).map((c, index) => {
      // Convert UTC createdAt to IST for display
      const createdAtUTC = new Date(c.createdAt)
      const istOffset = 5.5 * 60 * 60 * 1000 // IST is UTC+5:30 in milliseconds
      const createdAtIST = new Date(createdAtUTC.getTime() + istOffset)

      // Calculate hours ago in IST
      const now = new Date()
      const nowIST = new Date(now.getTime() + istOffset)
      const hoursDiff = Math.floor((nowIST.getTime() - createdAtIST.getTime()) / (1000 * 60 * 60))

      let timeString
      if (hoursDiff < 1) {
        timeString = "Less than 1 hour ago (IST)"
      } else if (hoursDiff < 24) {
        timeString = `${hoursDiff} hours ago (IST)`
      } else {
        const daysDiff = Math.floor(hoursDiff / 24)
        timeString = `${daysDiff} days ago (IST)`
      }

      return {
        id: c._id.toString(),
        action: index === 0 ? "New client registered" : "Client updated",
        client: c.name,
        time: timeString,
        type: index === 0 ? "success" : "info"
      }
    })

    // Upcoming expirations
    const upcomingExpirations = clients
      .filter(c => c.licenseEnd && new Date(c.licenseEnd) > new Date())
      .sort((a, b) => new Date(a.licenseEnd).getTime() - new Date(b.licenseEnd).getTime())
      .slice(0, 3)
      .map(c => {
        const daysUntilExpiry = Math.ceil((new Date(c.licenseEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        let expiresIn = `${daysUntilExpiry} days`
        let status = "info"

        if (daysUntilExpiry <= 3) {
          expiresIn = `${daysUntilExpiry} days`
          status = "warning"
        } else if (daysUntilExpiry <= 7) {
          expiresIn = "1 week"
        } else if (daysUntilExpiry <= 14) {
          expiresIn = "2 weeks"
        }

        return {
          id: c._id.toString(),
          client: c.name,
          expiresIn,
          status
        }
      })

    const stats = {
      totalClients,
      activeClients,
      expiredLicenses,
      totalUsers,
      recentActivity,
      upcomingExpirations
    }

    return NextResponse.json(stats)
  } catch (err: any) {
    console.error("Dashboard stats error:", err)
    return NextResponse.json({ error: err.message || "Failed to fetch dashboard stats" }, { status: 500 })
  }
}
