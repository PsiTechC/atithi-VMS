// "use client"

// import type React from "react"

// import { useState, useEffect, useRef } from "react"

// import { RoleGuard } from "@/components/auth/role-guard"
// import { DashboardLayout } from "@/components/layout/dashboard-layout"
// import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Textarea } from "@/components/ui/textarea"
// import { Alert, AlertDescription } from "@/components/ui/alert"
// import { ArrowLeft, CheckCircle, AlertCircle, UserPlus, Camera } from "lucide-react"
// import { Html5Qrcode } from "html5-qrcode"
// export default function CheckInProcessPage() {
//   // Store defaultCheckoutHour from backend
//   const [defaultCheckoutHour, setDefaultCheckoutHour] = useState<number>(12)

//   // Fetch defaultCheckoutHour from backend

// useEffect(() => {
//   async function fetchDefaultCheckoutHour() {
//     try {
//       const res = await fetch("/api/client/settings/security");
//       if (!res.ok) return;
//       const json = await res.json();

//       // Handles: number | string | {$numberInt: "12"}
//       const raw = json?.defaultCheckoutHour;
//       const coerced =
//         typeof raw === "object" && raw && "$numberInt" in raw
//           ? Number((raw as any).$numberInt)
//           : Number(raw);

//       if (Number.isFinite(coerced) && coerced > 0) {
//         setDefaultCheckoutHour(Math.floor(coerced)); // ensure integer hours
//       }
//     } catch {
//       /* keep default 12 on error */
//     }
//   }
//   fetchDefaultCheckoutHour();
// }, []);


//   // Get QR code image URL from environment variable
//   const qrCodeImageUrl = process.env.NEXT_PUBLIC_QR_CODE_IMAGE_URL
//   // Dropdown data state
//   const [visitorTypes, setVisitorTypes] = useState<string[]>([])
//   const [purposes, setPurposes] = useState<string[]>([])
//   const [idTypes, setIdTypes] = useState<string[]>([])
//   const [hosts, setHosts] = useState<any[]>([])
//   const [selectedHost, setSelectedHost] = useState<any | null>(null)

//   // Access point state
//   type AP = { _id: string; name: string; active?: boolean }
//   const [accessPoints, setAccessPoints] = useState<AP[]>([])
//   const [selectedAccessPointId, setSelectedAccessPointId] = useState<string>("")
//   const [defaultAccessPointId, setDefaultAccessPointId] = useState<string | null>(null)
//   const [hideAccessPointSelect, setHideAccessPointSelect] = useState<boolean>(false)
//   const getApName = (id?: string) => accessPoints.find((ap) => ap._id === id)?.name || ""

//   // Fetch dropdown data for active client
//   useEffect(() => {
//     async function fetchDropdowns() {
//       try {
//         const [vtRes, pRes, idtRes, hRes] = await Promise.all([
//           fetch("/api/client/settings/visitor-types"),
//           fetch("/api/client/settings/purposes"),
//           fetch("/api/client/settings/id-types"),
//           fetch("/api/client/settings/hosts"),
//         ])
//         const [vtData, pData, idtData, hData] = await Promise.all([
//           vtRes.json(),
//           pRes.json(),
//           idtRes.json(),
//           hRes.json(),
//         ])
//         setVisitorTypes(Array.isArray(vtData) ? vtData.map((v) => v.name) : [])
//         setPurposes(Array.isArray(pData) ? pData.map((p) => p.name) : [])
//   setIdTypes(Array.isArray(idtData) ? idtData.map((i) => i.name) : [])
//   // keep full host objects so we can use IDs and approval flags
//   setHosts(Array.isArray(hData) ? hData : [])
//       } catch {
//         // fallback: leave dropdowns empty
//       }
//     }
//     fetchDropdowns()
//   }, [])

//   // discover default AP from JWT (same token you already read elsewhere)
//   useEffect(() => {
//     const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
//     if (token) {
//       try {
//         const payload = JSON.parse(atob(token.split(".")[1]))
//         // support multiple possible claim names
//         const ap = payload?.defaultAccessPointId || payload?.accessPointId || payload?.apId || null
//         if (ap) {
//           setDefaultAccessPointId(ap)
//           setSelectedAccessPointId(ap)
//           setHideAccessPointSelect(true)
//         }
//       } catch {
//         /* ignore */
//       }
//     }
//   }, [])

//   // fetch access points; ensure selector visibility is correct
//   useEffect(() => {
//     ; (async () => {
//       try {
//         const r = await fetch("/api/client/settings/access-points")
//         if (!r.ok) return
//         const data = await r.json()
//         const active = Array.isArray(data) ? data.filter((a: any) => a.active !== false) : []
//         setAccessPoints(active)
//         // if no default AP, preselect first active (still show selector)
//         if (!defaultAccessPointId && active.length && !selectedAccessPointId) {
//           setSelectedAccessPointId(active[0]._id)
//         }
//         // if default AP is missing (deleted/inactive), force selector
//         if (defaultAccessPointId && !active.some((ap) => ap._id === defaultAccessPointId)) {
//           setHideAccessPointSelect(false)
//         }
//       } catch {
//         /* ignore */
//       }
//     })()
//   }, [defaultAccessPointId, selectedAccessPointId])

//   const [activeOption, setActiveOption] = useState<string | null>(null)
//   const [mobileNumber, setMobileNumber] = useState("")
//   const [passId, setPassId] = useState("")
//   const [loading, setLoading] = useState(false)
//   const [success, setSuccess] = useState("")
//   const [error, setError] = useState("")
//   const [showCreatePassModal, setShowCreatePassModal] = useState(false)
//   const [existingVisitor, setExistingVisitor] = useState(false)
//   const [lastPass, setLastPass] = useState<any | null>(null)
//   const [lastPassLoading, setLastPassLoading] = useState(false)
//   const [qrData, setQrData] = useState("")
//   const [showQrScanner, setShowQrScanner] = useState(false)

//   // Format Date -> 'YYYY-MM-DDTHH:mm' for <input type="datetime-local" />
//   const toDatetimeLocal = (d: Date) => {
//     const pad = (n: number) => String(n).padStart(2, "0")
//     return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
//   }

//   // Create pass form state
//   const [createPassForm, setCreatePassForm] = useState({
//     name: "",
//     visitorType: "",
//     comingFrom: "",
//     purposeOfVisit: "",
//     host: "",
//     idType: "",
//     visitorIdText: "",
//     checkInDate: "",
//     checkoutDateLimit: "", // new field for expectedCheckoutTime
//     email: "",
//     notes: "",
//     photo: null as File | null,
//   })

//   // Prefill CreatePass modal fields from a previous pass
//   const prefillFromPreviousPass = (pass: any) => {
//     updateCreatePassForm("name", pass.name || "")
//     updateCreatePassForm("visitorType", pass.visitorType || "")
//     updateCreatePassForm("comingFrom", pass.comingFrom || pass.company || "")
//     updateCreatePassForm("purposeOfVisit", pass.purposeOfVisit || "")
//     updateCreatePassForm("host", pass.host || "")
//     updateCreatePassForm("idType", pass.idType || "")
//     updateCreatePassForm("visitorIdText", pass.visitorIdText || pass.visitorId || "")
//     updateCreatePassForm("email", pass.email || "")
//     updateCreatePassForm("notes", pass.notes || "")
//     // New pass should have a fresh check-in time defaulted to "now"
//     const now = new Date()
//     updateCreatePassForm("checkInDate", toDatetimeLocal(now))
//     // Default: backend-configured hours after check-in
//     const expectedCheckout = new Date(now.getTime() + defaultCheckoutHour * 60 * 60 * 1000)
//     updateCreatePassForm("checkoutDateLimit", toDatetimeLocal(expectedCheckout))
//   }

//   const [photoPreview, setPhotoPreview] = useState<string | null>(null)
//   const [showCameraModal, setShowCameraModal] = useState(false)
//   const videoRef = useRef<HTMLVideoElement | null>(null)
//   const canvasRef = useRef<HTMLCanvasElement | null>(null)
//   const [cameraError, setCameraError] = useState("")
//   const [stream, setStream] = useState<MediaStream | null>(null)

//   useEffect(() => {
//     async function fetchAccessPoints() {
//       try {
//         const res = await fetch("/api/client/settings/access-points")
//         if (res.ok) setAccessPoints(await res.json())
//       } catch { }
//     }
//     fetchAccessPoints()
//   }, [])

//   const handleMobileCheck = async () => {
//     if (!mobileNumber) return

//     setLoading(true)
//     setError("")
//     setSuccess("")

//     try {
//       const response = await fetch(`/api/client/visitors/check-mobile?phone=${mobileNumber}`)
//       const data = await response.json()

//       if (response.ok && data.exists) {
//         const apId = defaultAccessPointId || selectedAccessPointId
//         if (!apId) {
//           setError("Select an access point")
//           setLoading(false)
//           return
//         }
//         setExistingVisitor(true)
//         // Visitor exists, check them in
//         const checkInResponse = await fetch("/api/client/visitors/check-pass", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             passId: data.visitor.passId,
//             accessPointId: apId,
//             accessPointName: getApName(apId),
//             method: "mobile",
//           }),
//         })

//         const passResult = await checkInResponse.json()

//         if (checkInResponse.ok) {
//           setSuccess("Welcome back! You have been checked in successfully.")
//         } else {
//           const isExpired = passResult.expired || (passResult.error && /expired/i.test(passResult.error))
//           if (isExpired) {
//             // Use lastPass if provided by check-mobile API. If not present,
//             // open the create modal immediately and lazily fetch last pass
//             // via our lightweight endpoint (/api/visitor-pass/last-by-phone).
//             let prev = data.visitor?.lastPass || null
//             setShowCreatePassModal(true)

//             if (prev) {
//               setLastPass(prev)
//               prefillFromPreviousPass(prev)
//             } else {
//               // show minimal defaults so modal appears instantly
//               const now = new Date()
//               updateCreatePassForm("checkInDate", toDatetimeLocal(now))
//               const expectedCheckout = new Date(now.getTime() + defaultCheckoutHour * 60 * 60 * 1000)
//               updateCreatePassForm("checkoutDateLimit", toDatetimeLocal(expectedCheckout))
//               // lazy fetch the last pass and fill when available
//               ;(async () => {
//                 try {
//                   setLastPassLoading(true)
//                   const res = await fetch(`/api/visitor-pass/last-by-phone?phone=${encodeURIComponent(mobileNumber)}`)
//                   if (!res.ok) return
//                   const json = await res.json()
//                   const fetched = json?.lastPass || null
//                   if (fetched) {
//                     setLastPass(fetched)
//                     prefillFromPreviousPass(fetched)
//                   }
//                 } catch (e) {
//                   // silently ignore — user can still create a new pass
//                   console.error('lazy fetch lastPass failed', e)
//                 } finally {
//                   setLastPassLoading(false)
//                 }
//               })()
//             }

//             setError("Your previous pass has expired. Please create a new one.")
//           } else {
//             setError(passResult.error || "Failed to check in visitor.")
//           }
//         }
//       } else {
//         // First time visitor: open Create Pass and default check-in to now
//         setExistingVisitor(false)
//         const now = new Date()
//         updateCreatePassForm("checkInDate", toDatetimeLocal(now))
//         // Default: backend-configured hours after check-in
//         const expectedCheckout = new Date(now.getTime() + defaultCheckoutHour * 60 * 60 * 1000)
//         updateCreatePassForm("checkoutDateLimit", toDatetimeLocal(expectedCheckout))
//         setShowCreatePassModal(true)
//       }
//     } catch (err) {
//       setError("Failed to check mobile number. Please try again.")
//     } finally {
//       setLoading(false)
//     }
//   }

//   const handlePassIdCheck = async () => {
//     if (!passId) return

//     setLoading(true)
//     setError("")
//     setSuccess("")

//     try {
//       const apId = defaultAccessPointId || selectedAccessPointId
//       if (!apId) {
//         setError("Select an access point")
//         setLoading(false)
//         return
//       }
//       const response = await fetch("/api/client/visitors/check-pass", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           passId,
//           accessPointId: apId,
//           accessPointName: getApName(apId),
//           method: "passId",
//         }),
//       })

//       const data = await response.json()

//       if (response.ok) {
//         setSuccess(`You have been checked in successfully with Pass ID: ${passId}`)
//       } else {
//         setError(data.error || "Invalid Pass ID.")
//       }
//     } catch (err) {
//       setError("Failed to check pass ID. Please try again.")
//     } finally {
//       setLoading(false)
//     }
//   }

//   const handleQrScan = () => {
//     setShowQrScanner(true)
//   }

//   const startQrScanner = () => {
//     const qrRegionId = "qr-reader"
//     const html5QrCode = new Html5Qrcode(qrRegionId)

//     html5QrCode
//       .start(
//         { facingMode: "environment" },
//         {
//           fps: 10,
//           qrbox: { width: 250, height: 250 },
//         },
//         async (decodedText) => {
//           setQrData(decodedText)
//           setShowQrScanner(false)
//           html5QrCode.stop()
//           // Check pass by passId (decodedText)
//           setLoading(true)
//           setError("")
//           setSuccess("")
//           try {
//             const apId = defaultAccessPointId || selectedAccessPointId
//             if (!apId) {
//               setError("Select an access point")
//               setLoading(false)
//               return
//             }
//             const response = await fetch("/api/client/visitors/check-pass", {
//               method: "POST",
//               headers: { "Content-Type": "application/json" },
//               body: JSON.stringify({
//                 passId: decodedText.replace(/^VISITOR_PASS:/, ""),
//                 accessPointId: apId,
//                 accessPointName: getApName(apId),
//                 method: "qr",
//               }),
//             })
//             const data = await response.json()
//             if (response.ok) {
//               setSuccess(`Checked in successfully with Pass ID: ${decodedText}`)
//             } else {
//               setError(data.error || "Invalid QR code / Pass ID.")
//             }
//           } catch (err) {
//             setError("Failed to check QR code. Please try again.")
//           } finally {
//             setLoading(false)
//           }
//         },
//         () => { },
//       )
//       .catch((err) => {
//         setError("Failed to start camera: " + err)
//       })
//   }

//   const handleCreatePass = async (e: React.FormEvent) => {
//     e.preventDefault()
//     setLoading(true)
//     setError("")
//     setSuccess("")

//     try {
//       const formData = new FormData()
//       // ...existing code...
//       formData.append("name", createPassForm.name)
//       formData.append("visitorType", createPassForm.visitorType)
//       formData.append("comingFrom", createPassForm.comingFrom)
//       formData.append("purposeOfVisit", createPassForm.purposeOfVisit)
//       // Determine hostId to send: prefer selectedHost, but fall back to createPassForm.host
//       // if it already contains an ObjectId string. This avoids a race where the host
//       // details fetch hasn't completed before form submit.
//       const hostIdToSend = selectedHost && selectedHost._id ? String(selectedHost._id) : (createPassForm.host && /^[0-9a-fA-F]{24}$/.test(String(createPassForm.host)) ? String(createPassForm.host) : null)
//       if (hostIdToSend) {
//         formData.append("hostId", hostIdToSend)
//         // include host name when available
//         formData.append("host", selectedHost?.name || createPassForm.host || "")
//       } else {
//         formData.append("host", createPassForm.host)
//       }
//       formData.append("idType", createPassForm.idType)
//       formData.append("visitorIdText", createPassForm.visitorIdText)
//       // Convert datetime-local inputs to ISO (UTC) to avoid server/client timezone parsing differences
//       formData.append(
//         "checkInDate",
//         createPassForm.checkInDate ? new Date(createPassForm.checkInDate).toISOString() : "",
//       )

//       // Map checkoutDateLimit (datetime-local) to expectedCheckOutTime as ISO
//       const expectedIso = createPassForm.checkoutDateLimit
//         ? new Date(createPassForm.checkoutDateLimit).toISOString()
//         : createPassForm.checkInDate
//         ? new Date(new Date(createPassForm.checkInDate).getTime() + defaultCheckoutHour * 60 * 60 * 1000).toISOString()
//         : ""

//       formData.append("expectedCheckOutTime", expectedIso)
//       formData.append("email", createPassForm.email)
//       formData.append("notes", createPassForm.notes)
//       formData.append("phone", mobileNumber)
//       if (createPassForm.photo) {
//         formData.append("photo", createPassForm.photo)
//       }
//       const response = await fetch("/api/client/visitors/create-pass", {
//         method: "POST",
//         body: formData,
//       })
//       const data = await response.json()

//       if (response.ok && data.passId) {
//   const apId = defaultAccessPointId || selectedAccessPointId
//   // 🟩 Case 1 / Case 2 logic: Auto check-in only if host approval is NOT required
//   const requiresApproval = Boolean(selectedHost?.approvalRequired);

//         if (createPassForm.photo && apId && !requiresApproval) {
//           try {
//             const ciRes = await fetch("/api/client/visitors/check-pass", {
//               method: "POST",
//               headers: { "Content-Type": "application/json" },
//               body: JSON.stringify({
//                 passId: data.passId,
//                 accessPointId: apId,
//                 accessPointName: getApName(apId),
//                 method: "create_with_photo",
//               }),
//             });
//             const ciData = await ciRes.json();
//             if (ciRes.ok) {
//               setSuccess(
//                 `Pass created and checked in for ${createPassForm.name}. Pass ID: ${data.passId}`
//               );
//             } else {
//               setSuccess(
//                 `Pass created for ${createPassForm.name}, but auto check-in failed: ${
//                   ciData.error || "Unknown error"
//                 }`
//               );
//             }
//           } catch {
//             setSuccess(
//               `Pass created for ${createPassForm.name}, but auto check-in failed due to network error.`
//             );
//           }
//         } else {
//           // 🟨 If host approval required → show waiting message
//           if (requiresApproval) {
//             setSuccess(
//               `Pass created for ${createPassForm.name}. Waiting for host approval.`
//             );
//           } else {
//             setSuccess(
//               `Pass created successfully for ${createPassForm.name}. Pass ID: ${data.passId}`
//             );
//           }
//         }
//         setShowCreatePassModal(false)
//         setCreatePassForm({
//           name: "",
//           visitorType: "",
//           comingFrom: "",
//           purposeOfVisit: "",
//           host: "",
//           idType: "",
//           visitorIdText: "",
//           checkInDate: "",
//           checkoutDateLimit: "",
//           email: "",
//           notes: "",
//           photo: null,
//         })
//         setSelectedHost(null)
//         setPhotoPreview(null)
//       } else {
//         setError(data.error || "Failed to create pass.")
//       }
//     } catch (err) {
//       setError("Failed to create pass. Please try again.")
//     } finally {
//       setLoading(false)
//     }
//   }

//   // const handleQrScan = () => {
//   //   // TODO: Implement QR scanning functionality
//   //   setError("QR scanning functionality coming soon.")
//   // }

//   const updateCreatePassForm = (field: string, value: string | File | null) => {
//     setCreatePassForm((prev) => ({ ...prev, [field]: value }))
//   }

//   // When a host is selected, fetch the host details (including approvalRequired)
//   const handleHostSelect = async (hostId: string) => {
//     updateCreatePassForm("host", hostId)
//     if (!hostId) {
//       setSelectedHost(null)
//       return
//     }
//     try {
//       const res = await fetch(`/api/client/settings/hosts/${hostId}`)
//       if (!res.ok) {
//         setSelectedHost(null)
//         return
//       }
//       const json = await res.json()
//       setSelectedHost(json)
//       // If host requires approval, we may want to mark something in the form; hostId already set
//     } catch (e) {
//       console.error('Failed to fetch host details', e)
//       setSelectedHost(null)
//     }
//   }
//   useEffect(() => {
//     if (showQrScanner) {
//       const timer = setTimeout(() => {
//         const element = document.getElementById("qr-reader")
//         if (element) {
//           startQrScanner()
//         }
//       }, 300)
//       return () => clearTimeout(timer)
//     }
//   }, [showQrScanner])

//   useEffect(() => {
//     if (showCameraModal) {
//       setCameraError("")
//       navigator.mediaDevices
//         .getUserMedia({ video: true })
//         .then((mediaStream) => {
//           setStream(mediaStream)
//           if (videoRef.current) {
//             videoRef.current.srcObject = mediaStream
//             videoRef.current.play()
//           }
//         })
//         .catch((err) => {
//           setCameraError("Unable to access camera: " + err.message)
//         })
//     } else {
//       if (stream) {
//         stream.getTracks().forEach((track) => track.stop())
//         setStream(null)
//       }
//     }
//     // Cleanup on unmount
//     return () => {
//       if (stream) {
//         stream.getTracks().forEach((track) => track.stop())
//       }
//     }
//   }, [showCameraModal])

//   return (
//     <RoleGuard allowedRoles={["client-admin", "client-user"]}>
//       <DashboardLayout title="Client Portal" showHeaderNav={true}>
//         <div className="space-y-6">
//           <div className="flex items-center gap-4">
//             <Button asChild variant="outline" className="bg-transparent text-foreground1">
//               <a href="/client-dashboard/check-in">
//                 <ArrowLeft className="h-4 w-4 mr-2 text-foreground1" />
//                 Back to Check-In/Out
//               </a>
//             </Button>
//             <div className="absolute left-1/2 transform -translate-x-1/2 text-center">
//               <h1 className="text-3xl font-bold text-foreground1">Check-In Process</h1>
//               <p className="text-muted-foreground font-semibold">Choose your preferred check-in method</p>
//             </div>
//           </div>

//           {success && (
//             <Alert className="border-green-200 bg-green-50">
//               <CheckCircle className="h-4 w-4 text-green-600" />
//               <AlertDescription className="text-green-800">{success}</AlertDescription>
//             </Alert>
//           )}

//           {error && (
//             <Alert variant="destructive">
//               <AlertCircle className="h-4 w-4" />
//               <AlertDescription>{error}</AlertDescription>
//             </Alert>
//           )}
//           <Card className="max-w-md mx-auto">
//             <CardHeader className="flex flex-col items-center justify-center text-center gap-2">
//               {/* QR Code Image Field - now clickable */}
//               <button
//                 type="button"
//                 onClick={handleQrScan}
//                 className="focus:outline-none"
//                 style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
//                 aria-label="Open camera to scan QR code"
//               >
//                 <img
//                   src={qrCodeImageUrl || "/placeholder.svg"}
//                   alt="QR Code"
//                   className="w-32 h-32 object-contain mx-auto hover:scale-105 transition-transform"
//                   style={{ border: "1px solid #e5e7eb", borderRadius: "0.5rem", background: "#fff" }}
//                 />
//               </button>
//               <span className="text-xs text-muted-foreground mt-2">Click this QR code for quick check-in</span>
//             </CardHeader>

//             <CardContent className="space-y-4">
//               {/* Mobile Number */}
//               <div className="grid gap-4 md:grid-cols-2">
//                 <div className="space-y-2">
//                   <Label htmlFor="mobile">Mobile Number</Label>
//                   <Input
//                     id="mobile"
//                     type="tel"
//                     placeholder="Enter mobile number"
//                     value={mobileNumber}
//                     onChange={(e) => setMobileNumber(e.target.value)}
//                   />
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="passId">Pass ID</Label>
//                   <Input
//                     id="passId"
//                     placeholder="Enter pass ID"
//                     value={passId}
//                     onChange={(e) => setPassId(e.target.value)}
//                   />
//                 </div>
//               </div>

//               {/* Access Point */}
//               {!hideAccessPointSelect ? (
//                 <div className="space-y-2">
//                   <Label htmlFor="ap">Access Point *</Label>
//                   <Select value={selectedAccessPointId} onValueChange={setSelectedAccessPointId}>
//                     <SelectTrigger id="ap">
//                       <SelectValue placeholder="Select access point" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {accessPoints.map((ap) => (
//                         <SelectItem key={ap._id} value={ap._id}>
//                           {ap.name}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>
//               ) : (
//                 <div className="text-xs text-muted-foreground">
//                   Using default access point: {getApName(selectedAccessPointId) || "Default"}
//                 </div>
//               )}

//             </CardContent>

//             <CardFooter>
//               <Button
//                 className="w-full"
//                 disabled={loading || (!mobileNumber && !passId && !qrData)}
//                 onClick={() => {
//                   if (mobileNumber) {
//                     handleMobileCheck()
//                   } else if (passId) {
//                     handlePassIdCheck()
//                   } else if (qrData) {
//                     handleQrScan()
//                   }
//                 }}
//               >
//                 {loading ? "Checking..." : "Submit"}
//               </Button>
//             </CardFooter>
//           </Card>

//           {/* Create Pass Modal */}

//           <Dialog open={showCreatePassModal} onOpenChange={setShowCreatePassModal}>
//             <DialogContent
//               className="w-screen h-screen max-w-none max-h-none p-0 rounded-none shadow-none
//                bg-gradient-to-br from-slate-50 via-white to-blue-50/30 border-0
//                overflow-y-auto"
//                style={{
//       width: "100vw",
//       height: "100vh",
//       maxWidth: "100vw",
//       maxHeight: "100vh",
//       margin: "0 auto",
//     }}
//             >
//               <div className="w-full max-w-full md:max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 bg-white/80 backdrop-blur-sm rounded-none sm:rounded-2xl lg:rounded-3xl shadow-2xl border border-white/20 sm:m-4 lg:m-8">
//                 <form onSubmit={handleCreatePass} className="space-y-6 sm:space-y-8">
//                   <div className="text-center space-y-2 sm:space-y-4 pb-4 sm:pb-6 lg:pb-8 border-b border-gray-100">
//                     <DialogHeader>
//                       <DialogTitle className="flex items-center justify-center gap-2 sm:gap-3 text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">
//                           <UserPlus className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-blue-600" />
//                         Create Visitor Pass
//                       </DialogTitle>
//                       <DialogDescription className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed px-2">
//                         Create a new visitor pass for mobile number:{" "}
//                         <span className="font-semibold text-blue-600">{mobileNumber}</span>
//                         <br />
//                         <span className="text-xs sm:text-sm text-emerald-600 bg-emerald-50 px-2 sm:px-3 py-1 rounded-full inline-block mt-2">
//                           💡 Tip: If you capture a photo, we'll check the visitor in automatically after creating the
//                           pass.
//                         </span>
//                       </DialogDescription>
//                       {lastPassLoading && !lastPass ? (
//                         <div className="text-center mt-2 sm:mt-3 text-xs sm:text-sm text-gray-500">Loading previous pass…</div>
//                       ) : null}
//                     </DialogHeader>
//                   </div>
//                   {/* Main Layout: Form + Photo Sidebar */}
//                   {/* For desktop (xl+): 6 column grid - 5 columns for fields, 6th column for photo */}
//                   {/* For tablet/mobile (md and below): Flex layout with photo sidebar */}
//                   <div className="flex flex-col md:flex-row xl:block gap-4 sm:gap-5 lg:gap-6 w-full md:justify-center md:items-start mx-auto">

//                     {/* Desktop: 6 column grid (5 for fields + 1 for photo) | Mobile/Tablet: 2 column grid */}
//                     <div className="w-full md:flex-1 md:max-w-2xl lg:max-w-3xl xl:max-w-full grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4 sm:gap-5 lg:gap-6">
//                     {/* Name */}
//                     <div className="space-y-1.5 sm:space-y-2 group">
//                       <Label
//                         htmlFor="name"
//                         className="text-xs sm:text-sm font-semibold text-gray-700 group-focus-within:text-blue-600 transition-colors"
//                       >
//                         Name <span className="text-red-500">*</span>
//                       </Label>
//                       <Input
//                         id="name"
//                         value={createPassForm.name}
//                         onChange={(e) => updateCreatePassForm("name", e.target.value)}
//                         placeholder="Enter full name"
//                         required
//                         className="h-9 sm:h-10 text-sm sm:text-base text-gray-800 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg sm:rounded-xl transition-all duration-200 bg-white/70 backdrop-blur-sm"
//                       />
//                     </div>

//                     {/* Visitor Type */}
//                     <div className="space-y-1.5 sm:space-y-2 group">
//                       <Label
//                         htmlFor="visitorType-select"
//                         className="text-xs sm:text-sm font-semibold text-gray-700 group-focus-within:text-blue-600 transition-colors"
//                       >
//                         Visitor Type <span className="text-red-500">*</span>
//                       </Label>
//                       <Select
//                         value={createPassForm.visitorType}
//                         onValueChange={(value) => updateCreatePassForm("visitorType", value)}
//                       >
//                         <SelectTrigger
//                           id="visitorType-select"
//                           className="h-9 sm:h-10 border-2 w-full border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg sm:rounded-xl bg-white/70 backdrop-blur-sm text-sm sm:text-base"
//                         >
//                           <SelectValue placeholder="Select visitor type" />
//                         </SelectTrigger>
//                         <SelectContent className="rounded-lg sm:rounded-xl border-2 border-gray-100 shadow-xl">
//                           {visitorTypes.map((type) => (
//                             <SelectItem key={type} value={type} className="rounded-lg hover:bg-blue-50">
//                               {type}
//                             </SelectItem>
//                           ))}
//                         </SelectContent>
//                       </Select>
//                     </div>

//                     {/* Coming From */}
//                     <div className="space-y-1.5 sm:space-y-2 group">
//                       <Label
//                         htmlFor="comingFrom"
//                         className="text-xs sm:text-sm font-semibold text-gray-700 group-focus-within:text-blue-600 transition-colors"
//                       >
//                         Coming From <span className="text-red-500">*</span>
//                       </Label>
//                       <Input
//                         id="comingFrom"
//                         value={createPassForm.comingFrom}
//                         onChange={(e) => updateCreatePassForm("comingFrom", e.target.value)}
//                         placeholder="Company or organization"
//                         required
//                         className="h-9 sm:h-10 text-sm sm:text-base text-gray-800 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg sm:rounded-xl transition-all duration-200 bg-white/70 backdrop-blur-sm"
//                       />
//                     </div>

//                     {/* Purpose of Visit */}
//                     <div className="space-y-1.5 sm:space-y-2 group">
//                       <Label
//                         htmlFor="purposeOfVisit-select"
//                         className="text-xs sm:text-sm font-semibold text-gray-700 group-focus-within:text-blue-600 transition-colors"
//                       >
//                         Purpose of Visit <span className="text-red-500">*</span>
//                       </Label>
//                       <Select
//                         value={createPassForm.purposeOfVisit}
//                         onValueChange={(value) => updateCreatePassForm("purposeOfVisit", value)}
//                       >
//                         <SelectTrigger
//                           id="purposeOfVisit-select"
//                           className="h-9 sm:h-10 border-2 w-full border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg sm:rounded-xl bg-white/70 backdrop-blur-sm text-sm sm:text-base"
//                         >
//                           <SelectValue placeholder="Select purpose" />
//                         </SelectTrigger>
//                         <SelectContent className="rounded-lg sm:rounded-xl border-2 border-gray-100 shadow-xl">
//                           {purposes.map((purpose) => (
//                             <SelectItem key={purpose} value={purpose} className="rounded-lg hover:bg-blue-50">
//                               {purpose}
//                             </SelectItem>
//                           ))}
//                         </SelectContent>
//                       </Select>
//                     </div>

//                     {/* Host */}
//                     <div className="space-y-1.5 sm:space-y-2 group">
//                       <Label
//                         htmlFor="host-select"
//                         className="text-xs sm:text-sm font-semibold text-gray-700 group-focus-within:text-blue-600 transition-colors"
//                       >
//                         Host <span className="text-red-500">*</span>
//                       </Label>
//                       <Select value={createPassForm.host} onValueChange={(value) => handleHostSelect(value)}>
//                         <SelectTrigger
//                           id="host-select"
//                           className="h-9 sm:h-10 border-2 w-full border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg sm:rounded-xl bg-white/70 backdrop-blur-sm text-sm sm:text-base"
//                         >
//                           <SelectValue placeholder="Select host" />
//                         </SelectTrigger>
//                         <SelectContent className="rounded-lg sm:rounded-xl border-2 border-gray-100 shadow-xl">
//                           {hosts.map((host) => (
//                             <SelectItem key={host._id} value={host._id} className="rounded-lg hover:bg-blue-50">
//                               {host.name}
//                             </SelectItem>
//                           ))}
//                         </SelectContent>
//                       </Select>
//                     </div>

//                     {/* Photo Capture - Desktop Only (separate column spanning all rows) */}
//                     <div className="hidden xl:block xl:row-span-3 space-y-3 sm:space-y-4">
//                       <div className="space-y-2">
//                         <Label className="text-xs sm:text-sm font-semibold text-gray-700">Photo Capture</Label>
//                         <Button
//                           type="button"
//                           variant="outline"
//                           onClick={() => setShowCameraModal(true)}
//                           className="w-full h-9 sm:h-10 px-4 sm:px-6 text-sm sm:text-base font-medium bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 hover:border-blue-400 hover:from-blue-100 hover:to-purple-100 rounded-lg sm:rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
//                         >
//                           <Camera className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 text-blue-600" />
//                           <span className="text-gray-700">Take Photo</span>
//                         </Button>
//                       </div>

//                       {photoPreview && (
//                         <div className="relative flex flex-col items-center p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl sm:rounded-2xl border-2 border-gray-100">
//                           <div className="relative">
//                             <img
//                               src={photoPreview || "/placeholder.svg"}
//                               alt="Visitor photo preview"
//                               className="w-full max-w-[200px] h-auto aspect-square object-cover rounded-xl sm:rounded-2xl border-4 border-white shadow-lg"
//                             />
//                             <button
//                               type="button"
//                               onClick={() => {
//                                 setPhotoPreview(null)
//                                 updateCreatePassForm("photo", null)
//                               }}
//                               className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 sm:p-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
//                               aria-label="Remove photo"
//                             >
//                               <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                 <path
//                                   strokeLinecap="round"
//                                   strokeLinejoin="round"
//                                   strokeWidth={2}
//                                   d="M6 18L18 6M6 6l12 12"
//                                 />
//                               </svg>
//                             </button>
//                           </div>
//                           <span className="text-[10px] sm:text-xs text-gray-600 mt-2 font-medium bg-white px-2 py-1 rounded-full">
//                             Photo Preview
//                           </span>
//                         </div>
//                       )}
//                     </div>

//                     {/* ID Type */}
//                     <div className="space-y-1.5 sm:space-y-2 group">
//                       <Label
//                         htmlFor="idType-select"
//                         className="text-xs sm:text-sm font-semibold text-gray-700 group-focus-within:text-blue-600 transition-colors"
//                       >
//                         ID Type <span className="text-red-500">*</span>
//                       </Label>
//                       <Select
//                         value={createPassForm.idType}
//                         onValueChange={(value) => updateCreatePassForm("idType", value)}
//                       >
//                         <SelectTrigger
//                           id="idType-select"
//                           className="h-9 sm:h-10 border-2 w-full border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg sm:rounded-xl bg-white/70 backdrop-blur-sm text-sm sm:text-base"
//                         >
//                           <SelectValue placeholder="Select ID type" />
//                         </SelectTrigger>
//                         <SelectContent className="rounded-lg sm:rounded-xl border-2 border-gray-100 shadow-xl">
//                           {idTypes.map((idType) => (
//                             <SelectItem key={idType} value={idType} className="rounded-lg hover:bg-blue-50">
//                               {idType}
//                             </SelectItem>
//                           ))}
//                         </SelectContent>
//                       </Select>
//                     </div>

//                     {/* Visitor ID */}
//                     <div className="space-y-1.5 sm:space-y-2 group">
//                       <Label
//                         htmlFor="visitorIdText"
//                         className="text-xs sm:text-sm font-semibold text-gray-700 group-focus-within:text-blue-600 transition-colors"
//                       >
//                         Visitor ID <span className="text-red-500">*</span>
//                       </Label>
//                       <Input
//                         id="visitorIdText"
//                         value={createPassForm.visitorIdText}
//                         onChange={(e) => updateCreatePassForm("visitorIdText", e.target.value)}
//                         placeholder="Enter visitor ID number"
//                         required
//                         className="h-9 sm:h-10 text-sm sm:text-base text-gray-800 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg sm:rounded-xl transition-all duration-200 bg-white/70 backdrop-blur-sm"
//                       />
//                     </div>

//                     {/* Email */}
//                     <div className="space-y-1.5 sm:space-y-2 group">
//                       <Label
//                         htmlFor="email"
//                         className="text-xs sm:text-sm font-semibold text-gray-700 group-focus-within:text-blue-600 transition-colors"
//                       >
//                         Email <span className="text-gray-400 text-xs">(Optional)</span>
//                       </Label>
//                       <Input
//                         id="email"
//                         type="email"
//                         value={createPassForm.email}
//                         onChange={(e) => updateCreatePassForm("email", e.target.value)}
//                         placeholder="visitor@example.com"
//                         className="h-9 sm:h-10 text-sm sm:text-base text-gray-800 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg sm:rounded-xl transition-all duration-200 bg-white/70 backdrop-blur-sm"
//                       />
//                     </div>

//                     {/* Check-in Date */}
//                     <div className="space-y-1.5 sm:space-y-2 group">
//                       <Label
//                         htmlFor="checkInDate"
//                         className="text-xs sm:text-sm font-semibold text-gray-700 group-focus-within:text-blue-600 transition-colors"
//                       >
//                         Check-in Date <span className="text-red-500">*</span>
//                       </Label>
//                       <Input
//                         id="checkInDate"
//                         type="datetime-local"
//                         value={createPassForm.checkInDate}
//                         onChange={(e) => updateCreatePassForm("checkInDate", e.target.value)}
//                         required
//                         className="h-9 sm:h-10 text-sm sm:text-base text-gray-800 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg sm:rounded-xl transition-all duration-200 bg-white/70 backdrop-blur-sm"
//                       />
//                     </div>

//                     {/* Check-out Date Limit */}
//                     <div className="space-y-1.5 sm:space-y-2 group">
//                       <Label
//                         htmlFor="checkoutDateLimit"
//                         className="text-xs sm:text-sm font-semibold text-gray-700 group-focus-within:text-blue-600 transition-colors"
//                       >
//                         Check-out Date Limit
//                       </Label>
//                       <Input
//                         id="checkoutDateLimit"
//                         type="datetime-local"
//                         value={createPassForm.checkoutDateLimit}
//                         onChange={(e) => updateCreatePassForm("checkoutDateLimit", e.target.value)}
//                         placeholder="Default: 12 hours after check-in"
//                         className="h-9 sm:h-10 text-sm sm:text-base text-gray-800 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg sm:rounded-xl transition-all duration-200 bg-white/70 backdrop-blur-sm"
//                       />
//                     </div>

//                     {/* Notes - Full width on form grid */}
//                     <div className="space-y-1.5 sm:space-y-2 col-span-full group">
//                       <Label
//                         htmlFor="notes"
//                         className="text-xs sm:text-sm font-semibold text-gray-700 group-focus-within:text-blue-600 transition-colors"
//                       >
//                         Notes <span className="text-gray-400 text-xs">(Optional)</span>
//                       </Label>
//                       <Textarea
//                         id="notes"
//                         value={createPassForm.notes}
//                         onChange={(e) => updateCreatePassForm("notes", e.target.value)}
//                         placeholder="Any special requirements"
//                         rows={2}
//                         className="min-h-[60px] max-h-[100px] border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg sm:rounded-xl text-sm sm:text-base text-gray-800 resize-none transition-all duration-200 bg-white/70 backdrop-blur-sm"
//                       />
//                     </div>

//                     {/* show approval hint when selected host requires approval */}
//                     {selectedHost && selectedHost.approvalRequired ? (
//                       <div className="col-span-full text-xs sm:text-sm text-amber-700 bg-amber-50 p-2 sm:p-3 rounded-lg sm:rounded-xl">
//                         This host requires approval. The visitor will remain pending until the host approves.
//                       </div>
//                     ) : null}
//                     </div>

//                     {/* Right: Photo Capture Sidebar (visible on mobile/tablet only, hidden on desktop xl+) */}
//                     <div className="w-full md:w-64 lg:w-72 xl:hidden space-y-3 sm:space-y-4">
//                       <div className="space-y-2">
//                         <Label className="text-xs sm:text-sm font-semibold text-gray-700">Photo Capture</Label>
//                         <Button
//                           type="button"
//                           variant="outline"
//                           onClick={() => setShowCameraModal(true)}
//                           className="w-full h-9 sm:h-10 px-4 sm:px-6 text-sm sm:text-base font-medium bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 hover:border-blue-400 hover:from-blue-100 hover:to-purple-100 rounded-lg sm:rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
//                         >
//                           <Camera className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 text-blue-600" />
//                           <span className="text-gray-700">Take Photo</span>
//                         </Button>
//                       </div>

//                       {photoPreview && (
//                         <div className="relative flex flex-col items-center p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl sm:rounded-2xl border-2 border-gray-100">
//                           <div className="relative">
//                             <img
//                               src={photoPreview || "/placeholder.svg"}
//                               alt="Visitor photo preview"
//                               className="w-full max-w-[200px] h-auto aspect-square object-cover rounded-xl sm:rounded-2xl border-4 border-white shadow-lg"
//                             />
//                             <button
//                               type="button"
//                               onClick={() => {
//                                 setPhotoPreview(null)
//                                 updateCreatePassForm("photo", null)
//                               }}
//                               className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 sm:p-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
//                               aria-label="Remove photo"
//                             >
//                               <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                 <path
//                                   strokeLinecap="round"
//                                   strokeLinejoin="round"
//                                   strokeWidth={2}
//                                   d="M6 18L18 6M6 6l12 12"
//                                 />
//                               </svg>
//                             </button>
//                           </div>
//                           <span className="text-[10px] sm:text-xs text-gray-600 mt-2 font-medium bg-white px-2 py-1 rounded-full">
//                             Photo Preview
//                           </span>
//                         </div>
//                       )}
//                     </div>

//                   </div>

//                   <Dialog open={showCameraModal} onOpenChange={setShowCameraModal}>
//                     <DialogContent className="max-w-lg rounded-3xl border-2 border-gray-100 shadow-2xl bg-white">
//                       <DialogHeader className="text-center space-y-3">
//                         <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-3">
//                           <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
//                             <Camera className="h-6 w-6 text-white" />
//                           </div>
//                           Capture Visitor Photo
//                         </DialogTitle>
//                         <DialogDescription className="text-gray-600">
//                           Allow camera access and click Capture to take a photo of the visitor.
//                         </DialogDescription>
//                       </DialogHeader>
//                       {cameraError ? (
//                         <Alert variant="destructive" className="rounded-xl border-2">
//                           <AlertCircle className="h-4 w-4" />
//                           <AlertDescription>{cameraError}</AlertDescription>
//                         </Alert>
//                       ) : (
//                         <div className="flex flex-col items-center space-y-6">
//                           <div className="relative">
//                             <video
//                               ref={videoRef}
//                               className="w-80 h-60 bg-black rounded-2xl shadow-lg border-4 border-gray-200"
//                               autoPlay
//                               playsInline
//                             />
//                             <div className="absolute inset-0 rounded-2xl border-2 border-dashed border-blue-300 pointer-events-none"></div>
//                           </div>
//                           <canvas ref={canvasRef} className="hidden" width={320} height={240} />
//                           <div className="flex gap-4">

//                             <Button
//                               type="button"
//                               onClick={() => {
//                                 if (videoRef.current && canvasRef.current) {
//                                   const ctx = canvasRef.current.getContext("2d")
//                                   if (ctx) {
//                                     ctx.drawImage(
//                                       videoRef.current,
//                                       0,
//                                       0,
//                                       canvasRef.current.width,
//                                       canvasRef.current.height,
//                                     )
//                                     canvasRef.current.toBlob((blob) => {
//                                       if (blob) {
//                                         const file = new File([blob], "visitor-photo.png", { type: "image/png" })
//                                         updateCreatePassForm("photo", file)
//                                         setPhotoPreview(URL.createObjectURL(blob))
//                                         setShowCameraModal(false)
//                                       }
//                                     }, "image/png")
//                                   }
//                                 }
//                               }}
//                               className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow"
//                             >
//                               📸 Capture Photo
//                             </Button>

//                             <Button
//                               type="button"
//                               variant="outline"
//                               onClick={() => setShowCameraModal(false)}
//                               className="h-12 px-8 border-2 border-gray-300 hover:border-gray-400 rounded-xl font-semibold"
//                             >
//                               Cancel
//                             </Button>
//                           </div>
//                         </div>
//                       )}
//                     </DialogContent>
//                   </Dialog>


//                   <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-6 justify-end pt-4 sm:pt-6 lg:pt-8 border-t border-gray-100">
//                     <Button
//                       type="button"
//                       variant="destructive"
//                       onClick={() => setShowCreatePassModal(false)}
//                       className="w-full sm:w-auto h-11 sm:h-12 lg:h-14 px-6 sm:px-8 lg:px-10 text-sm sm:text-base font-semibold border-2 border-gray-300 hover:border-gray-400 rounded-lg sm:rounded-xl transition-all duration-200"
//                     >
//                       Cancel
//                     </Button>
//                     <Button
//                       type="submit"
//                       disabled={loading}
//                       className="w-full sm:w-auto h-11 sm:h-12 lg:h-14 px-6 sm:px-8 lg:px-10 text-sm sm:text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl shadow disabled:opacity-50 flex items-center justify-center gap-2"
//                     >
//                       <UserPlus className="h-4 w-4 sm:h-5 sm:w-5" />
//                       Create Pass
//                     </Button>

//                   </div>
//                 </form>
//               </div>
//             </DialogContent>
//           </Dialog>

//           {/* QR Scanner Modal */}
//           <Dialog open={showQrScanner} onOpenChange={setShowQrScanner}>
//             <DialogContent className="max-w-md">
//               <DialogHeader>
//                 <DialogTitle>Scan QR Code</DialogTitle>
//                 <DialogDescription>Point your camera at the visitor’s QR code.</DialogDescription>
//               </DialogHeader>

//               <div id="qr-reader" className="w-full h-64 border rounded" />

//               <div className="flex justify-end mt-4">
//                 <Button type="button" variant="outline" onClick={() => setShowQrScanner(false)}>
//                   Cancel
//                 </Button>
//               </div>
//             </DialogContent>
//           </Dialog>

//         </div>
//       </DashboardLayout>
//     </RoleGuard>
//   )
// }



"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

import { RoleGuard } from "@/components/auth/role-guard"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { ArrowLeft, CheckCircle, AlertCircle, UserPlus, Camera } from "lucide-react"
import { Html5Qrcode } from "html5-qrcode"
export default function CheckInProcessPage() {
  const router = useRouter()

  // Store defaultCheckoutHour from backend
  const [defaultCheckoutHour, setDefaultCheckoutHour] = useState<number>(12)

  // Fetch defaultCheckoutHour from backend

useEffect(() => {
  async function fetchDefaultCheckoutHour() {
    try {
      const res = await fetch("/api/client/settings/security");
      if (!res.ok) return;
      const json = await res.json();

      // Handles: number | string | {$numberInt: "12"}
      const raw = json?.defaultCheckoutHour;
      const coerced =
        typeof raw === "object" && raw && "$numberInt" in raw
          ? Number((raw as any).$numberInt)
          : Number(raw);

      if (Number.isFinite(coerced) && coerced > 0) {
        setDefaultCheckoutHour(Math.floor(coerced)); // ensure integer hours
      }
    } catch {
      /* keep default 12 on error */
    }
  }
  fetchDefaultCheckoutHour();
}, []);


  // Get QR code image URL from environment variable
  const qrCodeImageUrl = process.env.NEXT_PUBLIC_QR_CODE_IMAGE_URL
  // Dropdown data state
  const [visitorTypes, setVisitorTypes] = useState<string[]>([])
  const [purposes, setPurposes] = useState<string[]>([])
  const [idTypes, setIdTypes] = useState<string[]>([])
  const [hosts, setHosts] = useState<any[]>([])
  const [selectedHost, setSelectedHost] = useState<any | null>(null)

  // Access point state
  type AP = { _id: string; name: string; active?: boolean }
  const [accessPoints, setAccessPoints] = useState<AP[]>([])
  const [selectedAccessPointId, setSelectedAccessPointId] = useState<string>("")
  const [defaultAccessPointId, setDefaultAccessPointId] = useState<string | null>(null)
  const [hideAccessPointSelect, setHideAccessPointSelect] = useState<boolean>(false)
  const getApName = (id?: string) => accessPoints.find((ap) => ap._id === id)?.name || ""

  // Fetch dropdown data for active client
  useEffect(() => {
    async function fetchDropdowns() {
      try {
        const [vtRes, pRes, idtRes, hRes] = await Promise.all([
          fetch("/api/client/settings/visitor-types"),
          fetch("/api/client/settings/purposes"),
          fetch("/api/client/settings/id-types"),
          fetch("/api/client/settings/hosts"),
        ])
        const [vtData, pData, idtData, hData] = await Promise.all([
          vtRes.json(),
          pRes.json(),
          idtRes.json(),
          hRes.json(),
        ])
        setVisitorTypes(Array.isArray(vtData) ? vtData.map((v) => v.name) : [])
        setPurposes(Array.isArray(pData) ? pData.map((p) => p.name) : [])
  setIdTypes(Array.isArray(idtData) ? idtData.map((i) => i.name) : [])
  // keep full host objects so we can use IDs and approval flags
  setHosts(Array.isArray(hData) ? hData : [])
      } catch {
        // fallback: leave dropdowns empty
      }
    }
    fetchDropdowns()
  }, [])

  // discover default AP from JWT (same token you already read elsewhere)
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]))
        // support multiple possible claim names
        const ap = payload?.defaultAccessPointId || payload?.accessPointId || payload?.apId || null
        if (ap) {
          setDefaultAccessPointId(ap)
          setSelectedAccessPointId(ap)
          setHideAccessPointSelect(true)
        }
      } catch {
        /* ignore */
      }
    }
  }, [])

  // fetch access points; ensure selector visibility is correct
  useEffect(() => {
    ; (async () => {
      try {
        const r = await fetch("/api/client/settings/access-points")
        if (!r.ok) return
        const data = await r.json()
        const active = Array.isArray(data) ? data.filter((a: any) => a.active !== false) : []
        setAccessPoints(active)
        // if no default AP, preselect first active (still show selector)
        if (!defaultAccessPointId && active.length && !selectedAccessPointId) {
          setSelectedAccessPointId(active[0]._id)
        }
        // if default AP is missing (deleted/inactive), force selector
        if (defaultAccessPointId && !active.some((ap) => ap._id === defaultAccessPointId)) {
          setHideAccessPointSelect(false)
        }
      } catch {
        /* ignore */
      }
    })()
  }, [defaultAccessPointId, selectedAccessPointId])

  const [activeOption, setActiveOption] = useState<string | null>(null)
  const [mobileNumber, setMobileNumber] = useState("")
  const [passId, setPassId] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const [showCreatePassModal, setShowCreatePassModal] = useState(false)
  const [existingVisitor, setExistingVisitor] = useState(false)
  const [lastPass, setLastPass] = useState<any | null>(null)
  const [lastPassLoading, setLastPassLoading] = useState(false)
  const [qrData, setQrData] = useState("")
  const [showQrScanner, setShowQrScanner] = useState(false)

  // OTP states
  const [otpEnabled, setOtpEnabled] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpValue, setOtpValue] = useState("")
  const [otpVerified, setOtpVerified] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [otpError, setOtpError] = useState("")
  const [otpSuccess, setOtpSuccess] = useState("")

  // Find Pass states
  const [foundPass, setFoundPass] = useState<any | null>(null)
  const [findingPass, setFindingPass] = useState(false)
  const [findPassError, setFindPassError] = useState("")

  // Format Date -> 'YYYY-MM-DDTHH:mm' for <input type="datetime-local" />
  const toDatetimeLocal = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

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
    checkoutDateLimit: "", // new field for expectedCheckoutTime
    email: "",
    notes: "",
    photo: null as File | null,
  })

  // Prefill CreatePass modal fields from a previous pass
  const prefillFromPreviousPass = (pass: any) => {
    updateCreatePassForm("name", pass.name || "")
    updateCreatePassForm("visitorType", pass.visitorType || "")
    updateCreatePassForm("comingFrom", pass.comingFrom || pass.company || "")
    updateCreatePassForm("purposeOfVisit", pass.purposeOfVisit || "")
    updateCreatePassForm("host", pass.host || "")
    updateCreatePassForm("idType", pass.idType || "")
    updateCreatePassForm("visitorIdText", pass.visitorIdText || pass.visitorId || "")
    updateCreatePassForm("email", pass.email || "")
    updateCreatePassForm("notes", pass.notes || "")

    // Set previous photo as reference (NOT as current photo)
    if (pass.photoUrl) {
      setPreviousPhotoUrl(pass.photoUrl)
    }

    // New pass should have a fresh check-in time defaulted to "now"
    const now = new Date()
    updateCreatePassForm("checkInDate", toDatetimeLocal(now))
    // Default: backend-configured hours after check-in
    const expectedCheckout = new Date(now.getTime() + defaultCheckoutHour * 60 * 60 * 1000)
    updateCreatePassForm("checkoutDateLimit", toDatetimeLocal(expectedCheckout))
  }

  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [previousPhotoUrl, setPreviousPhotoUrl] = useState<string | null>(null)
  const [showCameraModal, setShowCameraModal] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [cameraError, setCameraError] = useState("")
  const [stream, setStream] = useState<MediaStream | null>(null)

  useEffect(() => {
    async function fetchAccessPoints() {
      try {
        const res = await fetch("/api/client/settings/access-points")
        if (res.ok) setAccessPoints(await res.json())
      } catch { }
    }
    fetchAccessPoints()
  }, [])

  const handleMobileCheck = async () => {
    if (!mobileNumber) return

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch(`/api/client/visitors/check-mobile?phone=${mobileNumber}`)
      const data = await response.json()

      if (response.ok && data.exists) {
        const apId = defaultAccessPointId || selectedAccessPointId
        if (!apId) {
          setError("Select an access point")
          setLoading(false)
          return
        }
        setExistingVisitor(true)
        // Visitor exists, check them in
        const checkInResponse = await fetch("/api/client/visitors/check-pass", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            passId: data.visitor.passId,
            accessPointId: apId,
            accessPointName: getApName(apId),
            method: "mobile",
          }),
        })

        const passResult = await checkInResponse.json()

        if (checkInResponse.ok) {
          setSuccess("Welcome back! You have been checked in successfully.")
        } else {
          const isExpired = passResult.expired || (passResult.error && /expired/i.test(passResult.error))
          if (isExpired) {
            // Use lastPass if provided by check-mobile API. If not present,
            // open the create modal immediately and lazily fetch last pass
            // via our lightweight endpoint (/api/visitor-pass/last-by-phone).
            let prev = data.visitor?.lastPass || null
            setShowCreatePassModal(true)

            if (prev) {
              setLastPass(prev)
              prefillFromPreviousPass(prev)
            } else {
              // show minimal defaults so modal appears instantly
              const now = new Date()
              updateCreatePassForm("checkInDate", toDatetimeLocal(now))
              const expectedCheckout = new Date(now.getTime() + defaultCheckoutHour * 60 * 60 * 1000)
              updateCreatePassForm("checkoutDateLimit", toDatetimeLocal(expectedCheckout))
              // lazy fetch the last pass and fill when available
              ;(async () => {
                try {
                  setLastPassLoading(true)
                  const res = await fetch(`/api/visitor-pass/last-by-phone?phone=${encodeURIComponent(mobileNumber)}`)
                  if (!res.ok) return
                  const json = await res.json()
                  const fetched = json?.lastPass || null
                  if (fetched) {
                    setLastPass(fetched)
                    prefillFromPreviousPass(fetched)
                  }
                } catch (e) {
                  // silently ignore — user can still create a new pass
                  console.error('lazy fetch lastPass failed', e)
                } finally {
                  setLastPassLoading(false)
                }
              })()
            }

            setError("Your previous pass has expired. Please create a new one.")
          } else {
            setError(passResult.error || "Failed to check in visitor.")
          }
        }
      } else {
        // First time visitor: open Create Pass and default check-in to now
        setExistingVisitor(false)
        const now = new Date()
        updateCreatePassForm("checkInDate", toDatetimeLocal(now))
        // Default: backend-configured hours after check-in
        const expectedCheckout = new Date(now.getTime() + defaultCheckoutHour * 60 * 60 * 1000)
        updateCreatePassForm("checkoutDateLimit", toDatetimeLocal(expectedCheckout))
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
      const apId = defaultAccessPointId || selectedAccessPointId
      if (!apId) {
        setError("Select an access point")
        setLoading(false)
        return
      }
      const response = await fetch("/api/client/visitors/check-pass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passId,
          accessPointId: apId,
          accessPointName: getApName(apId),
          method: "passId",
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(`You have been checked in successfully with Pass ID: ${passId}`)
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
          setQrData(decodedText)
          setShowQrScanner(false)
          html5QrCode.stop()
          // Check pass by passId (decodedText)
          setLoading(true)
          setError("")
          setSuccess("")
          try {
            const apId = defaultAccessPointId || selectedAccessPointId
            if (!apId) {
              setError("Select an access point")
              setLoading(false)
              return
            }
            const response = await fetch("/api/client/visitors/check-pass", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                passId: decodedText.replace(/^VISITOR_PASS:/, ""),
                accessPointId: apId,
                accessPointName: getApName(apId),
                method: "qr",
              }),
            })
            const data = await response.json()
            if (response.ok) {
              setSuccess(`Checked in successfully with Pass ID: ${decodedText}`)
            } else {
              setError(data.error || "Invalid QR code / Pass ID.")
            }
          } catch (err) {
            setError("Failed to check QR code. Please try again.")
          } finally {
            setLoading(false)
          }
        },
        () => { },
      )
      .catch((err) => {
        setError("Failed to start camera: " + err)
      })
  }

  const handleCreatePass = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate that a new photo has been captured (ALWAYS REQUIRED)
    if (!createPassForm.photo) {
      setError("Photo is required. Please take a new photo of the visitor.")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const formData = new FormData()
      // ...existing code...
      formData.append("name", createPassForm.name)
      formData.append("visitorType", createPassForm.visitorType)
      formData.append("comingFrom", createPassForm.comingFrom)
      formData.append("purposeOfVisit", createPassForm.purposeOfVisit)
      // Determine hostId to send: prefer selectedHost, but fall back to createPassForm.host
      // if it already contains an ObjectId string. This avoids a race where the host
      // details fetch hasn't completed before form submit.
      const hostIdToSend = selectedHost && selectedHost._id ? String(selectedHost._id) : (createPassForm.host && /^[0-9a-fA-F]{24}$/.test(String(createPassForm.host)) ? String(createPassForm.host) : null)
      if (hostIdToSend) {
        formData.append("hostId", hostIdToSend)
        // include host name when available
        formData.append("host", selectedHost?.name || createPassForm.host || "")
      } else {
        formData.append("host", createPassForm.host)
      }
      formData.append("idType", createPassForm.idType)
      formData.append("visitorIdText", createPassForm.visitorIdText)
      // Convert datetime-local inputs to ISO (UTC) to avoid server/client timezone parsing differences
      formData.append(
        "checkInDate",
        createPassForm.checkInDate ? new Date(createPassForm.checkInDate).toISOString() : "",
      )

      // Map checkoutDateLimit (datetime-local) to expectedCheckOutTime as ISO
      const expectedIso = createPassForm.checkoutDateLimit
        ? new Date(createPassForm.checkoutDateLimit).toISOString()
        : createPassForm.checkInDate
        ? new Date(new Date(createPassForm.checkInDate).getTime() + defaultCheckoutHour * 60 * 60 * 1000).toISOString()
        : ""

      formData.append("expectedCheckOutTime", expectedIso)
      formData.append("email", createPassForm.email)
      formData.append("notes", createPassForm.notes)
      formData.append("phone", mobileNumber)
      if (createPassForm.photo) {
        formData.append("photo", createPassForm.photo)
      }
      const response = await fetch("/api/client/visitors/create-pass", {
        method: "POST",
        body: formData,
      })
      const data = await response.json()

      if (response.ok && data.passId) {
  const apId = defaultAccessPointId || selectedAccessPointId
  // 🟩 Case 1 / Case 2 logic: Auto check-in only if host approval is NOT required
  const requiresApproval = Boolean(selectedHost?.approvalRequired);

        if (createPassForm.photo && apId && !requiresApproval) {
          try {
            const ciRes = await fetch("/api/client/visitors/check-pass", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                passId: data.passId,
                accessPointId: apId,
                accessPointName: getApName(apId),
                method: "create_with_photo",
              }),
            });
            const ciData = await ciRes.json();
            if (ciRes.ok) {
              setSuccess(
                `Pass created and checked in for ${createPassForm.name}. Pass ID: ${data.passId}`
              );
            } else {
              setSuccess(
                `Pass created for ${createPassForm.name}, but auto check-in failed: ${
                  ciData.error || "Unknown error"
                }`
              );
            }
          } catch {
            setSuccess(
              `Pass created for ${createPassForm.name}, but auto check-in failed due to network error.`
            );
          }
        } else {
          // 🟨 If host approval required → show waiting message
          if (requiresApproval) {
            setSuccess(
              `Pass created for ${createPassForm.name}. Waiting for host approval.`
            );
          } else {
            setSuccess(
              `Pass created successfully for ${createPassForm.name}. Pass ID: ${data.passId}`
            );
          }
        }
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
          checkoutDateLimit: "",
          email: "",
          notes: "",
          photo: null,
        })
        setSelectedHost(null)
        setPhotoPreview(null)
        setPreviousPhotoUrl(null)
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

  const updateCreatePassForm = (field: string, value: string | File | null) => {
    setCreatePassForm((prev) => ({ ...prev, [field]: value }))
  }

  // When a host is selected, fetch the host details (including approvalRequired)
  const handleHostSelect = async (hostId: string) => {
    updateCreatePassForm("host", hostId)
    if (!hostId) {
      setSelectedHost(null)
      return
    }
    try {
      const res = await fetch(`/api/client/settings/hosts/${hostId}`)
      if (!res.ok) {
        setSelectedHost(null)
        return
      }
      const json = await res.json()
      setSelectedHost(json)
      // If host requires approval, we may want to mark something in the form; hostId already set
    } catch (e) {
      console.error('Failed to fetch host details', e)
      setSelectedHost(null)
    }
  }

  // Handle Send OTP
  const handleSendOTP = async () => {
    if (!mobileNumber) {
      setOtpError("Please enter mobile number first");
      return;
    }

    setSendingOtp(true);
    setOtpError("");
    setOtpSuccess("");

    try {
      const response = await fetch("/api/client/visitors/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: mobileNumber }),
      });

      const data = await response.json();

      if (response.ok) {
        setOtpSent(true);
        setOtpSuccess(data.message || "OTP sent to your WhatsApp!");
      } else {
        setOtpError(data.error || "Failed to send OTP");
      }
    } catch (err) {
      setOtpError("Failed to send OTP. Please try again.");
    } finally {
      setSendingOtp(false);
    }
  };

  // Handle Verify OTP
  const handleVerifyOTP = async () => {
    if (!otpValue || otpValue.length !== 6) {
      setOtpError("Please enter 6-digit OTP");
      return;
    }

    setVerifyingOtp(true);
    setOtpError("");

    try {
      const response = await fetch("/api/client/visitors/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: mobileNumber,
          otp: otpValue
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setOtpVerified(true);
        setOtpSuccess("OTP verified successfully! ✓");
        setOtpError("");
      } else {
        setOtpError(data.error || "Invalid OTP");
        setOtpVerified(false);
      }
    } catch (err) {
      setOtpError("Failed to verify OTP. Please try again.");
      setOtpVerified(false);
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Handle Find Pass
  const handleFindPass = async () => {
    if (!mobileNumber || mobileNumber.trim() === "") {
      setFindPassError("Please enter a mobile number");
      return;
    }

    setFindingPass(true);
    setFindPassError("");
    setFoundPass(null);

    try {
      const response = await fetch(`/api/visitor-pass/last-by-phone?phone=${encodeURIComponent(mobileNumber)}`);
      const data = await response.json();

      if (response.ok && data.lastPass) {
        setFoundPass(data.lastPass);
        setFindPassError("");
      } else if (response.ok && !data.lastPass) {
        setFindPassError("No pass found for this mobile number");
        setFoundPass(null);
      } else {
        setFindPassError(data.error || "Failed to find pass");
        setFoundPass(null);
      }
    } catch (err) {
      setFindPassError("Failed to search for pass. Please try again.");
      setFoundPass(null);
    } finally {
      setFindingPass(false);
    }
  };

  // Reset OTP states when mobile number changes
  useEffect(() => {
    setOtpSent(false);
    setOtpValue("");
    setOtpVerified(false);
    setOtpError("");
    setOtpSuccess("");
    // Also reset found pass when mobile number changes
    setFoundPass(null);
    setFindPassError("");
  }, [mobileNumber]);

  useEffect(() => {
    if (showQrScanner) {
      const timer = setTimeout(() => {
        const element = document.getElementById("qr-reader")
        if (element) {
          startQrScanner()
        }
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [showQrScanner])

  useEffect(() => {
    if (showCameraModal) {
      setCameraError("")
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((mediaStream) => {
          setStream(mediaStream)
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream
            videoRef.current.play()
          }
        })
        .catch((err) => {
          setCameraError("Unable to access camera: " + err.message)
        })
    } else {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
        setStream(null)
      }
    }
    // Cleanup on unmount
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [showCameraModal])

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
              <h1 className="text-3xl font-bold text-foreground1">Check-In Process</h1>
              <p className="text-muted-foreground font-semibold">Choose your preferred check-in method</p>
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
                style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
                aria-label="Open camera to scan QR code"
              >
                <img
                  src={qrCodeImageUrl || "/placeholder.svg"}
                  alt="QR Code"
                  className="w-32 h-32 object-contain mx-auto hover:scale-105 transition-transform"
                  style={{ border: "1px solid #e5e7eb", borderRadius: "0.5rem", background: "#fff" }}
                />
              </button>
              <span className="text-xs text-muted-foreground mt-2">Click this QR code for quick check-in</span>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Mobile Number and Pass ID */}
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

              {/* Find Pass Button */}
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleFindPass}
                  disabled={!mobileNumber || findingPass}
                  className="w-full md:w-auto"
                >
                  {findingPass ? "Searching..." : "Find Pass by Mobile Number"}
                </Button>
              </div>

              {/* Find Pass Error */}
              {findPassError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{findPassError}</AlertDescription>
                </Alert>
              )}

              {/* Found Pass Display */}
              {foundPass && (
                <div className="p-4 border-2 border-green-200 rounded-lg bg-green-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-green-800 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Pass Found
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      foundPass.status === 'active' ? 'bg-green-200 text-green-800' :
                      foundPass.status === 'checked_in' ? 'bg-blue-200 text-blue-800' :
                      foundPass.status === 'checked_out' ? 'bg-gray-200 text-gray-800' :
                      'bg-red-200 text-red-800'
                    }`}>
                      {foundPass.status?.toUpperCase()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Pass ID:</span>
                      <p className="font-medium">{foundPass.passId}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Name:</span>
                      <p className="font-medium">{foundPass.name}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Host:</span>
                      <p className="font-medium">{foundPass.host}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Purpose:</span>
                      <p className="font-medium">{foundPass.purposeOfVisit}</p>
                    </div>
                    {foundPass.company && (
                      <div>
                        <span className="text-gray-600">Company:</span>
                        <p className="font-medium">{foundPass.company}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600">Visitor Type:</span>
                      <p className="font-medium">{foundPass.visitorType}</p>
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={() => {
                        // Navigate to visitor details page
                        router.push(`/client-dashboard/visitor/${foundPass.passId}`);
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      View Pass Details
                    </Button>
                  </div>
                </div>
              )}

              {/* Access Point with OTP Toggle */}
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  {!hideAccessPointSelect ? (
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="ap">Access Point *</Label>
                      <Select value={selectedAccessPointId} onValueChange={setSelectedAccessPointId}>
                        <SelectTrigger id="ap">
                          <SelectValue placeholder="Select access point" />
                        </SelectTrigger>
                        <SelectContent>
                          {accessPoints.map((ap) => (
                            <SelectItem key={ap._id} value={ap._id}>
                              {ap.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="flex-1 text-xs text-muted-foreground">
                      Using default access point: {getApName(selectedAccessPointId) || "Default"}
                    </div>
                  )}

                  {/* OTP Toggle */}
                  <div className="flex items-center gap-2">
                    <Switch
                      id="otp-toggle"
                      checked={otpEnabled}
                      onCheckedChange={(checked) => {
                        setOtpEnabled(checked);
                        if (!checked) {
                          setOtpSent(false);
                          setOtpValue("");
                          setOtpVerified(false);
                          setOtpError("");
                          setOtpSuccess("");
                        }
                      }}
                    />
                    <Label htmlFor="otp-toggle" className="text-sm font-medium cursor-pointer">
                      Require OTP
                    </Label>
                  </div>
                </div>

                {/* OTP Section */}
                {otpEnabled && (
                  <div className="space-y-3 p-4 border-2 border-blue-100 rounded-lg bg-blue-50/30">
                    {/* Send OTP Button */}
                    {!otpSent && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSendOTP}
                        disabled={!mobileNumber || sendingOtp}
                        className="w-full"
                      >
                        {sendingOtp ? "Sending OTP..." : "Send OTP to WhatsApp"}
                      </Button>
                    )}

                    {/* OTP Input and Verify */}
                    {otpSent && !otpVerified && (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="otp-input" className="text-sm">
                            Enter 6-digit OTP sent to your WhatsApp
                          </Label>
                          <InputOTP
                            maxLength={6}
                            value={otpValue}
                            onChange={setOtpValue}
                          >
                            <InputOTPGroup>
                              <InputOTPSlot index={0} />
                              <InputOTPSlot index={1} />
                              <InputOTPSlot index={2} />
                              <InputOTPSlot index={3} />
                              <InputOTPSlot index={4} />
                              <InputOTPSlot index={5} />
                            </InputOTPGroup>
                          </InputOTP>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            type="button"
                            onClick={handleVerifyOTP}
                            disabled={otpValue.length !== 6 || verifyingOtp}
                            className="flex-1"
                          >
                            {verifyingOtp ? "Verifying..." : "Verify OTP"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleSendOTP}
                            disabled={sendingOtp}
                          >
                            Resend
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Success Message */}
                    {otpVerified && (
                      <Alert className="border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          {otpSuccess}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Error Message */}
                    {otpError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{otpError}</AlertDescription>
                      </Alert>
                    )}

                    {/* Info Message */}
                    {otpSent && !otpVerified && !otpError && (
                      <p className="text-xs text-blue-600">
                        Check your WhatsApp for the OTP code
                      </p>
                    )}
                  </div>
                )}
              </div>

            </CardContent>

            <CardFooter>
              <Button
                className="w-full"
                disabled={
                  loading ||
                  (!mobileNumber && !passId && !qrData) ||
                  (otpEnabled && !otpVerified)
                }
                onClick={() => {
                  if (mobileNumber) {
                    handleMobileCheck()
                  } else if (passId) {
                    handlePassIdCheck()
                  } else if (qrData) {
                    handleQrScan()
                  }
                }}
              >
                {loading ? "Checking..." : "Submit"}
              </Button>
            </CardFooter>
          </Card>

          {/* Create Pass Modal */}

          <Dialog open={showCreatePassModal} onOpenChange={setShowCreatePassModal}>
            <DialogContent
              // className="w-screen h-screen max-w-none max-h-none p-0 rounded-none shadow-none bg-gradient-to-br from-slate-50 via-white to-blue-50/30 border-0 overflow-auto flex items-center justify-center"
               className="w-screen h-screen max-w-none max-h-none p-0 rounded-none shadow-none 
               bg-gradient-to-br from-slate-50 via-white to-blue-50/30 border-0 
               overflow-y-auto"
               style={{
      width: "100vw",
      height: "100vh",
      maxWidth: "100vw",
      maxHeight: "100vh",
      margin: "0 auto",
    }}
            >
              <div className="w-full max-w-7xl mx-auto p-8 bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 m-8">
                <form onSubmit={handleCreatePass} className="space-y-8">
                  <div className="text-center space-y-4 pb-8 border-b border-gray-100">
                    <DialogHeader>
                      <DialogTitle className="flex items-center justify-center gap-3 text-3xl font-bold text-gray-800">
                        {/* <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg"> */}
                          <UserPlus className="h-8 w-8 text-blue-600" />
                        {/* </div> */}
                        Create Visitor Pass
                      </DialogTitle>
                      <DialogDescription className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                        Create a new visitor pass for mobile number:{" "}
                        <span className="font-semibold text-blue-600">{mobileNumber}</span>
                        <br />
                        <span className="text-sm text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full inline-block mt-2">
                          💡 Tip: If you capture a photo, we'll check the visitor in automatically after creating the
                          pass.
                        </span>
                      </DialogDescription>
                      {lastPassLoading && !lastPass ? (
                        <div className="text-center mt-3 text-sm text-gray-500">Loading previous pass…</div>
                      ) : null}
                    </DialogHeader>
                  </div>
{/* OUTER GRID: add a 5th column at xl */}
<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5 gap-6 w-full">

  {/* LEFT: keep all form fields in cols 1–4 */}
  <div className="col-span-1 md:col-span-2 xl:col-span-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 w-full">
                    <div className="space-y-2 group">
                      <Label
                        htmlFor="name"
                        className="text-sm font-semibold text-gray-700 group-focus-within:text-blue-600 transition-colors"
                      >
                        Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        value={createPassForm.name}
                        onChange={(e) => updateCreatePassForm("name", e.target.value)}
                        placeholder="Enter full name"
                        required
                        className="h-9 text-gray-800 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl transition-all duration-200 bg-white/70 backdrop-blur-sm"
                      />
                    </div>

                    <div className="space-y-2 group">
                      <Label
                        htmlFor="visitorType-select"
                        className="text-sm font-semibold text-gray-700 group-focus-within:text-blue-600 transition-colors"
                      >
                        Visitor Type <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={createPassForm.visitorType}
                        onValueChange={(value) => updateCreatePassForm("visitorType", value)}
                      >
                        <SelectTrigger
                          id="visitorType-select"
                          className="h-9 border-2 w-full border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl bg-white/70 backdrop-blur-sm"
                        >
                          <SelectValue placeholder="Select visitor type" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-2 border-gray-100 shadow-xl">
                          {visitorTypes.map((type) => (
                            <SelectItem key={type} value={type} className="rounded-lg hover:bg-blue-50">
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 group">
                      <Label
                        htmlFor="comingFrom"
                        className="text-sm font-semibold text-gray-700 group-focus-within:text-blue-600 transition-colors"
                      >
                        Coming From <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="comingFrom"
                        value={createPassForm.comingFrom}
                        onChange={(e) => updateCreatePassForm("comingFrom", e.target.value)}
                        placeholder="Company or organization"
                        required
                        className="h-9 text-gray-800 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl transition-all duration-200 bg-white/70 backdrop-blur-sm"
                      />
                    </div>

                    <div className="space-y-2 group">
                      <Label
                        htmlFor="purposeOfVisit-select"
                        className="text-sm font-semibold text-gray-700 group-focus-within:text-blue-600 transition-colors"
                      >
                        Purpose of Visit <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={createPassForm.purposeOfVisit}
                        onValueChange={(value) => updateCreatePassForm("purposeOfVisit", value)}
                      >
                        <SelectTrigger
                          id="purposeOfVisit-select"
                          className="h-9 border-2 w-full border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl bg-white/70 backdrop-blur-sm"
                        >
                          <SelectValue placeholder="Select purpose" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-2 border-gray-100 shadow-xl">
                          {purposes.map((purpose) => (
                            <SelectItem key={purpose} value={purpose} className="rounded-lg hover:bg-blue-50">
                              {purpose}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 group">
                      <Label
                        htmlFor="host-select"
                        className="text-sm font-semibold text-gray-700 group-focus-within:text-blue-600 transition-colors"
                      >
                        Host <span className="text-red-500">*</span>
                      </Label>
                                      <Select value={createPassForm.host} onValueChange={(value) => handleHostSelect(value)}>
                        <SelectTrigger
                          id="host-select"
                          className="h-9 border-2 w-full border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl bg-white/70 backdrop-blur-sm"
                        >
                          <SelectValue placeholder="Select host" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-2 border-gray-100 shadow-xl">
                          {hosts.map((host) => (
                            <SelectItem key={host._id} value={host._id} className="rounded-lg hover:bg-blue-50">
                              {host.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                   

                    <div className="space-y-2 group">
                      <Label
                        htmlFor="idType-select"
                        className="text-sm font-semibold text-gray-700 group-focus-within:text-blue-600 transition-colors"
                      >
                        ID Type <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={createPassForm.idType}
                        onValueChange={(value) => updateCreatePassForm("idType", value)}
                      >
                        <SelectTrigger
                          id="idType-select"
                          className="h-9 border-2 w-full border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl bg-white/70 backdrop-blur-sm"
                        >
                          <SelectValue placeholder="Select ID type" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-2 border-gray-100 shadow-xl">
                          {idTypes.map((idType) => (
                            <SelectItem key={idType} value={idType} className="rounded-lg hover:bg-blue-50">
                              {idType}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 group">
                      <Label
                        htmlFor="visitorIdText"
                        className="text-sm font-semibold text-gray-700 group-focus-within:text-blue-600 transition-colors"
                      >
                        Visitor ID <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="visitorIdText"
                        value={createPassForm.visitorIdText}
                        onChange={(e) => updateCreatePassForm("visitorIdText", e.target.value)}
                        placeholder="Enter visitor ID number"
                        required
                        className="h-9 text-gray-800 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl transition-all duration-200 bg-white/70 backdrop-blur-sm"
                      />
                    </div>

                    <div className="space-y-2 group">
                      <Label
                        htmlFor="email"
                        className="text-sm font-semibold text-gray-700 group-focus-within:text-blue-600 transition-colors"
                      >
                        Email <span className="text-gray-400 text-xs">(Optional)</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={createPassForm.email}
                        onChange={(e) => updateCreatePassForm("email", e.target.value)}
                        placeholder="visitor@example.com"
                        className="h-9 text-gray-800 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl transition-all duration-200 bg-white/70 backdrop-blur-sm"
                      />
                    </div>

                    <div className="space-y-2 group">
                      <Label
                        htmlFor="checkInDate"
                        className="text-sm font-semibold text-gray-700 group-focus-within:text-blue-600 transition-colors"
                      >
                        Check-in Date <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="checkInDate"
                        type="datetime-local"
                        value={createPassForm.checkInDate}
                        onChange={(e) => updateCreatePassForm("checkInDate", e.target.value)}
                        required
                        className="h-9 text-gray-800 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl transition-all duration-200 bg-white/70 backdrop-blur-sm"
                      />
                    </div>

                    <div className="space-y-2 group">
                      <Label
                        htmlFor="checkoutDateLimit"
                        className="text-sm font-semibold text-gray-700 group-focus-within:text-blue-600 transition-colors"
                      >
                        Check-out Date Limit
                      </Label>
                      <Input
                        id="checkoutDateLimit"
                        type="datetime-local"
                        value={createPassForm.checkoutDateLimit}
                        onChange={(e) => updateCreatePassForm("checkoutDateLimit", e.target.value)}
                        placeholder="Default: 12 hours after check-in"
                        className="h-9 text-gray-800 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl transition-all duration-200 bg-white/70 backdrop-blur-sm"
                      />
                    </div>

                    <div className="space-y-2 col-span-full md:col-span-1 group">
                      <Label
                        htmlFor="notes"
                        className="text-sm font-semibold text-gray-700 group-focus-within:text-blue-600 transition-colors"
                      >
                        Notes <span className="text-gray-400 text-xs">(Optional)</span>
                      </Label>
                      <Textarea
                        id="notes"
                      value={createPassForm.notes}
                      onChange={(e) => updateCreatePassForm("notes", e.target.value)}
                      placeholder="Any special requirements"
                      rows={1}
                      className="min-h-[20px] max-h-[40px] border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl text-gray-800 resize-none transition-all duration-200 bg-white/70 backdrop-blur-sm"
                    />
                  </div>

                      {/* show approval hint when selected host requires approval */}
                    {selectedHost && selectedHost.approvalRequired ? (
                      <div className="col-span-3 text-sm text-amber-700 bg-amber-50 p-2 rounded">
                        This host requires approval. The visitor will remain pending until the host approves.
                      </div>
                    ) : null}
                  </div>
                  </div>

<aside className="col-span-1 md:col-span-1 md:col-start-3 xl:col-span-1 xl:col-start-5">
    <div className="sticky top-6 space-y-4">

                    {/* Previous Photo Reference (if exists and no new photo taken) */}
                    {previousPhotoUrl && !photoPreview && (
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-600 font-semibold">Previous Photo (Reference)</Label>
                        <div className="relative p-3 bg-gray-50 rounded-xl border-2 border-gray-200">
                          <img
                            src={previousPhotoUrl}
                            alt="Previous visitor photo"
                            className="w-full h-auto rounded-lg opacity-75"
                            onError={(e) => {
                              // Handle broken image
                              e.currentTarget.src = "/placeholder.svg"
                            }}
                          />
                          <div className="absolute top-5 right-5 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                            Old Photo
                          </div>
                        </div>
                        <p className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                          ⚠️ Please take a new photo below
                        </p>
                      </div>
                    )}

                    {/* New Photo Capture (REQUIRED) */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700">
                        Photo Capture <span className="text-red-500">*</span>
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCameraModal(true)}
                        className="w-full h-9 px-6 text-base font-medium bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 hover:border-blue-400 hover:from-blue-100 hover:to-purple-100 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        <Camera className="h-5 w-5 mr-3 text-blue-600" />
                        <span className="text-gray-700">Take Photo</span>
                      </Button>
                    </div>

                    {/* New Photo Preview */}
                    {photoPreview && (
                      <div className="relative flex flex-col items-center p-4 bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl border-2 border-green-200">
                        <div className="relative">
                          <img
                            src={photoPreview || "/placeholder.svg"}
                            alt="New visitor photo"
                            className="w-32 h-32 object-cover rounded-2xl border-4 border-white shadow-lg"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setPhotoPreview(null)
                              updateCreatePassForm("photo", null)
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
                            aria-label="Remove photo"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                          <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                            New Photo ✓
                          </div>
                        </div>
                        <span className="text-xs text-gray-600 mt-2 font-medium bg-white px-2 py-1 rounded-full">
                          Photo Preview
                        </span>
                      </div>
                    )}
                  </div>
                    </aside>

                  </div>

                  <Dialog open={showCameraModal} onOpenChange={setShowCameraModal}>
                    <DialogContent className="max-w-lg rounded-3xl border-2 border-gray-100 shadow-2xl bg-white">
                      <DialogHeader className="text-center space-y-3">
                        <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-3">
                          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                            <Camera className="h-6 w-6 text-white" />
                          </div>
                          Capture Visitor Photo
                        </DialogTitle>
                        <DialogDescription className="text-gray-600">
                          Allow camera access and click Capture to take a photo of the visitor.
                        </DialogDescription>
                      </DialogHeader>
                      {cameraError ? (
                        <Alert variant="destructive" className="rounded-xl border-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{cameraError}</AlertDescription>
                        </Alert>
                      ) : (
                        <div className="flex flex-col items-center space-y-6">
                          <div className="relative">
                            <video
                              ref={videoRef}
                              className="w-80 h-60 bg-black rounded-2xl shadow-lg border-4 border-gray-200"
                              autoPlay
                              playsInline
                            />
                            <div className="absolute inset-0 rounded-2xl border-2 border-dashed border-blue-300 pointer-events-none"></div>
                          </div>
                          <canvas ref={canvasRef} className="hidden" width={320} height={240} />
                          <div className="flex gap-4">

                            <Button
                              type="button"
                              onClick={() => {
                                if (videoRef.current && canvasRef.current) {
                                  const ctx = canvasRef.current.getContext("2d")
                                  if (ctx) {
                                    ctx.drawImage(
                                      videoRef.current,
                                      0,
                                      0,
                                      canvasRef.current.width,
                                      canvasRef.current.height,
                                    )
                                    canvasRef.current.toBlob((blob) => {
                                      if (blob) {
                                        const file = new File([blob], "visitor-photo.png", { type: "image/png" })
                                        updateCreatePassForm("photo", file)
                                        setPhotoPreview(URL.createObjectURL(blob))
                                        setShowCameraModal(false)
                                      }
                                    }, "image/png")
                                  }
                                }
                              }}
                              className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow"
                            >
                              📸 Capture Photo
                            </Button>

                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setShowCameraModal(false)}
                              className="h-12 px-8 border-2 border-gray-300 hover:border-gray-400 rounded-xl font-semibold"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>


                  <div className="flex gap-6 justify-end pt-8 border-t border-gray-100">
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => setShowCreatePassModal(false)}
                      className="h-14 px-10 text-base font-semibold border-2 border-gray-300 hover:border-gray-400 rounded-xl transition-all duration-200"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="h-14 px-10 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow disabled:opacity-50"
                    >
                      <UserPlus className="h-5 w-5" />
                      Create Pass
                    </Button>

                  </div>
                </form>
              </div>
            </DialogContent>
          </Dialog>

          {/* QR Scanner Modal */}
          <Dialog open={showQrScanner} onOpenChange={setShowQrScanner}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Scan QR Code</DialogTitle>
                <DialogDescription>Point your camera at the visitor’s QR code.</DialogDescription>
              </DialogHeader>

              <div id="qr-reader" className="w-full h-64 border rounded" />

              <div className="flex justify-end mt-4">
                <Button type="button" variant="outline" onClick={() => setShowQrScanner(false)}>
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
