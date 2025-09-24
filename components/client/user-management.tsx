// "use client"

// import { useState } from "react"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Badge } from "@/components/ui/badge"
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu"
// import { Plus, Search, MoreHorizontal, Edit, Trash2, Mail, UserPlus, Shield, User } from "lucide-react"
// import Link from "next/link" 

// // Mock user data
// const mockUsers = [
//   {
//     id: "1",
//     name: "Alice Johnson",
//     email: "alice@acme.com",
//     role: "client-admin",
//     status: "active",
//     lastLogin: "2024-01-16 08:30",
//     inviteStatus: "accepted",
//   },
//   {
//     id: "2",
//     name: "Bob Wilson",
//     email: "bob@acme.com",
//     role: "client-user",
//     status: "active",
//     lastLogin: "2024-01-15 14:20",
//     inviteStatus: "accepted",
//   },
//   {
//     id: "3",
//     name: "Carol Davis",
//     email: "carol@acme.com",
//     role: "client-user",
//     status: "active",
//     lastLogin: "2024-01-16 09:15",
//     inviteStatus: "accepted",
//   },
//   {
//     id: "4",
//     name: "David Chen",
//     email: "david@acme.com",
//     role: "client-user",
//     status: "pending",
//     lastLogin: null,
//     inviteStatus: "pending",
//   },
// ]

// export function UserManagement() {
//   const [searchTerm, setSearchTerm] = useState("")
//   const [users] = useState(mockUsers)

//   const filteredUsers = users.filter(
//     (user) =>
//       user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       user.email.toLowerCase().includes(searchTerm.toLowerCase()),
//   )

//   const getStatusBadge = (status: string) => {
//     switch (status) {
//       case "active":
//         return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
//       case "pending":
//         return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Pending</Badge>
//       case "suspended":
//         return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Suspended</Badge>
//       default:
//         return <Badge variant="secondary">{status}</Badge>
//     }
//   }

//   const getRoleBadge = (role: string) => {
//     switch (role) {
//       case "client-admin":
//         return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Admin</Badge>
//       case "client-user":
//         return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">User</Badge>
//       default:
//         return <Badge variant="secondary">{role}</Badge>
//     }
//   }

//   const formatLastLogin = (lastLogin: string | null) => {
//     if (!lastLogin) return "Never"
//     return new Date(lastLogin).toLocaleDateString("en-US", {
//       month: "short",
//       day: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//     })
//   }

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-3xl font-bold text-foreground">User Management</h1>
//           <p className="text-muted-foreground">Manage team members and their access permissions</p>
//         </div>
//         <Button className="flex items-center gap-2">
//           <Link href="/client-dashboard/users/new">
//           <Plus className="h-4 w-4" />
//           Invite User
//           </Link>
//         </Button>
//       </div>

//       {/* Summary Cards */}
//       <div className="grid gap-4 md:grid-cols-4">
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Total Users</CardTitle>
//             <UserPlus className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">{users.length}</div>
//             <p className="text-xs text-muted-foreground">Team members</p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Active Users</CardTitle>
//             <User className="h-4 w-4 text-green-600" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold text-green-600">{users.filter((u) => u.status === "active").length}</div>
//             <p className="text-xs text-muted-foreground">Currently active</p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
//             <Mail className="h-4 w-4 text-orange-600" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold text-orange-600">
//               {users.filter((u) => u.status === "pending").length}
//             </div>
//             <p className="text-xs text-muted-foreground">Awaiting acceptance</p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Admins</CardTitle>
//             <Shield className="h-4 w-4 text-purple-600" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold text-purple-600">
//               {users.filter((u) => u.role === "client-admin").length}
//             </div>
//             <p className="text-xs text-muted-foreground">Admin privileges</p>
//           </CardContent>
//         </Card>
//       </div>

//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <UserPlus className="h-5 w-5" />
//             Team Members
//           </CardTitle>
//           <CardDescription>Manage your organization's users and their permissions</CardDescription>
//         </CardHeader>
//         <CardContent>
//           <div className="flex items-center gap-4 mb-6">
//             <div className="relative flex-1 max-w-sm">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//               <Input
//                 placeholder="Search users..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="pl-10"
//               />
//             </div>
//           </div>

//           <div className="rounded-md border">
//             <Table>
//               <TableHeader>
//                 <TableRow>
//                   <TableHead>Name</TableHead>
//                   <TableHead>Email</TableHead>
//                   <TableHead>Role</TableHead>
//                   <TableHead>Status</TableHead>
//                   <TableHead>Last Login</TableHead>
//                   <TableHead className="w-[70px]">Actions</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {filteredUsers.map((user) => (
//                   <TableRow key={user.id}>
//                     <TableCell className="font-medium">{user.name}</TableCell>
//                     <TableCell>{user.email}</TableCell>
//                     <TableCell>{getRoleBadge(user.role)}</TableCell>
//                     <TableCell>{getStatusBadge(user.status)}</TableCell>
//                     <TableCell>{formatLastLogin(user.lastLogin)}</TableCell>
//                     <TableCell>
//                       <DropdownMenu>
//                         <DropdownMenuTrigger asChild>
//                           <Button variant="ghost" className="h-8 w-8 p-0">
//                             <MoreHorizontal className="h-4 w-4" />
//                           </Button>
//                         </DropdownMenuTrigger>
//                         <DropdownMenuContent align="end">
//                           <DropdownMenuItem>
//                             <Edit className="mr-2 h-4 w-4" />
//                             Edit User
//                           </DropdownMenuItem>
//                           {user.status === "pending" && (
//                             <DropdownMenuItem>
//                               <Mail className="mr-2 h-4 w-4" />
//                               Resend Invite
//                             </DropdownMenuItem>
//                           )}
//                           <DropdownMenuSeparator />
//                           <DropdownMenuItem className="text-destructive">
//                             <Trash2 className="mr-2 h-4 w-4" />
//                             Remove User
//                           </DropdownMenuItem>
//                         </DropdownMenuContent>
//                       </DropdownMenu>
//                     </TableCell>
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   )
// }





"use client"

import { useState } from "react"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, Search, MoreHorizontal, Edit, Trash2, Mail, UserPlus, Shield, User, UserX, UserCheck } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"




import { useEffect } from "react"

export function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteForm, setInviteForm] = useState({ name: "", email: "", status: "pending" })

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      try {
        const res = await fetch("/api/users")
        const data = await res.json()
        if (res.ok && Array.isArray(data.users)) {
          setUsers(data.users)
        } else {
          setUsers([])
        }
      } catch {
        setUsers([])
      }
      setLoading(false)
    }
    fetchUsers()
  }, [])

  // Invite user handler
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inviteForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to invite user");
      setUsers((prev) => [...prev, data.user || data.userId ? { ...inviteForm, _id: data.user?._id || data.userId, status: inviteForm.status, role: "client-user" } : inviteForm]);
      setInviteForm({ name: "", email: "", status: "pending" });
    } catch (err: any) {
      alert(err.message);
    }
  };


  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
      case "pending":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Pending</Badge>
      case "suspended":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Suspended</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "client-admin":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Admin</Badge>
      case "client-user":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">User</Badge>
      default:
        return <Badge variant="secondary">{role}</Badge>
    }
  }

  const formatLastLogin = (lastLogin: string | null) => {
    if (!lastLogin) return "Never"
    return new Date(lastLogin).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading users...</div>
  }
  return (
    <div className="space-y-6">
      {/* Header with Invite User Modal */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground1">User Management</h1>
          <p className="text-muted-foreground">Manage team members and their access permissions</p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Invite User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-black">Invite a User</DialogTitle>
              <DialogDescription>Fill in the details to add a new user.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-black">Full Name</Label>
                <Input
                  id="name"
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                  className="text-black border-black/50"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-black">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="text-black border-black/50"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-black">Status</Label>
                <Select
                
                  value={inviteForm.status}
                  onValueChange={(val) => setInviteForm({ ...inviteForm, status: val })}
                >
                  <SelectTrigger>
                    <SelectValue className="text-black" placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">
                Add User & Send Invite
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground font-semibold">Team members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <User className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {users.filter((u) => u.status === "active").length}
            </div>
            <p className="text-xs text-muted-foreground font-semibold">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
            <Mail className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {users.filter((u) => u.status === "pending").length}
            </div>
            <p className="text-xs text-muted-foreground font-semibold">Awaiting acceptance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {users.filter((u) => u.role === "client-admin").length}
            </div>
            <p className="text-xs text-muted-foreground font-semibold">Admin privileges</p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center font-semibold gap-2">
            <UserPlus className="h-5 w-5" />
            Team Members
          </CardTitle>
          <CardDescription className="font-semibold">Manage your organization's users and their permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
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
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell>{formatLastLogin(user.lastLogin)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {user.status === "active" && (
                            <DropdownMenuItem
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  const res = await fetch("/api/users", {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ userId: user._id, status: "suspended" }),
                                  });
                                  if (!res.ok) throw new Error("Failed to suspend user");
                                  setUsers((prev) => prev.map((u) => u._id === user._id ? { ...u, status: "suspended" } : u));
                                } catch (err) {
                                  alert("Failed to suspend user");
                                }
                              }}
                            >
                              <UserX className="mr-2 h-4 w-4 text-red-600" />
                              Suspend
                            </DropdownMenuItem>
                          )}
                          {user.status === "suspended" && (
                            <DropdownMenuItem
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  const res = await fetch("/api/users", {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ userId: user._id, status: "active" }),
                                  });
                                  if (!res.ok) throw new Error("Failed to activate user");
                                  setUsers((prev) => prev.map((u) => u._id === user._id ? { ...u, status: "active" } : u));
                                } catch (err) {
                                  alert("Failed to activate user");
                                }
                              }}
                            >
                              <UserCheck className="mr-2 h-4 w-4 text-green-600" />
                              Activate
                            </DropdownMenuItem>
                          )}
                          {user.status === "pending" && (
                            <DropdownMenuItem>
                              <Mail className="mr-2 h-4 w-4" />
                              Resend Invite
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (!window.confirm("Are you sure you want to delete this user?")) return;
                              try {
                                const res = await fetch("/api/users", {
                                  method: "DELETE",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ userId: user._id }),
                                });
                                if (!res.ok) throw new Error("Failed to delete user");
                                setUsers((prev) => prev.filter((u) => u._id !== user._id));
                              } catch (err) {
                                alert("Failed to delete user");
                              }
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
