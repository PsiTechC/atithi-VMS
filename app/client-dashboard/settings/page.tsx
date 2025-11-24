"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Users,
  CreditCard,
  Target,
  UserCheck,
  MapPin,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react"
import { useAuth } from "@/components/auth/role-guard"
import { RoleGuard } from "@/components/auth/role-guard"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { EditDialog } from "@/components/client/EditDialog"

interface Host {
  _id: string;
  name: string;
  department: string;
  email: string;
   phone: string;
  phones: string[];
  imageUrl?: string | File;        // NEW: uploaded image
  isActive?: boolean;       // NEW: active/inactive
  bloodGroup?: string;      // NEW: blood group
  approvalRequired?: boolean; // NEW: approval required
  createdAt: string;
  updatedAt: string;
}


interface IdType {
  _id: string;
  name: string;
  description: string;
  required: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Department {
  _id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface Designation {
  _id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface Purpose {
  _id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface VisitorType {
  _id: string;
  name: string;
  description: string;
  color?: string;
  accessLevel?: string;
  createdAt: string;
  updatedAt: string;
}

interface AccessPoint {
  _id: string;
  name: string;
  description: string;
  location?: string;
  deviceId?: string | null;
  active?: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function SettingsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("hosts")
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Data states
  const [hosts, setHosts] = useState<Host[]>([])
  const [idTypes, setIdTypes] = useState<IdType[]>([])
  const [purposes, setPurposes] = useState<Purpose[]>([])
  const [visitorTypes, setVisitorTypes] = useState<VisitorType[]>([])
  const [accessPoints, setAccessPoints] = useState<AccessPoint[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [designations, setDesignations] = useState<Designation[]>([])

  const [defaultCheckoutHour, setDefaultCheckoutHour] = useState<number | "">("");

  // Form states for adding new items
 // const [newHost, setNewHost] = useState({ name: "", department: "", email: "", phone: "" })
  const [newHost, setNewHost] = useState({
    name: "",
    department: "",
    email: "",
    // phone: "",
     phones: [""], 
    imageUrl: "",
    isActive: true,
    bloodGroup: "",
    approvalRequired: false
  });
 
 const [newIdType, setNewIdType] = useState({ name: "", description: "", required: false })
  const [newPurpose, setNewPurpose] = useState({ name: "", description: "" })
  const [newVisitorType, setNewVisitorType] = useState({ name: "", description: "", color: "blue", accessLevel: "Standard" })
    const [newAccessPoint, setNewAccessPoint] = useState({ name: "", description: "", location: "", deviceId: "", active: true })
  const [newDepartment, setNewDepartment] = useState({ name: "", description: "" })
  const [newDesignation, setNewDesignation] = useState({ name: "", description: "" })

  // Edit states
  const [editingHost, setEditingHost] = useState<Host | null>(null)
  const [editingIdType, setEditingIdType] = useState<IdType | null>(null)
  const [editingPurpose, setEditingPurpose] = useState<Purpose | null>(null)
  const [editingVisitorType, setEditingVisitorType] = useState<VisitorType | null>(null)
  const [editingAccessPoint, setEditingAccessPoint] = useState<AccessPoint | null>(null)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [editingDesignation, setEditingDesignation] = useState<Designation | null>(null)

  // Password change form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  // Fetch data functions
  const fetchHosts = async () => {
    try {
      const response = await fetch('/api/client/settings/hosts')
      if (response.ok) {
        const data = await response.json()
        setHosts(data)
      }
    } catch (error) {
      console.error('Error fetching hosts:', error)
    }
  }

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/client/settings/departments')
      if (response.ok) {
        const data = await response.json()
        setDepartments(data)
      }
    } catch (error) {
      console.error('Error fetching departments:', error)
    }
  }
  const fetchDesignations = async () => {
    try {
      const response = await fetch('/api/client/settings/designations')
      if (response.ok) {
        const data = await response.json()
        setDesignations(data)
      }
    } catch (error) {
      console.error('Error fetching designations:', error)
    }
  }


  const fetchIdTypes = async () => {
    try {
      const response = await fetch('/api/client/settings/id-types')
      if (response.ok) {
        const data = await response.json()
        setIdTypes(data)
      }
    } catch (error) {
      console.error('Error fetching ID types:', error)
    }
  }

  const fetchPurposes = async () => {
    try {
      const response = await fetch('/api/client/settings/purposes')
      if (response.ok) {
        const data = await response.json()
        setPurposes(data)
      }
    } catch (error) {
      console.error('Error fetching purposes:', error)
    }
  }

  const fetchVisitorTypes = async () => {
    try {
      const response = await fetch('/api/client/settings/visitor-types')
      if (response.ok) {
        const data = await response.json()
        setVisitorTypes(data)
      }
    } catch (error) {
      console.error('Error fetching visitor types:', error)
    }
  }

  const fetchAccessPoints = async () => {
    try {
      const response = await fetch('/api/client/settings/access-points')
      if (response.ok) {
        const data = await response.json()
        setAccessPoints(data)
      }
    } catch (error) {
      console.error('Error fetching access points:', error)
    }
  }

  // Fetch all data on component mount
  useEffect(() => {
    fetchHosts()
    fetchIdTypes()
    fetchPurposes()
    fetchVisitorTypes()
    fetchAccessPoints()
    fetchDepartments()
    fetchDesignations()
  }, [])

  const showSuccess = (message: string) => {
    setSuccess(message)
    setError("")
    setTimeout(() => setSuccess(""), 3000)
  }

  const showError = (message: string) => {
    setError(message)
    setSuccess("")
    setTimeout(() => setError(""), 3000)
  }

  useEffect(() => {
    const loadCheckoutHour = async () => {
      try {
        const res = await fetch("/api/client/settings/security");
        const data = await res.json();
        if (res.ok && data.success) {
          setDefaultCheckoutHour(data.defaultCheckoutHour);
        }
      } catch (err) {
        console.error("Error loading checkout hour:", err);
      }
    };
    loadCheckoutHour();
  }, []);

  const handleAddHost = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    // Store form reference before async code
    const form = e.currentTarget;

    // Clean up image preview URL if present
    if (newHost.imageUrl && newHost.imageUrl.startsWith("blob:")) {
      URL.revokeObjectURL(newHost.imageUrl);
    }

    try {
      // 👇 Grab all inputs (text + file) from the form directly
      const formData = new FormData(form);

      // Add boolean/string fields from state
      formData.append("isActive", String(newHost.isActive));
      formData.append("bloodGroup", newHost.bloodGroup || "");
      formData.append("approvalRequired", String(newHost.approvalRequired));

      // Add all phone numbers
newHost.phones
  .filter((p) => p.trim() !== "")
  .forEach((num) => formData.append("phones[]", num));

      const res = await fetch("/api/client/settings/hosts", {
        method: "POST",
        body: formData, // ✅ includes file automatically
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create host");
      }

      showSuccess(`Host ${newHost.name} created successfully`);
      fetchHosts();

      // Reset form state
      setNewHost({
        name: "",
        department: "",
        email: "",
        // phone: "",
        phones: [""],
        imageUrl: "",
        isActive: true,
        bloodGroup: "",
        approvalRequired: false,
      });

      // Optionally clear the file input
      form && form.reset();
    } catch (err) {
      showError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };



  const handleAddIdType = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch('/api/client/settings/id-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIdType)
      })

      if (response.ok) {
        showSuccess(`ID Type ${newIdType.name} added successfully`)
        setNewIdType({ name: "", description: "", required: false })
        fetchIdTypes() // Refresh the list
      } else {
        const errorData = await response.json()
        showError(errorData.error || "Failed to add ID type")
      }
    } catch (err) {
      showError("Failed to add ID type")
    } finally {
      setLoading(false)
    }
  }

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch('/api/client/settings/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDepartment)
      })
      if (response.ok) {
        showSuccess(`Department ${newDepartment.name} added successfully`)
        setNewDepartment({ name: "", description: "" })
        fetchDepartments() // Refresh the list
      } else {
        const errorData = await response.json()
        showError(errorData.error || "Failed to add department")
      }
    } catch (err) {
      showError("Failed to add department")
    } finally {
      setLoading(false)
    }
  }


  const handleAddDesignation = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch('/api/client/settings/designations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDesignation)
      })
      if (response.ok) {
        showSuccess(`Designation ${newDesignation.name} added successfully`)
        setNewDesignation({ name: "", description: "" })
        fetchDesignations() // Refresh the list
      } else {
        const errorData = await response.json()
        showError(errorData.error || "Failed to add designation")
      }
    } catch (err) {
      showError("Failed to add designation")
    } finally {
      setLoading(false)
    }
  }


  const handleAddPurpose = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch('/api/client/settings/purposes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPurpose)
      })

      if (response.ok) {
        showSuccess(`Purpose ${newPurpose.name} added successfully`)
        setNewPurpose({ name: "", description: "" })
        fetchPurposes() // Refresh the list
      } else {
        const errorData = await response.json()
        showError(errorData.error || "Failed to add purpose")
      }
    } catch (err) {
      showError("Failed to add purpose")
    } finally {
      setLoading(false)
    }
  }

  const handleAddVisitorType = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch('/api/client/settings/visitor-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVisitorType)
      })

      if (response.ok) {
        showSuccess(`Visitor Type ${newVisitorType.name} added successfully`)
        setNewVisitorType({ name: "", description: "", color: "blue", accessLevel: "Standard" })
        fetchVisitorTypes() // Refresh the list
      } else {
        const errorData = await response.json()
        showError(errorData.error || "Failed to add visitor type")
      }
    } catch (err) {
      showError("Failed to add visitor type")
    } finally {
      setLoading(false)
    }
  }

  const handleAddAccessPoint = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch('/api/client/settings/access-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAccessPoint)
      })

      if (response.ok) {
        showSuccess(`Access Point ${newAccessPoint.name} added successfully`)
  setNewAccessPoint({ name: "", description: "", location: "", deviceId: "", active: true })
        fetchAccessPoints() // Refresh the list
      } else {
        const errorData = await response.json()
        showError(errorData.error || "Failed to add access point")
      }
    } catch (err) {
      showError("Failed to add access point")
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      if (!token) {
        showError("Authentication token not found. Please log in again.");
        setLoading(false);
        return;
      }

      const isFirstSet = !passwordForm.currentPassword?.trim(); // empty => first-time set
      const endpoint = isFirstSet
        ? "/api/client/settings/set-password"
        : "/api/client/settings/change-password";

      const payload = isFirstSet
        ? {
          newPassword: passwordForm.newPassword,
          confirmPassword: passwordForm.confirmPassword,
        }
        : {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
          confirmPassword: passwordForm.confirmPassword,
        };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // ← this is the line you asked “where to put”
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showSuccess(data.message || "Password updated successfully");
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        showError(data.error || "Failed to update password. Please try again.");
      }
    } catch (err) {
      showError("Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  // Edit handlers
  // const handleEditHost = async (e: React.FormEvent) => {
  //   e.preventDefault()
  //   if (!editingHost) return

  //   setLoading(true)
  //   try {
  //     const response = await fetch(`/api/client/settings/hosts/${editingHost._id}`, {
  //       method: 'PUT',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify(editingHost)
  //     })

  //     if (response.ok) {
  //       showSuccess(`Host ${editingHost.name} updated successfully`)
  //       setEditingHost(null)
  //       fetchHosts()
  //     } else {
  //       const errorData = await response.json()
  //       showError(errorData.error || "Failed to update host")
  //     }
  //   } catch (err) {
  //     showError("Failed to update host")
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  // Edit handlers
const handleEditHost = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!editingHost) return;

  setLoading(true);
  try {
    const formData = new FormData();

    formData.append("name", editingHost.name || "");
    formData.append("department", editingHost.department || "");
    formData.append("email", editingHost.email || "");
    // formData.append("phone", editingHost.phone || "");
    formData.append("isActive", String(editingHost.isActive ?? true));
    formData.append("bloodGroup", editingHost.bloodGroup || "");
    formData.append("approvalRequired", String(editingHost.approvalRequired ?? false));

     // ✅ Append all phone numbers
    if (Array.isArray(editingHost.phones)) {
      editingHost.phones
        .filter((p) => p.trim() !== "")
        .forEach((num) => formData.append("phones[]", num));
    }

    // 👇 If image was changed and is a File, append it
    if (editingHost.imageUrl instanceof File) {
      formData.append("image", editingHost.imageUrl);
    }

    const response = await fetch(`/api/client/settings/hosts/${editingHost._id}`, {
      method: "PUT",
      body: formData, // ✅ don't set Content-Type manually
    });

    if (response.ok) {
      showSuccess(`Host ${editingHost.name} updated successfully`);
      setEditingHost(null);
      fetchHosts();
    } else {
      const errorData = await response.json();
      showError(errorData.error || "Failed to update host");
    }
  } catch (err) {
    showError("Failed to update host");
  } finally {
    setLoading(false);
  }
};


  const handleEditIdType = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingIdType) return

    setLoading(true)
    try {
      const response = await fetch(`/api/client/settings/id-types/${editingIdType._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingIdType)
      })

      if (response.ok) {
        showSuccess(`ID Type ${editingIdType.name} updated successfully`)
        setEditingIdType(null)
        fetchIdTypes()
      } else {
        const errorData = await response.json()
        showError(errorData.error || "Failed to update ID type")
      }
    } catch (err) {
      showError("Failed to update ID type")
    } finally {
      setLoading(false)
    }
  }

  const handleEditDepartment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingDepartment) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/client/settings/departments/${editingDepartment._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingDepartment._id,
          name: editingDepartment.name,
          description: editingDepartment.description
        })
      })
      if (response.ok) {
        showSuccess(`Department ${editingDepartment.name} updated successfully`)
        setEditingDepartment(null)
        fetchDepartments()
      } else {
        const errorData = await response.json()
        showError(errorData.error || "Failed to update department")
      }
    } catch (err) {
      showError("Failed to update department")
    } finally {
      setLoading(false)
    }
  }

  const handleEditDesignation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingDesignation) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/client/settings/designations/${editingDesignation._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingDesignation._id,
          name: editingDesignation.name,
          description: editingDesignation.description
        })
      })
      if (response.ok) {
        showSuccess(`Designation ${editingDesignation.name} updated successfully`)
        setEditingDesignation(null)
        fetchDesignations()
      } else {
        const errorData = await response.json()
        showError(errorData.error || "Failed to update designation")
      }
    } catch (err) {
      showError("Failed to update designation")
    } finally {
      setLoading(false)
    }
  }


  const handleEditPurpose = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPurpose) return

    setLoading(true)
    try {
      const response = await fetch(`/api/client/settings/purposes/${editingPurpose._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPurpose)
      })

      if (response.ok) {
        showSuccess(`Purpose ${editingPurpose.name} updated successfully`)
        setEditingPurpose(null)
        fetchPurposes()
      } else {
        const errorData = await response.json()
        showError(errorData.error || "Failed to update purpose")
      }
    } catch (err) {
      showError("Failed to update purpose")
    } finally {
      setLoading(false)
    }
  }

  const handleEditVisitorType = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingVisitorType) return

    setLoading(true)
    try {
      const response = await fetch(`/api/client/settings/visitor-types/${editingVisitorType._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingVisitorType)
      })

      if (response.ok) {
        showSuccess(`Visitor Type ${editingVisitorType.name} updated successfully`)
        setEditingVisitorType(null)
        fetchVisitorTypes()
      } else {
        const errorData = await response.json()
        showError(errorData.error || "Failed to update visitor type")
      }
    } catch (err) {
      showError("Failed to update visitor type")
    } finally {
      setLoading(false)
    }
  }

  const handleEditAccessPoint = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAccessPoint) return

    setLoading(true)
    try {
      const response = await fetch(`/api/client/settings/access-points/${editingAccessPoint._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...editingAccessPoint,
            deviceId: (editingAccessPoint as any).deviceId ?? null,
          })
        })

      if (response.ok) {
        showSuccess(`Access Point ${editingAccessPoint.name} updated successfully`)
        setEditingAccessPoint(null)
        fetchAccessPoints()
      } else {
        const errorData = await response.json()
        showError(errorData.error || "Failed to update access point")
      }
    } catch (err) {
      showError("Failed to update access point")
    } finally {
      setLoading(false)
    }
  }

  // Delete handlers
  const handleDeleteHost = async (hostId: string, hostName: string) => {
    if (!confirm(`Are you sure you want to delete host "${hostName}"?`)) return

    setLoading(true)
    try {
      const response = await fetch(`/api/client/settings/hosts/${hostId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showSuccess(`Host ${hostName} deleted successfully`)
        fetchHosts()
      } else {
        const errorData = await response.json()
        showError(errorData.error || "Failed to delete host")
      }
    } catch (err) {
      showError("Failed to delete host")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteIdType = async (idTypeId: string, idTypeName: string) => {
    if (!confirm(`Are you sure you want to delete ID type "${idTypeName}"?`)) return

    setLoading(true)
    try {
      const response = await fetch(`/api/client/settings/id-types/${idTypeId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showSuccess(`ID Type ${idTypeName} deleted successfully`)
        fetchIdTypes()
      } else {
        const errorData = await response.json()
        showError(errorData.error || "Failed to delete ID type")
      }
    } catch (err) {
      showError("Failed to delete ID type")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDepartment = async (departmentId: string, departmentName: string) => {
    if (!confirm(`Are you sure you want to delete department "${departmentName}"?`)) return

    setLoading(true)
    try {
      const response = await fetch(`/api/client/settings/departments/${departmentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: departmentId })
      })

      if (response.ok) {
        showSuccess(`Department ${departmentName} deleted successfully`)
        fetchDepartments()
      } else {
        const errorData = await response.json()
        showError(errorData.error || "Failed to delete department")
      }
    } catch (err) {
      showError("Failed to delete department")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDesignation = async (designationId: string, designationName: string) => {
    if (!confirm(`Are you sure you want to delete designation "${designationName}"?`)) return

    setLoading(true)
    try {
      const response = await fetch(`/api/client/settings/designations/${designationId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: designationId })
      })

      if (response.ok) {
        showSuccess(`Designation ${designationName} deleted successfully`)
        fetchDesignations()
      } else {
        const errorData = await response.json()
        showError(errorData.error || "Failed to delete designation")
      }
    } catch (err) {
      showError("Failed to delete designation")
    } finally {
      setLoading(false)
    }
  } 

  const handleDeletePurpose = async (purposeId: string, purposeName: string) => {
    if (!confirm(`Are you sure you want to delete purpose "${purposeName}"?`)) return

    setLoading(true)
    try {
      const response = await fetch(`/api/client/settings/purposes/${purposeId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showSuccess(`Purpose ${purposeName} deleted successfully`)
        fetchPurposes()
      } else {
        const errorData = await response.json()
        showError(errorData.error || "Failed to delete purpose")
      }
    } catch (err) {
      showError("Failed to delete purpose")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteVisitorType = async (visitorTypeId: string, visitorTypeName: string) => {
    if (!confirm(`Are you sure you want to delete visitor type "${visitorTypeName}"?`)) return

    setLoading(true)
    try {
      const response = await fetch(`/api/client/settings/visitor-types/${visitorTypeId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showSuccess(`Visitor Type ${visitorTypeName} deleted successfully`)
        fetchVisitorTypes()
      } else {
        const errorData = await response.json()
        showError(errorData.error || "Failed to delete visitor type")
      }
    } catch (err) {
      showError("Failed to delete visitor type")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccessPoint = async (accessPointId: string, accessPointName: string) => {
    if (!confirm(`Are you sure you want to delete access point "${accessPointName}"?`)) return

    setLoading(true)
    try {
      const response = await fetch(`/api/client/settings/access-points/${accessPointId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showSuccess(`Access Point ${accessPointName} deleted successfully`)
        fetchAccessPoints()
      } else {
        const errorData = await response.json()
        showError(errorData.error || "Failed to delete access point")
      }
    } catch (err) {
      showError("Failed to delete access point")
    } finally {
      setLoading(false)
    }
  }

  if (user?.role !== "client-admin") {
    return (
      <RoleGuard allowedRoles={["client-admin"]}>
        <DashboardLayout title="Client Portal" showHeaderNav={true}>
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">Only client administrators can access settings.</p>
            </div>
          </div>
        </DashboardLayout>
      </RoleGuard>
    )
  }

  return (
    <RoleGuard allowedRoles={["client-admin"]}>
      <DashboardLayout title="Client Portal" showHeaderNav={true}>
        <div className="space-y-2">
          <div>
            <h1 className="text-3xl font-bold text-foreground1">Settings</h1>
            <p className="text-muted-foreground font-semibold">Configure your client portal settings and preferences</p>
          </div>

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="hosts" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Hosts
          </TabsTrigger>
          <TabsTrigger value="departments" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Departments
          </TabsTrigger>
          <TabsTrigger value="designations" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Designations
          </TabsTrigger>
          <TabsTrigger value="id-types" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            ID Types
          </TabsTrigger>
          <TabsTrigger value="purposes" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Purposes
          </TabsTrigger>
          <TabsTrigger value="visitor-types" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Visitor Types
          </TabsTrigger>
          <TabsTrigger value="access-points" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Access Points
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

            {/* Hosts Tab */}
            <TabsContent value="hosts">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Add Host Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="h-5 w-5" />
                      Add New Host
                    </CardTitle>
                    <CardDescription>Add employees who can host visitors</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddHost} className="space-y-4">
                      {/* Full Name */}
                      <div className="space-y-2">
                        <Label htmlFor="host-name">Full Name *</Label>
                        <Input
                          id="host-name"
                          name="name" 
                          value={newHost.name}
                          onChange={(e) => setNewHost({ ...newHost, name: e.target.value })}
                          required
                          className="border-black/80"
                        />
                      </div>

                      {/* Department */}
                      <div className="space-y-2">
                        <Label htmlFor="host-department">Department</Label>
                        <Input
                          id="host-department"
                          name="department"       // 👈 important: give it a name
                          value={newHost.department}
                          onChange={(e) => setNewHost({ ...newHost, department: e.target.value })}
                          className="border-black/80"
                        />
                      </div>

                      {/* Email */}
                      <div className="space-y-2">
                        <Label htmlFor="host-email">Email Address</Label>
                        <Input
                          id="host-email"
                          name="email"            // 👈 important: give it a name
                          type="email"
                          value={newHost.email}
                          onChange={(e) => setNewHost({ ...newHost, email: e.target.value })}
                          className="border-black/80"
                        />
                      </div>

                      
                      {/* <div className="space-y-2">
                        <Label htmlFor="host-phone">Phone Number</Label>
                        <Input
                          id="host-phone"
                          name="phone"            // 👈 important: give it a name
                          type="tel"
                          value={newHost.phone}
                          onChange={(e) => setNewHost({ ...newHost, phone: e.target.value })}
                          className="border-black/80"
                        />
                      </div> */}


                      {/* Multiple Phone Numbers */}
<div className="space-y-2">
  <Label>Phone Numbers</Label>
  {newHost.phones.map((num, idx) => (
    <div key={idx} className="flex items-center gap-2 mb-2">
      <Input
        type="tel"
        name={`phones-${idx}`}
        placeholder={`Phone #${idx + 1}`}
        value={num}
        onChange={(e) => {
          const updated = [...newHost.phones];
          updated[idx] = e.target.value;
          setNewHost({ ...newHost, phones: updated });
        }}
        className="border-black/80 flex-1"
      />
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          setNewHost({
            ...newHost,
            phones: newHost.phones.filter((_, i) => i !== idx),
          })
        }
      >
        Remove
      </Button>
    </div>
  ))}
  <Button
    type="button"
    onClick={() => setNewHost({ ...newHost, phones: [...newHost.phones, ""] })}
  >
    + Add Phone
  </Button>
</div>


                      {/* Upload Image */}
                      <div className="space-y-2">
                        <Label htmlFor="host-image">Upload Image</Label>
                        <Input
                          id="host-image"
                          name="image"              // 👈 important: give it a name
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) {
                              setNewHost({ ...newHost, imageUrl: "" });
                              return;
                            }
                            const url = URL.createObjectURL(file); // 👈 local preview
                            setNewHost({ ...newHost, imageUrl: url });
                          }}
                        />
                        {newHost.imageUrl ? (
                          <img src={newHost.imageUrl} alt="Preview" className="h-16 w-16 rounded-full object-cover mt-2" />
                        ) : (
                          <p className="text-xs text-muted-foreground">PNG/JPG, up to ~2MB recommended.</p>
                        )}
                      </div>
                      {/* Active Status */}
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="host-active"
                          checked={newHost.isActive}
                          onChange={(e) => setNewHost({ ...newHost, isActive: e.target.checked })}
                          className="rounded"
                        />
                        <Label htmlFor="host-active">Active</Label>
                      </div>

                      {/* Blood Group */}
                      <div className="space-y-2">
                        <Label htmlFor="host-bloodgroup">Blood Group</Label>
                        <select
                          id="host-bloodgroup"
                          value={newHost.bloodGroup}
                          onChange={(e) => setNewHost({ ...newHost, bloodGroup: e.target.value })}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="">Select</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                        </select>
                      </div>

                      {/* Approval Required */}
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="host-approval"
                          checked={newHost.approvalRequired}
                          onChange={(e) => setNewHost({ ...newHost, approvalRequired: e.target.checked })}
                          className="rounded"
                        />
                        <Label htmlFor="host-approval">Approval Required</Label>
                      </div>

                      {/* Submit Button */}
                      <Button type="submit" disabled={loading} className="w-full">
                        {loading ? "Adding..." : "Add Host"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Current Hosts List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Current Hosts</CardTitle>
                    <CardDescription>Manage existing host employees</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-140 overflow-y-auto pr-2">
                      {hosts.map((host) => (
                        <div
                          key={host._id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{host.name}</p>
                            {/* <p className="text-sm text-muted-foreground">{host.department}</p>
                            <p className="text-xs text-muted-foreground">{host.email}</p> */}
                           <p className="font-medium flex items-center gap-2">
  {host.imageUrl && (
    <img
      src={typeof host.imageUrl === "string" ? host.imageUrl : URL.createObjectURL(host.imageUrl)}
      alt={host.name}
      className="h-8 w-8 rounded-full object-cover"
    />
  )}
</p>

                            <p className="text-sm text-muted-foreground">{host.department}</p>
                            <p className="text-xs text-muted-foreground">{host.email}</p>
                            <p className="text-xs">
                              Status: {host.isActive ? "Active ✅" : "Inactive ❌"}
                            </p>
                            {host.bloodGroup && <p className="text-xs">Blood Group: {host.bloodGroup}</p>}
                            <p className="text-xs">
                              Approval Required: {host.approvalRequired ? "Yes" : "No"}
                            </p>
                            </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Handle both legacy phone and phones array
                                const phonesToEdit = host.phones && host.phones.length > 0
                                  ? host.phones
                                  : host.phone
                                    ? [host.phone]
                                    : [""];
                                setEditingHost({ ...host, phones: phonesToEdit });
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteHost(host._id, host.name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>


        {/* Departments Tab */}
        <TabsContent value="departments">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add New Department
                </CardTitle>
                <CardDescription>Add organizational departments</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddDepartment} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="department-name">Department Name *</Label>
                    <Input
                      id="department-name"
                      value={newDepartment.name}
                      onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                      placeholder="e.g., Human Resources, IT"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department-description">Description</Label>
                    <Input
                      id="department-description"
                      value={newDepartment.description}
                      onChange={(e) => setNewDepartment({ ...newDepartment, description: e.target.value })}
                      placeholder="Optional description for this department"
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? "Adding..." : "Add Department"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Departments</CardTitle>
                <CardDescription>Manage organizational departments</CardDescription>
              </CardHeader>
              <CardContent>
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                  {departments.map((department) => (
                    <div key={department._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{department.name}</p>
                        {department.description && (
                          <p className="text-sm text-muted-foreground">{department.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingDepartment(department)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteDepartment(department._id, department.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
                  
        {/* Designations Tab */}
        <TabsContent value="designations">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add New Designation
                </CardTitle>
                <CardDescription>Add job titles or designations for hosts</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddDesignation} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="designation-name">Designation Name *</Label>
                    <Input
                      id="designation-name"
                      value={newDesignation.name}
                      onChange={(e) => setNewDesignation({ ...newDesignation, name: e.target.value })}
                      placeholder="e.g., Manager, Engineer"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="designation-description">Description</Label>
                    <Input
                      id="designation-description"
                      value={newDesignation.description}
                      onChange={(e) => setNewDesignation({ ...newDesignation, description: e.target.value })}
                      placeholder="Optional description for this designation"
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? "Adding..." : "Add Designation"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Designations</CardTitle>
                <CardDescription>Manage job titles and designations</CardDescription>
              </CardHeader>
              <CardContent>
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                  {designations.map((designation) => (
                    <div key={designation._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{designation.name}</p>
                        {designation.description && (
                          <p className="text-sm text-muted-foreground">{designation.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingDesignation(designation)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteDesignation(designation._id, designation.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      
        {/* ID Types Tab */}
        <TabsContent value="id-types">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add New ID Type
                </CardTitle>
                <CardDescription>Add acceptable identification types for visitors</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddIdType} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="id-type-name">ID Type Name *</Label>
                    <Input
                      id="id-type-name"
                      value={newIdType.name}
                      onChange={(e) => setNewIdType({ ...newIdType, name: e.target.value })}
                      placeholder="e.g., Driver's License, Passport"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="id-type-description">Description</Label>
                    <Input
                      id="id-type-description"
                      value={newIdType.description}
                      onChange={(e) => setNewIdType({ ...newIdType, description: e.target.value })}
                      placeholder="Optional description for this ID type"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="id-required"
                      checked={newIdType.required}
                      onChange={(e) => setNewIdType({ ...newIdType, required: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="id-required">Required for check-in</Label>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? "Adding..." : "Add ID Type"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current ID Types</CardTitle>
                <CardDescription>Manage acceptable identification types</CardDescription>
              </CardHeader>
              <CardContent>
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                  {idTypes.map((idType) => (
                    <div key={idType._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <p className="font-medium">{idType.name}</p>
                        {idType.description && (
                          <p className="text-sm text-muted-foreground">{idType.description}</p>
                        )}
                        {idType.required && (
                          <Badge variant="secondary" className="text-xs">
                            Required
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingIdType(idType)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteIdType(idType._id, idType.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Purposes Tab */}
        <TabsContent value="purposes">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add New Purpose
                </CardTitle>
                <CardDescription>Add visit purposes for better categorization</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddPurpose} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="purpose-name">Purpose Name *</Label>
                    <Input
                      id="purpose-name"
                      value={newPurpose.name}
                      onChange={(e) => setNewPurpose({ ...newPurpose, name: e.target.value })}
                      placeholder="e.g., Business Meeting, Interview"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="purpose-description">Description</Label>
                    <Input
                      id="purpose-description"
                      value={newPurpose.description}
                      onChange={(e) => setNewPurpose({ ...newPurpose, description: e.target.value })}
                      placeholder="Optional description for this purpose"
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? "Adding..." : "Add Purpose"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Purposes</CardTitle>
                <CardDescription>Manage visit purposes and categories</CardDescription>
              </CardHeader>
              <CardContent>
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                  {purposes.map((purpose) => (
                    <div key={purpose._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{purpose.name}</p>
                        {purpose.description && (
                          <p className="text-sm text-muted-foreground">{purpose.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingPurpose(purpose)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePurpose(purpose._id, purpose.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Visitor Types Tab */}
        <TabsContent value="visitor-types">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add New Visitor Type
                </CardTitle>
                <CardDescription>Define visitor categories with access levels</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddVisitorType} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="visitor-type-name">Visitor Type Name *</Label>
                    <Input
                      id="visitor-type-name"
                      value={newVisitorType.name}
                      onChange={(e) => setNewVisitorType({ ...newVisitorType, name: e.target.value })}
                      placeholder="e.g., Business Visitor, Contractor"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="visitor-type-description">Description</Label>
                    <Input
                      id="visitor-type-description"
                      value={newVisitorType.description}
                      onChange={(e) => setNewVisitorType({ ...newVisitorType, description: e.target.value })}
                      placeholder="Optional description for this visitor type"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="visitor-color">Badge Color</Label>
                    <select
                      id="visitor-color"
                      value={newVisitorType.color}
                      onChange={(e) => setNewVisitorType({ ...newVisitorType, color: e.target.value })}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="blue">Blue</option>
                      <option value="green">Green</option>
                      <option value="orange">Orange</option>
                      <option value="purple">Purple</option>
                      <option value="yellow">Yellow</option>
                      <option value="red">Red</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="access-level">Access Level</Label>
                    <select
                      id="access-level"
                      value={newVisitorType.accessLevel}
                      onChange={(e) => setNewVisitorType({ ...newVisitorType, accessLevel: e.target.value })}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="Restricted">Restricted</option>
                      <option value="Limited">Limited</option>
                      <option value="Standard">Standard</option>
                      <option value="Extended">Extended</option>
                    </select>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? "Adding..." : "Add Visitor Type"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Visitor Types</CardTitle>
                <CardDescription>Manage visitor categories and access levels</CardDescription>
              </CardHeader>
              <CardContent>
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                  {visitorTypes.map((type) => (
                    <div key={type._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full bg-${type.color}-500`}></div>
                        <div>
                          <p className="font-medium">{type.name}</p>
                          {type.description && (
                            <p className="text-sm text-muted-foreground">{type.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground">{type.accessLevel} Access</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingVisitorType(type)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteVisitorType(type._id, type.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Access Points Tab */}
        <TabsContent value="access-points">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add New Access Point
                </CardTitle>
                <CardDescription>Define entry/exit points for visitor tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddAccessPoint} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="access-point-name">Access Point Name *</Label>
                    <Input
                      id="access-point-name"
                      value={newAccessPoint.name}
                      onChange={(e) => setNewAccessPoint({ ...newAccessPoint, name: e.target.value })}
                      placeholder="e.g., Main Entrance, Reception Desk"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="access-point-description">Description</Label>
                    <Input
                      id="access-point-description"
                      value={newAccessPoint.description}
                      onChange={(e) => setNewAccessPoint({ ...newAccessPoint, description: e.target.value })}
                      placeholder="Optional description for this access point"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="access-point-location">Location</Label>
                    <Input
                      id="access-point-location"
                      value={newAccessPoint.location}
                      onChange={(e) => setNewAccessPoint({ ...newAccessPoint, location: e.target.value })}
                      placeholder="e.g., Building A - Ground Floor"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="access-point-device">Device ID</Label>
                    <Input
                      id="access-point-device"
                      value={newAccessPoint.deviceId}
                      onChange={(e) => setNewAccessPoint({ ...newAccessPoint, deviceId: e.target.value })}
                      placeholder="e.g., DS000001"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="access-active"
                      checked={newAccessPoint.active}
                      onChange={(e) => setNewAccessPoint({ ...newAccessPoint, active: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="access-active">Active</Label>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? "Adding..." : "Add Access Point"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Access Points</CardTitle>
                <CardDescription>Manage facility entry and exit points</CardDescription>
              </CardHeader>
              <CardContent>
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                  {accessPoints.map((point) => (
                    <div key={point._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${point.active ? "bg-green-500" : "bg-gray-400"}`}></div>
                        <div>
                          <p className="font-medium">{point.name}</p>
                          {point.description && (
                            <p className="text-sm text-muted-foreground">{point.description}</p>
                          )}
                          {point.location && (
                            <p className="text-xs text-muted-foreground">{point.location}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingAccessPoint(point)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            setLoading(true);
                            try {
                              const res = await fetch(`/api/client/settings/access-points/${point._id}/test-device`, { method: 'POST' });
                              const data = await res.json();
                              if (res.ok) {
                                showSuccess(`Device responded: ${data.payload ?? data.message ?? 'OK'}`);
                              } else {
                                showError(data.error || 'Device test failed');
                              }
                            } catch (err) {
                              showError('Device test failed');
                            } finally {
                              setLoading(false);
                            }
                          }}
                        >
                          Test
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteAccessPoint(point._id, point.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

            {/* Security Tab */}
            {/* Security Tab */}
            <TabsContent value="security">
              <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Default Checkout Hour */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Default Checkout Hour
                    </CardTitle>
                    <CardDescription>
                      Configure the default checkout time for visitors (in hours).
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const form = e.currentTarget as HTMLFormElement;
                        const hour = (form.defaultCheckoutHour as any).value;

                        try {
                          const res = await fetch("/api/client/settings/security", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ defaultCheckoutHour: Number(hour) }),
                          });

                          const data = await res.json();
                          if (res.ok && data.success) {
                            showSuccess(data.message || "Default checkout hour saved successfully");
                          } else {
                            showError(data.error || "Failed to save default checkout hour");
                          }
                        } catch (err) {
                          showError("Failed to save default checkout hour");
                        }
                      }}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="default-checkout-hour">Default Checkout Hour</Label>
                        <Input
                          id="default-checkout-hour"
                          name="defaultCheckoutHour"
                          type="number"
                          min="0"
                          placeholder="e.g., 8"
                          className="border-black/80"
                          value={defaultCheckoutHour}
                          onChange={(e) => setDefaultCheckoutHour(Number(e.target.value))}
                        />
                      </div>
                      <Button type="submit" className="w-full">
                        Save
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Change Password */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="h-5 w-5" />
                      Change Password
                    </CardTitle>
                    <CardDescription>
                      Update your account password. Make sure to choose a strong password.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        setLoading(true);
                        try {
                          const res = await fetch("/api/client/settings/security", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              currentPassword: passwordForm.currentPassword,
                              newPassword: passwordForm.newPassword,
                              confirmPassword: passwordForm.confirmPassword,
                            }),
                          });

                          const data = await res.json();
                          if (res.ok && data.success) {
                            showSuccess(data.message || "Password updated successfully");
                            setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                          } else {
                            showError(data.error || "Failed to update password");
                          }
                        } catch (err) {
                          showError("Failed to update password");
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="space-y-4"
                    >
                      {/* Current Password */}
                      <div className="space-y-2">
                        <Label htmlFor="current-password">Current Password *</Label>
                        <div className="relative">
                          <Input
                            id="current-password"
                            type={showPasswords.current ? "text" : "password"}
                            value={passwordForm.currentPassword}
                            onChange={(e) =>
                              setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                            }
                            placeholder="Enter your current password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() =>
                              setShowPasswords({ ...showPasswords, current: !showPasswords.current })
                            }
                          >
                            {showPasswords.current ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* New Password */}
                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password *</Label>
                        <div className="relative">
                          <Input
                            id="new-password"
                            type={showPasswords.new ? "text" : "password"}
                            value={passwordForm.newPassword}
                            onChange={(e) =>
                              setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                            }
                            placeholder="Enter your new password"
                            required
                            minLength={8}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() =>
                              setShowPasswords({ ...showPasswords, new: !showPasswords.new })
                            }
                          >
                            {showPasswords.new ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Password must be at least 8 characters long
                        </p>
                      </div>

                      {/* Confirm Password */}
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password *</Label>
                        <div className="relative">
                          <Input
                            id="confirm-password"
                            type={showPasswords.confirm ? "text" : "password"}
                            value={passwordForm.confirmPassword}
                            onChange={(e) =>
                              setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                            }
                            placeholder="Confirm your new password"
                            required
                            minLength={8}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() =>
                              setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })
                            }
                          >
                            {showPasswords.confirm ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <Button type="submit" disabled={loading} className="w-full">
                        {loading ? "Changing Password..." : "Change Password"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

      </Tabs>
        </div>

        {/* Host Edit Dialog */}
        {/* <EditDialog
          open={!!editingHost}
          title="Edit Host"
          description="Update host details"
          entity={editingHost}
          setEntity={setEditingHost}
          onSubmit={handleEditHost}
          loading={loading}
          fields={[
            { type: "text", name: "name", label: "Full Name *", required: true },
            { type: "text", name: "department", label: "Department *", required: true },
            { type: "email", name: "email", label: "Email *", required: true },
            { type: "tel", name: "phone", label: "Phone" },
          ]}
        /> */}
        <EditDialog
          open={!!editingHost}
          title="Edit Host"
          description="Update host details"
          entity={editingHost}
          setEntity={setEditingHost}
          onSubmit={handleEditHost}
          loading={loading}
          fields={[
            { type: "text", name: "name", label: "Full Name *", required: true },
            { type: "text", name: "department", label: "Department" },
            { type: "email", name: "email", label: "Email" },
            // { type: "tel", name: "phone", label: "Phone" },
            { type: "array", name: "phones", label: "Phone Numbers" },  // 👈 multi-phone field
            { type: "file", name: "imageUrl", label: "Upload Image" },
            { type: "checkbox", name: "isActive", label: "Active" },
            { type: "select", name: "bloodGroup", label: "Blood Group", options: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] },
            { type: "checkbox", name: "approvalRequired", label: "Approval Required" },
          ]}
        />


        {/* ID Type Edit Dialog */}
        <EditDialog
          open={!!editingIdType}
          title="Edit ID Type"
          description="Update ID type details"
          entity={editingIdType}
          setEntity={setEditingIdType}
          onSubmit={handleEditIdType}
          loading={loading}
          fields={[
            { type: "text", name: "name", label: "ID Type Name *", required: true },
            { type: "text", name: "description", label: "Description" },
            { type: "checkbox", name: "required", label: "Required for check-in" },
          ]}
        />

        {/* Purpose Edit Dialog */}
        <EditDialog
          open={!!editingPurpose}
          title="Edit Purpose"
          description="Update purpose details"
          entity={editingPurpose}
          setEntity={setEditingPurpose}
          onSubmit={handleEditPurpose}
          loading={loading}
          fields={[
            { type: "text", name: "name", label: "Purpose Name *", required: true },
            { type: "text", name: "description", label: "Description" },
          ]}
        />

        {/* Visitor Type Edit Dialog */}
        <EditDialog
          open={!!editingVisitorType}
          title="Edit Visitor Type"
          description="Update visitor type details"
          entity={editingVisitorType}
          setEntity={setEditingVisitorType}
          onSubmit={handleEditVisitorType}
          loading={loading}
          fields={[
            { type: "text", name: "name", label: "Visitor Type Name *", required: true },
            { type: "text", name: "description", label: "Description" },
            { type: "select", name: "color", label: "Badge Color", options: ["blue", "green", "orange", "purple", "yellow", "red"] },
            { type: "select", name: "accessLevel", label: "Access Level", options: ["Restricted", "Limited", "Standard", "Extended"] },
          ]}
        />

        {/* Access Point Edit Dialog */}
        {/* Department Edit Dialog */}
        <EditDialog
          open={!!editingDepartment}
          title="Edit Department"
          description="Update department details"
          entity={editingDepartment}
          setEntity={setEditingDepartment}
          onSubmit={handleEditDepartment}
          loading={loading}
          fields={[{ type: "text", name: "name", label: "Department Name *", required: true }, { type: "text", name: "description", label: "Description" }]}
        />

        {/* Designation Edit Dialog */}
        <EditDialog
          open={!!editingDesignation}
          title="Edit Designation"
          description="Update designation details"
          entity={editingDesignation}
          setEntity={setEditingDesignation}
          onSubmit={handleEditDesignation}
          loading={loading}
          fields={[{ type: "text", name: "name", label: "Designation Name *", required: true }, { type: "text", name: "description", label: "Description" }]}
        />
        <EditDialog
          open={!!editingAccessPoint}
          title="Edit Access Point"
          description="Update access point details"
          entity={editingAccessPoint}
          setEntity={setEditingAccessPoint}
          onSubmit={handleEditAccessPoint}
          loading={loading}
          fields={[
            { type: "text", name: "name", label: "Name *", required: true },
            { type: "text", name: "description", label: "Description" },
            { type: "text", name: "location", label: "Location" },
            { type: "checkbox", name: "active", label: "Active" },
          ]}
        />

      </DashboardLayout>
    </RoleGuard>
  )
}
