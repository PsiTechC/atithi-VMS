// "use client"

// import { useState, useEffect, useRef } from "react"

// import { RoleGuard } from "@/components/auth/role-guard"
// import { DashboardLayout } from "@/components/layout/dashboard-layout"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
// import { ScrollArea } from "@/components/ui/scroll-area"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Textarea } from "@/components/ui/textarea"
// import { Alert, AlertDescription } from "@/components/ui/alert"
// import { ArrowLeft, Smartphone, CreditCard, QrCode, CheckCircle, AlertCircle, UserPlus, Camera } from "lucide-react"
// import { Html5Qrcode } from "html5-qrcode"
// export default function CheckInProcessPage() {
//   // Store defaultCheckoutHour from backend
//   const [defaultCheckoutHour, setDefaultCheckoutHour] = useState<number>(12)

//   // Fetch defaultCheckoutHour from backend
//   useEffect(() => {
//     async function fetchDefaultCheckoutHour() {
//       try {
//         const res = await fetch('/api/client/profile')
//         if (res.ok) {
//           const data = await res.json()
//           if (typeof data.defaultCheckoutHour === 'number' && data.defaultCheckoutHour > 0) {
//             setDefaultCheckoutHour(data.defaultCheckoutHour)
//           }
//         }
//       } catch {}
//     }
//     fetchDefaultCheckoutHour()
//   }, [])
//   // Get QR code image URL from environment variable
//   const qrCodeImageUrl = process.env.NEXT_PUBLIC_QR_CODE_IMAGE_URL;
//   // Dropdown data state
//   const [visitorTypes, setVisitorTypes] = useState<string[]>([]);
//   const [purposes, setPurposes] = useState<string[]>([]);
//   const [idTypes, setIdTypes] = useState<string[]>([]);
//   const [hosts, setHosts] = useState<string[]>([]);

  
//   // Access point state
//   type AP = { _id: string; name: string; active?: boolean }
//   const [accessPoints, setAccessPoints] = useState<AP[]>([])
//   const [selectedAccessPointId, setSelectedAccessPointId] = useState<string>("")
//   const [defaultAccessPointId, setDefaultAccessPointId] = useState<string | null>(null)
//   const [hideAccessPointSelect, setHideAccessPointSelect] = useState<boolean>(false)
//   const getApName = (id?: string) => accessPoints.find(ap => ap._id === id)?.name || ""

//   // Fetch dropdown data for active client
//   useEffect(() => {
//     async function fetchDropdowns() {
//       try {
//         const [vtRes, pRes, idtRes, hRes] = await Promise.all([
//           fetch('/api/client/settings/visitor-types'),
//           fetch('/api/client/settings/purposes'),
//           fetch('/api/client/settings/id-types'),
//           fetch('/api/client/settings/hosts'),
//         ]);
//         const [vtData, pData, idtData, hData] = await Promise.all([
//           vtRes.json(), pRes.json(), idtRes.json(), hRes.json()
//         ]);
//         setVisitorTypes(Array.isArray(vtData) ? vtData.map(v => v.name) : []);
//         setPurposes(Array.isArray(pData) ? pData.map(p => p.name) : []);
//         setIdTypes(Array.isArray(idtData) ? idtData.map(i => i.name) : []);
//         setHosts(Array.isArray(hData) ? hData.map(h => h.name) : []);
//       } catch {
//         // fallback: leave dropdowns empty
//       }
//     }
//     fetchDropdowns();
//   }, []);

  
//   // discover default AP from JWT (same token you already read elsewhere)
//   useEffect(() => {
//     const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
//     if (token) {
//      try {
//         const payload = JSON.parse(atob(token.split(".")[1]))
//         // support multiple possible claim names
//         const ap = payload?.defaultAccessPointId || payload?.accessPointId || payload?.apId || null
//         if (ap) {
//           setDefaultAccessPointId(ap)
//           setSelectedAccessPointId(ap)
//           setHideAccessPointSelect(true)
//         }
//       } catch {/* ignore */}
//     }
//   }, [])

//   // fetch access points; ensure selector visibility is correct
//   useEffect(() => {
//     (async () => {
//       try {
//         const r = await fetch('/api/client/settings/access-points')
//         if (!r.ok) return
//         const data = await r.json()
//         const active = Array.isArray(data) ? data.filter((a:any)=> a.active !== false) : []
//         setAccessPoints(active)
//         // if no default AP, preselect first active (still show selector)
//         if (!defaultAccessPointId && active.length && !selectedAccessPointId) {
//           setSelectedAccessPointId(active[0]._id)
//         }
//         // if default AP is missing (deleted/inactive), force selector
//         if (defaultAccessPointId && !active.some(ap => ap._id === defaultAccessPointId)) {
//           setHideAccessPointSelect(false)
//         }
//       } catch {/* ignore */}
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
//     photo: null as File | null
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
//     const now = new Date();
//     updateCreatePassForm("checkInDate", toDatetimeLocal(now))
//     // Default: backend-configured hours after check-in
//     const expectedCheckout = new Date(now.getTime() + defaultCheckoutHour * 60 * 60 * 1000);
//     updateCreatePassForm("checkoutDateLimit", toDatetimeLocal(expectedCheckout))
//   }

//   const [photoPreview, setPhotoPreview] = useState<string | null>(null)
//   const [showCameraModal, setShowCameraModal] = useState(false)
//   const videoRef = useRef<HTMLVideoElement | null>(null)
//   const canvasRef = useRef<HTMLCanvasElement | null>(null)
//   const [cameraError, setCameraError] = useState("")
//   const [stream, setStream] = useState<MediaStream | null>(null)

//   // const handleMobileCheck = async () => {
//   //   if (!mobileNumber) return

//   //   setLoading(true)
//   //   setError("")
//   //   setSuccess("")

//   //   try {
//   //     const response = await fetch(`/api/client/visitors/check-mobile?phone=${mobileNumber}`)
//   //     const data = await response.json()

//   //     if (response.ok && data.exists) {
//   //       // Visitor exists, check them in
//   //       const checkInResponse = await fetch('/api/client/visitors/check-pass', {
//   //         method: 'POST',
//   //         headers: { 'Content-Type': 'application/json' },
//   //         body: JSON.stringify({ passId: data.visitor.passId})
//   //       })

//   //       if (checkInResponse.ok) {
//   //         setSuccess(`Welcome back,! You have been checked in successfully.`)
//   //       } else {
//   //         setError("Failed to check in visitor.")
//   //       }
//   //     } else {
//   //       // Visitor doesn't exist, show create pass option
//   //       setShowCreatePassModal(true)
//   //     }
//   //   } catch (err) {
//   //     setError("Failed to check mobile number. Please try again.")
//   //   } finally {
//   //     setLoading(false)
//   //   }
//   // }




// useEffect(() => {
//   async function fetchAccessPoints() {
//     try {
//       const res = await fetch('/api/client/settings/access-points');
//       if (res.ok) setAccessPoints(await res.json());
//     } catch {}
//   }
//   fetchAccessPoints();
// }, []);



//   const handleMobileCheck = async () => {
//     if (!mobileNumber) return;

//     setLoading(true);
//     setError("");
//     setSuccess("");

//     try {
//       const response = await fetch(`/api/client/visitors/check-mobile?phone=${mobileNumber}`);
//       const data = await response.json();

//       if (response.ok && data.exists) {
//         const apId = defaultAccessPointId || selectedAccessPointId
//         if (!apId) { setError("Select an access point"); setLoading(false); return; }
//         setExistingVisitor(true)
//         // Visitor exists, check them in
//         const checkInResponse = await fetch("/api/client/visitors/check-pass", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ passId: data.visitor.passId,
//              accessPointId: apId,
//             accessPointName: getApName(apId),
//             method: "mobile"
//            }),
//         });

//         const passResult = await checkInResponse.json();

//         if (checkInResponse.ok) {
//           setSuccess("Welcome back! You have been checked in successfully.");
//         } else {
//            const isExpired = passResult.expired || (passResult.error && /expired/i.test(passResult.error))
//            if (isExpired) {
//             // Try use lastPass from API payload; fallback to /api/visitor-pass/all
//             let prev = data.visitor?.lastPass || null
//             if (!prev) {
//               try {
//                 const allRes = await fetch(`/api/visitor-pass/all`)
//                 const all = await allRes.json()
//                 const passes = Array.isArray(all.passes) ? all.passes : []
//                 const parseMs = (dt:any) => {
//                   if (!dt) return 0
//                  const raw = typeof dt === "string" ? dt : dt?.$date
//                   return raw ? new Date(raw).getTime() : 0
//                }
//                 prev = passes
//                   .filter((p:any) => (p.phone || p.mobile || p.contactNumber) === mobileNumber)
//                   .sort((a:any,b:any)=> parseMs(b.checkInDate) - parseMs(a.checkInDate))[0] || null
//               } catch {}
//             }
//             if (prev) {
//               setLastPass(prev)
//               prefillFromPreviousPass(prev)
//             } else {
//               // At least set check-in time default for the new pass
//               const now = new Date();
//               updateCreatePassForm("checkInDate", toDatetimeLocal(now))
//                }
//            setShowCreatePassModal(true)
//             setError("Your previous pass has expired. Please create a new one.")
//           } else {
//             setError(passResult.error || "Failed to check in visitor.")
//           }
//        }
//       } else {
//         // First time visitor: open Create Pass and default check-in to now
//         setExistingVisitor(false)
//         const now = new Date();
//         updateCreatePassForm("checkInDate", toDatetimeLocal(now))
//         // Default: backend-configured hours after check-in
//         const expectedCheckout = new Date(now.getTime() + defaultCheckoutHour * 60 * 60 * 1000);
//         updateCreatePassForm("checkoutDateLimit", toDatetimeLocal(expectedCheckout))
//         setShowCreatePassModal(true)
//       }
//     } catch (err) {
//       setError("Failed to check mobile number. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };


//   const handlePassIdCheck = async () => {
//     if (!passId) return

//     setLoading(true)
//     setError("")
//     setSuccess("")

//     try {
//       const apId = defaultAccessPointId || selectedAccessPointId
//       if (!apId) { setError("Select an access point"); setLoading(false); return; }
//       const response = await fetch('/api/client/visitors/check-pass', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//        body: JSON.stringify({
//           passId,
//          accessPointId: apId,
//           accessPointName: getApName(apId),
//           method: 'passId'
//         })
//       })

//       const data = await response.json()

//       if (response.ok) {
//         setSuccess(`you have been checked in successfully with Pass ID: ${passId}`)
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
//              const apId = defaultAccessPointId || selectedAccessPointId
//             if (!apId) { setError("Select an access point"); setLoading(false); return; }
//             const response = await fetch('/api/client/visitors/check-pass', {
//               method: 'POST',
//               headers: { 'Content-Type': 'application/json' },
//               body: JSON.stringify({
//                 passId: decodedText.replace(/^VISITOR_PASS:/, ""),
//                 accessPointId: apId,
//                 accessPointName: getApName(apId),
//                 method: 'qr'
//               })
//            })
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
//         () => { }
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
//       formData.append('name', createPassForm.name)
//       formData.append('visitorType', createPassForm.visitorType)
//       formData.append('comingFrom', createPassForm.comingFrom)
//       formData.append('purposeOfVisit', createPassForm.purposeOfVisit)
//       formData.append('host', createPassForm.host)
//       formData.append('idType', createPassForm.idType)
//       formData.append('visitorIdText', createPassForm.visitorIdText)
//       formData.append('checkInDate', createPassForm.checkInDate)
//       // Map checkoutDateLimit to expectedCheckOutTime
//   formData.append('expectedCheckOutTime', createPassForm.checkoutDateLimit || (createPassForm.checkInDate ? new Date(new Date(createPassForm.checkInDate).getTime() + defaultCheckoutHour * 60 * 60 * 1000).toISOString() : ""))
//       formData.append('email', createPassForm.email)
//       formData.append('notes', createPassForm.notes)
//       formData.append('phone', mobileNumber)
//       if (createPassForm.photo) {
//         formData.append('photo', createPassForm.photo)
//       }
//       const response = await fetch('/api/client/visitors/create-pass', {
//         method: 'POST',
//         body: formData
//       })
//       const data = await response.json()
      
//       if (response.ok && data.passId) {
//         const apId = defaultAccessPointId || selectedAccessPointId
//         // If a photo was captured, auto check-in per Case 1 rule
//        // ✅ New rule: auto check-in if photo was captured
//         if (createPassForm.photo && apId) {
//           try {
//             const ciRes = await fetch('/api/client/visitors/check-pass', {
//               method: 'POST',
//               headers: { 'Content-Type': 'application/json' },
//               body: JSON.stringify({ passId: data.passId,
//                 accessPointId: apId,
//                 accessPointName: getApName(apId),
//                 method: 'create_with_photo'
//                })
//             })
//             const ciData = await ciRes.json()
//             if (ciRes.ok) {
//               setSuccess(`Pass created and checked in for ${createPassForm.name}. Pass ID: ${data.passId}`)
//             } else {
//               setSuccess(`Pass created for ${createPassForm.name}, but auto check-in failed: ${ciData.error || 'Unknown error'}`)
//             }
//           } catch {
//             setSuccess(`Pass created for ${createPassForm.name}, but auto check-in failed due to network error.`)
//           }
//         } else {
//           setSuccess(`Pass created successfully for ${createPassForm.name}. Pass ID: ${data.passId}`)
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
//           photo: null
//         })
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
//     setCreatePassForm(prev => ({ ...prev, [field]: value }))
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
//       navigator.mediaDevices.getUserMedia({ video: true })
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
//         stream.getTracks().forEach(track => track.stop())
//         setStream(null)
//       }
//     }
//     // Cleanup on unmount
//     return () => {
//       if (stream) {
//         stream.getTracks().forEach(track => track.stop())
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
//                 style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
//                 aria-label="Open camera to scan QR code"
//               >
//                 <img
//                   src={qrCodeImageUrl}
//                   alt="QR Code"
//                   className="w-32 h-32 object-contain mx-auto hover:scale-105 transition-transform"
//                   style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', background: '#fff' }}
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

// {/* 
//               <div className="space-y-2">
//   <Label htmlFor="ap">Access Point *</Label>
//   <Select value={selectedAccessPointId} onValueChange={setSelectedAccessPointId}>
//     <SelectTrigger id="ap"><SelectValue placeholder="Select access point" /></SelectTrigger>
//     <SelectContent>
//       {accessPoints.map(ap => (
//         <SelectItem key={ap._id} value={ap._id}>{ap.name}</SelectItem>
//       ))}
//     </SelectContent>
//   </Select>
// </div> */}

//               {/* Access Point */}
//               {!hideAccessPointSelect ? (
//                 <div className="space-y-2">
//                  <Label htmlFor="ap">Access Point *</Label>
//                   <Select value={selectedAccessPointId} onValueChange={setSelectedAccessPointId}>
//                     <SelectTrigger id="ap">
//                       <SelectValue placeholder="Select access point" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {accessPoints.map(ap => (
//                         <SelectItem key={ap._id} value={ap._id}>{ap.name}</SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>
//               ) : (
//                 <div className="text-xs text-muted-foreground">
//                   Using default access point: {getApName(selectedAccessPointId) || "Default"}
//                 </div>
//               )}


//               {/* QR Scan */}
//               {/* <div className="space-y-2">
//                 <Label>QR Code</Label>
//                 <Button
//                   type="button"
//                   variant="outline"
//                   onClick={handleQrScan}
//                   className="w-full"
//                 >
//                   <QrCode className="h-4 w-4 mr-2" />
//                   Open Camera & Scan
//                 </Button>
//               </div> */}
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
//               className="w-screen h-screen max-w-none max-h-none p-12 rounded-2xl shadow-2xl bg-white border border-gray-200 overflow-auto flex items-center justify-center"
//               style={{ width: '95vw', height: '95vh', maxWidth: '100vw', maxHeight: '100vh', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
//             >
//               <form onSubmit={handleCreatePass} className="space-y-8">
//                 {/* Spacer to offset fixed header */}
//                 <div style={{height: '30px'}}>
//                 <DialogHeader className="fixed w-full top-0 bg-white z-10 pb-2">
//                   <DialogTitle className="flex text-foreground1 items-center gap-2  text-2xl font-bold">
//                     <UserPlus className="h-5 w-5" />
//                     Create Visitor Pass
//                   </DialogTitle>
//                   <DialogDescription>
//                     Create a new visitor pass for mobile number: {mobileNumber}
//                     <br />
//                     <span className="text-xs text-muted-foreground">
//                       Tip: If you capture a photo, we'll check the visitor in automatically after creating the pass.
//                     </span>
//                   </DialogDescription>
//                 </DialogHeader>
//                 </div>
               

//                 <div className="grid grid-cols-1 mt-45 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-2 items-center w-full">
                 
                 
//                   <div className="space-y-2 flex flex-col justify-center ">
//                     <Label htmlFor="name" className="font-semibold text-foreground1 text-md">Name <span className="text-red-500">*</span></Label>
//                     <Input
//                       id="name"
//                       value={createPassForm.name}
//                       onChange={(e) => updateCreatePassForm("name", e.target.value)}
//                       placeholder="Name"
//                       required
//                       className="w-full h-8 text-black border-gray-300 focus:border-primary rounded-lg"
//                     />
//                   </div>
//                   <div className="space-y-2 flex flex-col justify-center">
//                     <Label htmlFor="visitorType-select" className="font-semibold text-foreground1 text-md">Visitor Type <span className="text-red-500">*</span></Label>
//                     <Select
//                       value={createPassForm.visitorType}
//                       onValueChange={(value) => updateCreatePassForm("visitorType", value)}
//                     >
//                       <SelectTrigger id="visitorType-select" className="h-8 border-gray-300 rounded-lg">
//                         <SelectValue placeholder="Select visitor type" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         {visitorTypes.map((type) => (
//                           <SelectItem key={type} value={type}>{type}</SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </div>
//                   <div className="space-y-2 flex flex-col justify-center">
//                     <Label htmlFor="comingFrom" className="font-semibold text-foreground1 text-md">Coming From <span className="text-red-500">*</span></Label>
//                     <Input
//                       id="comingFrom"
//                       value={createPassForm.comingFrom}
//                       onChange={(e) => updateCreatePassForm("comingFrom", e.target.value)}
//                       placeholder="Company"
//                       required
//                       className="w-full h-8 text-black border-gray-300 rounded-lg"
//                     />
//                   </div>
//                   <div className="space-y-2 flex flex-col justify-center">
//                     <Label htmlFor="purposeOfVisit-select" className="font-semibold text-foreground1 text-md">Purpose of Visit <span className="text-red-500">*</span></Label>
//                     <Select
//                       value={createPassForm.purposeOfVisit}
//                       onValueChange={(value) => updateCreatePassForm("purposeOfVisit", value)}
//                     >
//                       <SelectTrigger id="purposeOfVisit-select" className="h-8 border-gray-300 rounded-lg">
//                         <SelectValue placeholder="Select purpose" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         {purposes.map((purpose) => (
//                           <SelectItem key={purpose} value={purpose}>{purpose}</SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </div>
//                   <div className="space-y-2 flex flex-col justify-center">
//                     <Label htmlFor="host-select" className="font-semibold text-foreground1 text-md">Host <span className="text-red-500">*</span></Label>
//                     <Select
//                       value={createPassForm.host}
//                       onValueChange={(value) => updateCreatePassForm("host", value)}
//                     >
//                       <SelectTrigger id="host-select" className="h-8 border-gray-300 rounded-lg">
//                         <SelectValue placeholder="Select host" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         {hosts.map((host) => (
//                           <SelectItem key={host} value={host}>{host}</SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </div>
//                   <div className="space-y-2 flex flex-col justify-center">
//                     <Label htmlFor="idType-select" className="font-semibold text-foreground1 text-md">ID Type <span className="text-red-500">*</span></Label>
//                     <Select
//                       value={createPassForm.idType}
//                       onValueChange={(value) => updateCreatePassForm("idType", value)}
//                     >
//                       <SelectTrigger id="idType-select" className="h-8 border-gray-300 rounded-lg">
//                         <SelectValue placeholder="Select ID type" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         {idTypes.map((idType) => (
//                           <SelectItem key={idType} value={idType}>{idType}</SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </div>
//                   <div className="space-y-2 flex flex-col justify-center">
//                     <Label htmlFor="visitorIdText" className="font-semibold text-foreground1 text-md">Visitor ID <span className="text-red-500">*</span></Label>
//                     <Input
//                       id="visitorIdText"
//                       value={createPassForm.visitorIdText}
//                       onChange={(e) => updateCreatePassForm("visitorIdText", e.target.value)}
//                       placeholder="Enter visitor ID"
//                       required
//                       className="w-full h-8 text-black border-gray-300 rounded-lg"
//                     />
//                   </div>

//                   <div className="space-y-2">
//                     <Label htmlFor="email" className="font-semibold text-foreground1 text-md">Email <span className="text-gray-400">(Optional)</span></Label>
//                     <Input
//                       id="email"
//                       type="email"
//                       value={createPassForm.email}
//                       onChange={(e) => updateCreatePassForm("email", e.target.value)}
//                       placeholder="Email"
//                       className="w-full h-8 text-black border-gray-300 rounded-lg"
//                     />
//                   </div>
//                   <div className="space-y-2 flex flex-col justify-center">
//                     <Label htmlFor="checkInDate" className="font-semibold text-foreground1 text-md">Check-in Date <span className="text-red-500">*</span></Label>
//                     <Input
//                       id="checkInDate"
//                       type="datetime-local"
//                       value={createPassForm.checkInDate}
//                       onChange={(e) => updateCreatePassForm("checkInDate", e.target.value)}
//                       required
//                       className="w-full h-8 text-black border-gray-300 rounded-lg"
//                     />
//                   </div>
//                   <div className="space-y-2 flex flex-col justify-center">
//                     <Label htmlFor="checkoutDateLimit" className="font-semibold text-foreground1 text-md">Check-out Date Limit</Label>
//                     <Input
//                       id="checkoutDateLimit"
//                       type="datetime-local"
//                       value={createPassForm.checkoutDateLimit}
//                       onChange={(e) => updateCreatePassForm("checkoutDateLimit", e.target.value)}
//                       placeholder="Default: 12 hours after check-in"
//                       className="w-full h-8 text-black border-gray-300 rounded-lg"
//                     />
//                   </div>
          
//                   <div className="space-y-2 col-span-2 flex flex-col justify-center">
//                     <Label htmlFor="notes" className="font-semibold text-foreground1 text-md">Notes <span className="text-gray-400">(Optional)</span></Label>
//                     <Textarea
//                       id="notes"
//                       value={createPassForm.notes}
//                       onChange={(e) => updateCreatePassForm("notes", e.target.value)}
//                       placeholder="Any special requirements or notes..."
//                       rows={2}
//                       className="w-full min-h-[36px] max-h-[60px] border-gray-300 rounded-lg text-black resize-none"
//                     />
//                   </div>
//                   <div className="space-y-2 flex flex-col justify-center">
//                     <Label className="font-semibold text-foreground1 text-md">Photo</Label>
//                     <Button type="button" variant="outline" onClick={() => setShowCameraModal(true)} className="h-12 px-6 text-base text-foreground1 border-gray-300 rounded-lg">
//                       <Camera className="h-5 w-5 mr-2 text-foreground1" />
//                       Take Photo
//                     </Button>
//                     {photoPreview && (
//                       <div className="mt-4 relative flex flex-col items-center">
//                         <img
//                           src={photoPreview}
//                           alt="Preview"
//                           className="w-32 h-32 object-cover rounded-xl border border-gray-300 shadow"
//                         />

//                         {/* Remove (X) button */}
//                         <button
//                           type="button"
//                           onClick={() => {
//                             setPhotoPreview(null);
//                             updateCreatePassForm("photo", null);
//                           }}
//                           className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600"
//                           aria-label="Remove photo"
//                         >
//                           ✕
//                         </button>

//                         <span className="text-xs text-gray-500 mt-1">Preview</span>
//                       </div>
//                     )}

//                   </div>
//                 </div>
//                 {/* Camera Modal for Photo Capture */}
//                 <Dialog open={showCameraModal} onOpenChange={setShowCameraModal}>
//                   <DialogContent className="max-w-md">
//                     <DialogHeader>
//                       <DialogTitle className="text-black font-semibold">Capture Visitor Photo</DialogTitle>
//                       <DialogDescription>Allow camera access and click Capture to take photo.</DialogDescription>
//                     </DialogHeader>
//                     {cameraError ? (
//                       <Alert variant="destructive">
//                         <AlertCircle className="h-4 w-4" />
//                         <AlertDescription>{cameraError}</AlertDescription>
//                       </Alert>
//                     ) : (
//                       <div className="flex flex-col items-center">
//                         <video ref={videoRef} className="w-64 h-48 bg-black rounded" autoPlay playsInline />
//                         <canvas ref={canvasRef} className="hidden" width={320} height={240} />
//                         <div className="flex gap-2 mt-4">
//                           <Button type="button" onClick={() => {
//                             if (videoRef.current && canvasRef.current) {
//                               const ctx = canvasRef.current.getContext("2d")
//                               if (ctx) {
//                                 ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height)
//                                 canvasRef.current.toBlob(blob => {
//                                   if (blob) {
//                                     const file = new File([blob], "visitor-photo.png", { type: "image/png" })
//                                     updateCreatePassForm("photo", file)
//                                     setPhotoPreview(URL.createObjectURL(blob))
//                                     setShowCameraModal(false)
//                                   }
//                                 }, "image/png")
//                               }
//                             }
//                           }}>
//                             Capture
//                           </Button>
//                           <Button type="button" variant="outline" onClick={() => setShowCameraModal(false)}>
//                             Cancel
//                           </Button>
//                         </div>
//                       </div>
//                     )}
//                   </DialogContent>
//                 </Dialog>
//                 <div className="flex gap-6 justify-end pt-4">
//                   <Button type="button" variant="outline" onClick={() => setShowCreatePassModal(false)} className="h-12 px-8 text-foreground1 text-base rounded-lg">
//                     Cancel
//                   </Button>
//                   <Button type="submit" disabled={loading} className="h-12 px-8 text-base rounded-lg bg-primary text-white font-semibold shadow">
//                     {loading ? "Creating..." : "Create Pass"}
//                   </Button>
//                 </div>
//               </form>
//             </DialogContent>
//           </Dialog>

//           {/* QR Scanner Modal */}
//           <Dialog open={showQrScanner} onOpenChange={setShowQrScanner}>
//             <DialogContent className="max-w-md">
//               <DialogHeader>
//                 <DialogTitle>Scan QR Code</DialogTitle>
//                 <DialogDescription>
//                   Point your camera at the visitor’s QR code.
//                 </DialogDescription>
//               </DialogHeader>

//               <div id="qr-reader" className="w-full h-64 border rounded" />

//               <div className="flex justify-end mt-4">
//                 <Button
//                   type="button"
//                   variant="outline"
//                   onClick={() => setShowQrScanner(false)}
//                 >
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
import { ArrowLeft, CheckCircle, AlertCircle, UserPlus, Camera } from "lucide-react"
import { Html5Qrcode } from "html5-qrcode"
export default function CheckInProcessPage() {
  // Store defaultCheckoutHour from backend
  const [defaultCheckoutHour, setDefaultCheckoutHour] = useState<number>(12)

  // Fetch defaultCheckoutHour from backend
  useEffect(() => {
    async function fetchDefaultCheckoutHour() {
      try {
        const res = await fetch("/api/client/profile")
        if (res.ok) {
          const data = await res.json()
          if (typeof data.defaultCheckoutHour === "number" && data.defaultCheckoutHour > 0) {
            setDefaultCheckoutHour(data.defaultCheckoutHour)
          }
        }
      } catch { }
    }
    fetchDefaultCheckoutHour()
  }, [])
  // Get QR code image URL from environment variable
  const qrCodeImageUrl = process.env.NEXT_PUBLIC_QR_CODE_IMAGE_URL
  // Dropdown data state
  const [visitorTypes, setVisitorTypes] = useState<string[]>([])
  const [purposes, setPurposes] = useState<string[]>([])
  const [idTypes, setIdTypes] = useState<string[]>([])
  const [hosts, setHosts] = useState<string[]>([])

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
        setHosts(Array.isArray(hData) ? hData.map((h) => h.name) : [])
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
  const [qrData, setQrData] = useState("")
  const [showQrScanner, setShowQrScanner] = useState(false)

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
    // New pass should have a fresh check-in time defaulted to "now"
    const now = new Date()
    updateCreatePassForm("checkInDate", toDatetimeLocal(now))
    // Default: backend-configured hours after check-in
    const expectedCheckout = new Date(now.getTime() + defaultCheckoutHour * 60 * 60 * 1000)
    updateCreatePassForm("checkoutDateLimit", toDatetimeLocal(expectedCheckout))
  }

  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [showCameraModal, setShowCameraModal] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [cameraError, setCameraError] = useState("")
  const [stream, setStream] = useState<MediaStream | null>(null)

  // const handleMobileCheck = async () => {
  //   if (!mobileNumber) return

  //   setLoading(true)
  //   setError("")
  //   setSuccess("")

  //   try {
  //     const response = await fetch(`/api/client/visitors/check-mobile?phone=${mobileNumber}`)
  //     const data = await response.json()

  //     if (response.ok && data.exists) {
  //       // Visitor exists, check them in
  //       const checkInResponse = await fetch('/api/client/visitors/check-pass', {
  //         method: 'POST',
  //         headers: { 'Content-Type': 'application/json' },
  //         body: JSON.stringify({ passId: data.visitor.passId})
  //       })

  //       if (checkInResponse.ok) {
  //         setSuccess(`Welcome back,! You have been checked in successfully.`)
  //       } else {
  //         setError("Failed to check in visitor.")
  //       }
  //     } else {
  //       // Visitor doesn't exist, show create pass option
  //       setShowCreatePassModal(true)
  //     }
  //   } catch (err) {
  //     setError("Failed to check mobile number. Please try again.")
  //   } finally {
  //     setLoading(false)
  //   }
  // }

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
            // Try use lastPass from API payload; fallback to /api/visitor-pass/all
            let prev = data.visitor?.lastPass || null
            if (!prev) {
              try {
                const allRes = await fetch(`/api/visitor-pass/all`)
                const all = await allRes.json()
                const passes = Array.isArray(all.passes) ? all.passes : []
                const parseMs = (dt: any) => {
                  if (!dt) return 0
                  const raw = typeof dt === "string" ? dt : dt?.$date
                  return raw ? new Date(raw).getTime() : 0
                }
                prev =
                  passes
                    .filter((p: any) => (p.phone || p.mobile || p.contactNumber) === mobileNumber)
                    .sort((a: any, b: any) => parseMs(b.checkInDate) - parseMs(a.checkInDate))[0] || null
              } catch { }
            }
            if (prev) {
              setLastPass(prev)
              prefillFromPreviousPass(prev)
            } else {
              // At least set check-in time default for the new pass
              const now = new Date()
              updateCreatePassForm("checkInDate", toDatetimeLocal(now))
            }
            setShowCreatePassModal(true)
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
        setSuccess(`you have been checked in successfully with Pass ID: ${passId}`)
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
      formData.append("host", createPassForm.host)
      formData.append("idType", createPassForm.idType)
      formData.append("visitorIdText", createPassForm.visitorIdText)
      formData.append("checkInDate", createPassForm.checkInDate)
      // Map checkoutDateLimit to expectedCheckOutTime
      formData.append(
        "expectedCheckOutTime",
        createPassForm.checkoutDateLimit ||
        (createPassForm.checkInDate
          ? new Date(
            new Date(createPassForm.checkInDate).getTime() + defaultCheckoutHour * 60 * 60 * 1000,
          ).toISOString()
          : ""),
      )
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
        // If a photo was captured, auto check-in per Case 1 rule
        // ✅ New rule: auto check-in if photo was captured
        if (createPassForm.photo && apId) {
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
            })
            const ciData = await ciRes.json()
            if (ciRes.ok) {
              setSuccess(`Pass created and checked in for ${createPassForm.name}. Pass ID: ${data.passId}`)
            } else {
              setSuccess(
                `Pass created for ${createPassForm.name}, but auto check-in failed: ${ciData.error || "Unknown error"}`,
              )
            }
          } catch {
            setSuccess(`Pass created for ${createPassForm.name}, but auto check-in failed due to network error.`)
          }
        } else {
          setSuccess(`Pass created successfully for ${createPassForm.name}. Pass ID: ${data.passId}`)
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

  const updateCreatePassForm = (field: string, value: string | File | null) => {
    setCreatePassForm((prev) => ({ ...prev, [field]: value }))
  }
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

              {/* 
              <div className="space-y-2">
  <Label htmlFor="ap">Access Point *</Label>
  <Select value={selectedAccessPointId} onValueChange={setSelectedAccessPointId}>
    <SelectTrigger id="ap"><SelectValue placeholder="Select access point" /></SelectTrigger>
    <SelectContent>
      {accessPoints.map(ap => (
        <SelectItem key={ap._id} value={ap._id}>{ap.name}</SelectItem>
      ))}
    </SelectContent>
  </Select>
</div> */}

              {/* Access Point */}
              {!hideAccessPointSelect ? (
                <div className="space-y-2">
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
                  className="w-full bg-transparent"
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  Open Camera & Scan
                </Button>
              </div> */}
            </CardContent>

            <CardFooter>
              <Button
                className="w-full"
                disabled={loading || (!mobileNumber && !passId && !qrData)}
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
              // style={{
              //   width: "100vw",
              //   height: "100vh",
              //   maxWidth: "100vw",
              //   maxHeight: "100vh",
              //   margin: "0 auto",
              //   display: "flex",
              //   alignItems: "center",
              //   justifyContent: "center",
              // }}

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
                    </DialogHeader>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
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
                      <Select
                        value={createPassForm.host}
                        onValueChange={(value) => updateCreatePassForm("host", value)}
                      >
                        <SelectTrigger
                          id="host-select"
                          className="h-9 border-2 w-full border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl bg-white/70 backdrop-blur-sm"
                        >
                          <SelectValue placeholder="Select host" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-2 border-gray-100 shadow-xl">
                          {hosts.map((host) => (
                            <SelectItem key={host} value={host} className="rounded-lg hover:bg-blue-50">
                              {host}
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
                        placeholder="Any special requirements, accessibility needs, or additional notes..."
                        rows={3}
                        className="min-h-[80px] max-h-[120px] border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl text-gray-800 resize-none transition-all duration-200 bg-white/70 backdrop-blur-sm"
                      />
                    </div>

                    <div className="space-y-4 group">
                      <Label className="text-sm font-semibold text-gray-700">Photo Capture</Label>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCameraModal(true)}
                        className="h-14 px-6 text-base font-medium bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 hover:border-blue-400 hover:from-blue-100 hover:to-purple-100 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md group-hover:scale-[1.02]"
                      >
                        <Camera className="h-5 w-5 mr-3 text-blue-600" />
                        <span className="text-gray-700">Take Photo</span>
                      </Button>

                      {photoPreview && (
                        <div className="relative flex flex-col items-center p-4 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2 border-gray-100">
                          <div className="relative">
                            <img
                              src={photoPreview || "/placeholder.svg"}
                              alt="Visitor photo preview"
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
                          </div>
                          <span className="text-xs text-gray-600 mt-2 font-medium bg-white px-2 py-1 rounded-full">
                            Photo Preview
                          </span>
                        </div>
                      )}
                    </div>
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
                            {/* <Button
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
                              className="h-12 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                            >
                              📸 Capture Photo
                            </Button> */}

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
                    {/* <Button
                      type="submit"
                      disabled={loading}
                      className="h-14 px-10 text-base font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 hover:from-blue-700 hover:via-purple-700 hover:to-blue-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Creating Pass...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <UserPlus className="h-5 w-5" />
                          Create Pass
                        </div>
                      )}
                    </Button> */}

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
