"use client"

import { useState, useEffect } from "react"
import { RoleGuard } from "@/components/auth/role-guard"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, QrCode, CheckCircle, AlertCircle } from "lucide-react"
import { Html5Qrcode } from "html5-qrcode"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { UserPlus } from "lucide-react"

export default function CheckOutProcessPage() {
  const qrCodeImageUrl = process.env.NEXT_PUBLIC_QR_CODE_IMAGE_URL;
  
  // --- Check-Out Logic ---
  const handleMobileCheckOut = async () => {
    if (!mobileNumber) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`/api/client/visitors/check-mobile?phone=${mobileNumber}`);
      const data = await response.json();
      if (response.ok && data.exists) {
        const apId = defaultAccessPointId || selectedAccessPointId
        if (!apId) { setError("Select an access point"); setLoading(false); return; }
        // Visitor exists, check them out
        const checkOutResponse = await fetch('/api/client/visitors/check-out', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            passId: data.visitor.passId,
            accessPointId: apId,
            accessPointName: getApName(apId),
            method: 'mobile'
          })
        });
        if (checkOutResponse.ok) {
          setSuccess(`Checked out successfully.`);
        } else {
          setError("Already Checked Out.");
        }
      } else {
        setError("Visitor not found for check-out.");
      }
    } catch (err) {
      setError("Failed to check mobile number for check-out. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePassIdCheckOut = async () => {
    if (!passId) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const apId = defaultAccessPointId || selectedAccessPointId
      if (!apId) { setError("Select an access point"); setLoading(false); return; }
      const response = await fetch('/api/client/visitors/check-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passId,
          accessPointId: apId,
          accessPointName: getApName(apId),
          method: 'passId'
        })
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(`Checked out successfully with Pass ID: ${passId}`);
      } else {
        setError(data.error || "Invalid Pass ID for check-out.");
      }
    } catch (err) {
      setError("Failed to check out by Pass ID. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleQrCheckOut = async (decodedText: string) => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const passId = decodedText.replace(/^VISITOR_PASS:/, "");
      const apId = defaultAccessPointId || selectedAccessPointId
      if (!apId) { setError("Select an access point"); setLoading(false); return; }
      const response = await fetch('/api/client/visitors/check-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passId,
          accessPointId: apId,
          accessPointName: getApName(apId),
          method: 'qr'
        })
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(`Checked out successfully with Pass ID: ${passId}`);
      } else {
        setError(data.error || "Invalid QR code / Pass ID for check-out.");
      }
    } catch (err) {
      setError("Failed to check out by QR code. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  const [activeOption, setActiveOption] = useState<string | null>(null)
  const [mobileNumber, setMobileNumber] = useState("")
  const [passId, setPassId] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const [showCreatePassModal, setShowCreatePassModal] = useState(false)
  const [qrData, setQrData] = useState("")
  const [showQrScanner, setShowQrScanner] = useState(false)



 // Access point state
  type AP = { _id: string; name: string; active?: boolean }
  const [accessPoints, setAccessPoints] = useState<AP[]>([])
  const [selectedAccessPointId, setSelectedAccessPointId] = useState<string>("")
  const [defaultAccessPointId, setDefaultAccessPointId] = useState<string | null>(null)
  const [hideAccessPointSelect, setHideAccessPointSelect] = useState<boolean>(false)
  const getApName = (id?: string) => accessPoints.find(ap => ap._id === id)?.name || ""

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]))
        const ap = payload?.defaultAccessPointId || payload?.accessPointId || payload?.apId || null
        if (ap) {
          setDefaultAccessPointId(ap)
          setSelectedAccessPointId(ap)
          setHideAccessPointSelect(true)
        }
      } catch {}
    }
  }, [])

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/client/settings/access-points')
        if (!r.ok) return
        const data = await r.json()
        const active = Array.isArray(data) ? data.filter((a:any)=> a.active !== false) : []
        setAccessPoints(active)
        if (!defaultAccessPointId && active.length && !selectedAccessPointId) {
          setSelectedAccessPointId(active[0]._id)
        }
        if (defaultAccessPointId && !active.some(ap => ap._id === defaultAccessPointId)) {
          setHideAccessPointSelect(false)
        }
      } catch {}
    })()
  }, [defaultAccessPointId, selectedAccessPointId])
  // Create pass form state
  const [createPassForm, setCreatePassForm] = useState({
    name: "",
    visitorType: "",
    comingFrom: "",
    purposeOfVisit: "",
    host: "",
    idType: "",
    visitorIdText: "",
    checkInDate: "",
    checkOutDate: "",
    email: "",
    notes: "",
    photo: null as File | null
  })
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const handleMobileCheck = async () => {
    if (!mobileNumber) return

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch(`/api/client/visitors/check-mobile?phone=${mobileNumber}`)
      const data = await response.json()

      if (response.ok && data.exists) {
        // Visitor exists, show success message for check-out
        setSuccess(`Welcome back, You have been checked out successfully.`)
      } else {
        // Visitor doesn't exist, show create pass option
        setShowCreatePassModal(true)
      }
    } catch (err) {
      setError("Failed to check mobile number. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handlePassIdCheck = async () => {
    if (!passId) return

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch('/api/client/visitors/check-pass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passId })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(`${data.visitor.firstName}  has been checked out successfully with Pass ID: ${passId}`)
      } else {
        setError(data.error || "Invalid Pass ID.")
      }
    } catch (err) {
      setError("Failed to check pass ID. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleQrScan = () => {
    setShowQrScanner(true)
  }

  const startQrScanner = () => {
    const qrRegionId = "qr-reader"
    const html5QrCode = new Html5Qrcode(qrRegionId)

    html5QrCode
      .start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          setQrData(decodedText);
          setShowQrScanner(false);
          html5QrCode.stop();
          await handleQrCheckOut(decodedText);
        },
        () => { }
      )
      .catch((err) => {
        setError("Failed to start camera: " + err);
      });
  }


  const handleCreatePass = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const formData = new FormData()

      // Append all form fields
      formData.append('name', createPassForm.name)
      formData.append('visitorType', createPassForm.visitorType)
      formData.append('comingFrom', createPassForm.comingFrom)
      formData.append('purposeOfVisit', createPassForm.purposeOfVisit)
      formData.append('host', createPassForm.host)
      formData.append('idType', createPassForm.idType)
      formData.append('visitorIdText', createPassForm.visitorIdText)
      formData.append('checkInDate', createPassForm.checkInDate)
      formData.append('checkOutDate', createPassForm.checkOutDate)
      formData.append('email', createPassForm.email)
      formData.append('notes', createPassForm.notes)
      formData.append('phone', mobileNumber)

      // Append photo if exists
      if (createPassForm.photo) {
        formData.append('photo', createPassForm.photo)
      }

      const response = await fetch('/api/client/visitors/create-pass', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(`Pass created successfully for ${createPassForm.name}. Pass ID: ${data.passId}`)
        setShowCreatePassModal(false)
        setCreatePassForm({
          name: "",
          visitorType: "",
          comingFrom: "",
          purposeOfVisit: "",
          host: "",
          idType: "",
          visitorIdText: "",
          checkInDate: "",
          checkOutDate: "",
          email: "",
          notes: "",
          photo: null
        })
        setPhotoPreview(null)
      } else {
        setError(data.error || "Failed to create pass.")
      }
    } catch (err) {
      setError("Failed to create pass. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // const handleQrScan = () => {
  //   // TODO: Implement QR scanning functionality
  //   setError("QR scanning functionality coming soon.")
  // }

  const updateCreatePassForm = (field: string, value: string) => {
    setCreatePassForm(prev => ({ ...prev, [field]: value }))
  }
  useEffect(() => {
    if (showQrScanner) {
      const timer = setTimeout(() => {
        const element = document.getElementById("qr-reader")
        if (element) {
          startQrScanner()
        }
      }, 300) // wait a bit for modal to mount

      return () => clearTimeout(timer)
    }
  }, [showQrScanner])


  return (
    <RoleGuard allowedRoles={["client-admin", "client-user"]}>
      <DashboardLayout title="Client Portal" showHeaderNav={true}>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button asChild variant="outline" className="bg-transparent text-foreground1">
              <a href="/client-dashboard/check-in">
                <ArrowLeft className="h-4 w-4 mr-2 text-foreground1" />
                Back to Check-In/Out
              </a>
            </Button>
            <div className="absolute left-1/2 transform -translate-x-1/2 text-center">
              <h1 className="text-3xl font-bold text-foreground1">Check-Out Process</h1>
              <p className="text-muted-foreground font-semibold">Choose your preferred check-out method</p>
            </div>
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

          <Card className="max-w-md mx-auto">
            <CardHeader className="flex flex-col items-center justify-center text-center gap-2">
              {/* QR Code Image Field - now clickable */}
              <button
                type="button"
                onClick={handleQrScan}
                className="focus:outline-none"
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                aria-label="Open camera to scan QR code"
              >
                <img
                  src={qrCodeImageUrl}
                  alt="QR Code"
                  className="w-32 h-32 object-contain mx-auto hover:scale-105 transition-transform"
                  style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', background: '#fff' }}
                />
              </button>
              <span className="text-xs text-muted-foreground mt-2">Click this QR code for quick check-out</span>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Mobile Number */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <Input
                    id="mobile"
                    type="tel"
                    placeholder="Enter mobile number"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                <Label htmlFor="passId">Pass ID</Label>
                <Input
                  id="passId"
                  placeholder="Enter pass ID"
                  value={passId}
                  onChange={(e) => setPassId(e.target.value)}
                />
              </div>
              </div>
              {/* Access Point */}
              {!hideAccessPointSelect ? (
                <div className="space-y-2">
                  <Label htmlFor="ap">Access Point</Label>
                  <Select value={selectedAccessPointId} onValueChange={setSelectedAccessPointId}>
                    <SelectTrigger id="ap">
                      <SelectValue placeholder="Select access point" />
                    </SelectTrigger>
                    <SelectContent>
                      {accessPoints.map(ap => (
                        <SelectItem key={ap._id} value={ap._id}>{ap.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">
                  Using default access point: {getApName(selectedAccessPointId) || "Default"}
                </div>
              )}

              
              {/* QR Scan */}
              {/* <div className="space-y-2">
                <Label>QR Code</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleQrScan}
                  className="w-full"
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  Open Camera & Scan
                </Button>
              </div> */}
            </CardContent>

            <CardFooter>
              <div className="flex gap-2 w-full">
                <Button
                  className="w-full"
                  disabled={loading || (!mobileNumber && !passId && !qrData)}
                  onClick={() => {
                    if (mobileNumber) {
                      handleMobileCheckOut();
                    } else if (passId) {
                      handlePassIdCheckOut();
                    } else if (qrData) {
                      handleQrCheckOut(qrData);
                    }
                  }}
                >
                  {loading ? "Checking..." : "Check-Out"}
                </Button>
              </div>
            </CardFooter>
          </Card>



          {/* Create Pass Modal */}
          <Dialog open={showCreatePassModal} onOpenChange={setShowCreatePassModal}>
          <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Create Visitor Pass
                </DialogTitle>
                <DialogDescription>
                  Create a new visitor pass for mobile number: {mobileNumber}
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="max-h-[70vh]">
                <form onSubmit={handleCreatePass} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={createPassForm.name}
                      onChange={(e) => updateCreatePassForm("name", e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="visitorType">Visitor Type *</Label>
                      <Select
                        value={createPassForm.visitorType}
                        onValueChange={(value) => updateCreatePassForm("visitorType", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select visitor type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Business Visitor">Business Visitor</SelectItem>
                          <SelectItem value="Contractor">Contractor</SelectItem>
                          <SelectItem value="VIP Guest">VIP Guest</SelectItem>
                          <SelectItem value="Vendor">Vendor</SelectItem>
                          <SelectItem value="Job Candidate">Job Candidate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="comingFrom">Coming From *</Label>
                      <Input
                        id="comingFrom"
                        value={createPassForm.comingFrom}
                        onChange={(e) => updateCreatePassForm("comingFrom", e.target.value)}
                        placeholder="Company/Organization"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="purposeOfVisit">Purpose of Visit *</Label>
                      <Select
                        value={createPassForm.purposeOfVisit}
                        onValueChange={(value) => updateCreatePassForm("purposeOfVisit", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select purpose" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Business Meeting">Business Meeting</SelectItem>
                          <SelectItem value="Interview">Interview</SelectItem>
                          <SelectItem value="Delivery">Delivery</SelectItem>
                          <SelectItem value="Consultation">Consultation</SelectItem>
                          <SelectItem value="Training Session">Training Session</SelectItem>
                          <SelectItem value="Maintenance">Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="host">Host *</Label>
                      <Input
                        id="host"
                        value={createPassForm.host}
                        onChange={(e) => updateCreatePassForm("host", e.target.value)}
                        placeholder="Host name"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="idType">ID Type *</Label>
                      <Select
                        value={createPassForm.idType}
                        onValueChange={(value) => updateCreatePassForm("idType", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select ID type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Driver's License">Driver's License</SelectItem>
                          <SelectItem value="Passport">Passport</SelectItem>
                          <SelectItem value="National ID">National ID</SelectItem>
                          <SelectItem value="Employee Badge">Employee Badge</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="visitorIdText">Visitor ID *</Label>
                      <Input
                        id="visitorIdText"
                        value={createPassForm.visitorIdText}
                        onChange={(e) => updateCreatePassForm("visitorIdText", e.target.value)}
                        placeholder="Enter visitor ID"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="checkInDate">Check-in Date *</Label>
                      <Input
                        id="checkInDate"
                        type="datetime-local"
                        value={createPassForm.checkInDate}
                        onChange={(e) => updateCreatePassForm("checkInDate", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="checkOutDate">Check-out Date</Label>
                      <Input
                        id="checkOutDate"
                        type="datetime-local"
                        value={createPassForm.checkOutDate}
                        onChange={(e) => updateCreatePassForm("checkOutDate", e.target.value)}
                        placeholder="Auto-set to 8 hours from check-in"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email (Optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={createPassForm.email}
                      onChange={(e) => updateCreatePassForm("email", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={createPassForm.notes}
                      onChange={(e) => updateCreatePassForm("notes", e.target.value)}
                      placeholder="Any special requirements or notes..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="photo">Photo</Label>
                    <Input
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null
                        setCreatePassForm(prev => ({ ...prev, photo: file }))
                        if (file) {
                          const reader = new FileReader()
                          reader.onload = (e) => setPhotoPreview(e.target?.result as string)
                          reader.readAsDataURL(file)
                        } else {
                          setPhotoPreview(null)
                        }
                      }}
                    />
                    {photoPreview && (
                      <div className="mt-2">
                        <img src={photoPreview} alt="Preview" className="w-20 h-20 object-cover rounded" />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 justify-end">
                    <Button type="button" variant="outline" onClick={() => setShowCreatePassModal(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? "Creating..." : "Create Pass & Check In"}
                    </Button>
                  </div>
                </form>
              </ScrollArea>
            </DialogContent>
          </Dialog>

          {/* QR Scanner Modal */}
          <Dialog open={showQrScanner} onOpenChange={setShowQrScanner}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Scan QR Code</DialogTitle>
                <DialogDescription>
                  Point your camera at the visitor’s QR code.
                </DialogDescription>
              </DialogHeader>

              <div id="qr-reader" className="w-full h-64 border rounded" />

              <div className="flex justify-end mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowQrScanner(false)}
                >
                  Cancel
                </Button>
              </div>
            </DialogContent>
          </Dialog>

        </div>
      </DashboardLayout>
    </RoleGuard>
  )
}
