"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserCheck, UserX, Clock, Users, CheckCircle, AlertCircle, Camera, QrCode } from "lucide-react"
//import handleExportPDF from "@/app/client-dashboard/visitor/[passId]/page"
import { FileText, MessageCircle, Mail } from "lucide-react"
import { sendingWhatsapp } from "@/lib/whatsapp"
import {generateVisitorPassPDF} from "@/lib/pdfUtils"

interface CheckInFormData {
  name: string
  email: string
  phone: string
  company: string
  purpose: string
  hostId: string
  expectedDuration: string
  notes: string
  visitorType: string
  idType: string
  accessPoint: string
}

export function VisitorCheckIn() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("check-in")
  const [checkInForm, setCheckInForm] = useState<CheckInFormData>({
  name: "",
    email: "",
    phone: "",
    company: "",
    purpose: "",
    hostId: "",
    expectedDuration: "",
    notes: "",
    visitorType: "",
    idType: "",
    accessPoint: "",
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const [selectedVisitor, setSelectedVisitor] = useState("")
  const [clientLogoUrl, setClientLogoUrl] = useState<string>("")
  const [clientId, setClientId] = useState<string>("")
  const [clientName, setClientName] = useState<string>("");
  const [clientInstructions, setClientInstructions] = useState<string>("");
  const [visitors, setVisitors] = useState<any[]>([])

  useEffect(() => {
    // Get clientId from session (JWT in localStorage)
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]))
        if (payload.clientId) {
          setClientId(payload.clientId)
        }
      } catch {
        setClientId("")
      }
    }
  }, [])

  useEffect(() => {
    // Fetch client logo and name/instructions from profile API
    async function fetchClientProfile() {
      try {
        const res = await fetch("/api/client/profile");
        if (!res.ok) throw new Error("Failed to fetch client profile");
        const data = await res.json();
        setClientLogoUrl(data.logoUrl || "/uploads/default-logo.png");
        setClientName(data.name || "");
        setClientInstructions(data.instructions || "");
      } catch {
        setClientLogoUrl("/uploads/default-logo.png");
        setClientName("");
        setClientInstructions("");
      }
    }
    fetchClientProfile();
  }, []);

  useEffect(() => {
    // Fetch all passes and filter by clientId on client side
    

    async function fetchPasses() {
      try {
        // if (!clientId) return;
        const res = await fetch(`/api/visitor-pass/all`);
        if (!res.ok) throw new Error("Failed to fetch passes");
        const data = await res.json();
        setVisitors(Array.isArray(data.passes) ? data.passes : [])
       } catch {
         setVisitors([]);
      }
    }
    fetchPasses();
  }, []);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {

      setCheckInForm({
        name: "",
        email: "",
        phone: "",
        company: "",
        purpose: "",
        hostId: "",
        expectedDuration: "",
        notes: "",
        visitorType: "",
        idType: "",
        accessPoint: "",
      })
    } catch (err) {
      setError("Failed to check in visitor. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleCheckOut = async () => {
    if (!selectedVisitor) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      // Call API to check out visitor
      const res = await fetch(`/api/client/visitors/check-out`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId: selectedVisitor })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to check out visitor");
      setSuccess(`${data.visitor?.name || "Visitor"} has been successfully checked out.`);
      setSelectedVisitor("");
      // Refresh visitors table
      // ...existing code...
      //const visitorsRes = await fetch(`/api/client/visitors?clientId=${clientId}`);
      // ✅ backend knows clientId already
      const visitorsRes = await fetch(`/api/client/visitors`);

      const visitorsData = await visitorsRes.json();
      const checkedIn = Array.isArray(visitorsData.visitors)
        ? visitorsData.visitors.filter((v: any) =>
            (!v.checkOutTime && !v.checkOutDate) &&
            (v.clientId === clientId || v.clientId?._id === clientId || v.clientId?.$oid === clientId)
          )
        : [];
      setVisitors(checkedIn);
    } catch (err) {
      setError("Failed to check out visitor. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const updateCheckInForm = (field: keyof CheckInFormData, value: string) => {
    setCheckInForm((prev) => ({ ...prev, [field]: value }))
  }

  // Sort visitors by latest check-in date (descending)
  const sortedVisitors = [...visitors].sort((a, b) => {
    const aDateObj = a.checkInDate ? new Date(typeof a.checkInDate === "string" ? a.checkInDate : a.checkInDate?.$date) : null;
    const bDateObj = b.checkInDate ? new Date(typeof b.checkInDate === "string" ? b.checkInDate : b.checkInDate?.$date) : null;
    const aTime = aDateObj ? aDateObj.getTime() : 0;
    const bTime = bDateObj ? bDateObj.getTime() : 0;
    return bTime - aTime;
  });

  return (
    <div className="space-y-5">

      {/* Client Logo */}
      <div className="flex justify-center mb-4">
        {clientLogoUrl ? (
          <img
            src={clientLogoUrl}
            alt="Client Logo"
            className="h-40 w-auto rounded-lg shadow"
            style={{ maxWidth: 500 }}
          />
        ) : null}
      </div>

      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground1">Visitor Check-In/Out</h1>
        <p className="text-muted-foreground font-semibold">Manage visitor entry and exit from your facility</p>
      </div>

    

      {/* Action Cards */}
      <div className="flex justify-center gap-6 mb-8">
        <Card
          onClick={() => router.push("/client-dashboard/check-in/process")}
          className="cursor-pointer p-6 w-60 hover:shadow-lg transition-shadow duration-300"
        >
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Start Check-In Process</CardTitle>
            <CardDescription>Check in visitors entering the facility</CardDescription>
          </CardHeader>
        </Card>
        <Card
          onClick={() => router.push("/client-dashboard/check-out/process")}
          className="cursor-pointer p-6 w-60 hover:shadow-lg transition-shadow duration-300"
        >
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Start Check-Out Process</CardTitle>
            <CardDescription>Check out visitors leaving the facility</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Visitor Table - fixed height, scroll for more entries */}
      <div className="overflow-x-auto" style={{ maxHeight: 480, minHeight: 320, overflowY: 'auto' }}>
        <table className="min-w-full border rounded-lg bg-white" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead className="bg-muted text-white" style={{ position: 'sticky', top: 0, zIndex: 2 }}>
            <tr>
              <th className="px-3 py-2 text-left bg-foreground1" style={{ position: 'sticky', top: 0, zIndex: 2 }}>Pass ID</th>
              <th className="px-3 py-2 text-left bg-foreground1" style={{ position: 'sticky', top: 0, zIndex: 2 }}>Picture</th>
              <th className="px-3 py-2 text-left bg-foreground1" style={{ position: 'sticky', top: 0, zIndex: 2 }}>Visitor Details</th>
              <th className="px-3 py-2 text-left bg-foreground1" style={{ position: 'sticky', top: 0, zIndex: 2 }}>Coming From</th>
              <th className="px-3 py-2 text-left bg-foreground1" style={{ position: 'sticky', top: 0, zIndex: 2 }}>Purpose</th>
              <th className="px-3 py-2 text-left bg-foreground1" style={{ position: 'sticky', top: 0, zIndex: 2 }}>Host</th>
              <th className="px-3 py-2 text-left bg-foreground1" style={{ position: 'sticky', top: 0, zIndex: 2 }}>Visitor ID</th>
              <th className="px-3 py-2 text-left bg-foreground1" style={{ position: 'sticky', top: 0, zIndex: 2 }}>Check In</th>
              <th className="px-3 py-2 text-left bg-foreground1" style={{ position: 'sticky', top: 0, zIndex: 2 }}>Check Out</th>
              <th className="px-3 py-2 text-left bg-foreground1" style={{ position: 'sticky', top: 0, zIndex: 2 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedVisitors.map((pass) => {
              // Format check-in time
              let checkInDisplay = "--";
              if (pass.checkInDate) {
                const dateObj = typeof pass.checkInDate === "string"
                  ? new Date(pass.checkInDate)
                  : pass.checkInDate?.$date
                    ? new Date(pass.checkInDate.$date)
                    : null;
                if (dateObj) {
                  checkInDisplay = dateObj.toLocaleString();
                }
              }
              let checkOutDisplay = "--";
              if (pass.checkOutDate) {
                const dateObj = typeof pass.checkOutDate === "string"
                  ? new Date(pass.checkOutDate)
                  : pass.checkOutDate?.$date
                    ? new Date(pass.checkOutDate.$date)
                    : null;
                if (dateObj) {
                  checkOutDisplay = dateObj.toLocaleString();
                }
              }
              return (
                <tr
                  //key={pass._id}
                  className="border-b cursor-pointer hover:bg-gray-50"
                  onClick={() => router.push(`/client-dashboard/visitor/${pass.passId || pass._id}`)}
                >
                  <td className="px-3 py-2">{pass.passId || pass._id}</td>
                  <td className="px-3 py-2">
                    <img src={pass.photoUrl || "/uploads/default-avatar.png"} alt="Visitor" className="h-15 w-20 rounded-full object-contain" />
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-medium">{pass.name}</div>
                    <div className="text-xs text-muted-foreground">{pass.phone}</div>
                  </td>
                  <td className="px-3 py-2">{pass.comingFrom || "Reception"}</td>
                  <td className="px-3 py-2">{pass.purposeOfVisit}</td>
                  <td className="px-3 py-2">{pass.host}</td>
                  <td className="px-3 py-2">{pass.visitorIdText || pass.visitorId || pass._id}</td>
                  <td className="px-3 py-2">{checkInDisplay}</td>
                  <td className="px-3 py-2">{checkOutDisplay}</td>
                  <td className="px-3 py-2 flex gap-2">
                    <Button variant="outline" size="sm" title="Download PDF">
                      {/* <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 2v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> */}
                      <FileText className="h-4 w-4" />
                    </Button>
                    {/* <Button variant="outline" size="sm" title="Send WhatsApp">
                      <MessageCircle className="h-4 w-4 text-green-600" />
                    </Button> */}

                    <Button
  variant="outline"
  size="sm"
  title="Send WhatsApp"
  onClick={async (e) => {
    e.stopPropagation();
    try {
      // Generate PDF
      const pdfBlob = await generateVisitorPassPDF(
        pass,
        null,
        clientName || "",
        clientLogoUrl,
        clientInstructions || ""
      );

      // Upload it (to `/uploads`) via your existing `/api/upload` or local saveFileToLocal
      const formData = new FormData();
      formData.append("file", new File([pdfBlob], `VisitorPass_${pass.passId}.pdf`, { type: "application/pdf" }));

      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      const { url: pdfUrl } = await uploadRes.json();

      // Send WhatsApp via backend API
      try {
        const wsRes = await fetch("/api/send-whatsapp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: pass.name,
            number: pass.phone,
            pdfUrl,
            mediaName: `VisitorPass_${pass.passId}.pdf`,
          }),
        });
        if (!wsRes.ok) {
          const errData = await wsRes.json();
          throw new Error(errData.error || "Failed to send WhatsApp message");
        }
        alert("WhatsApp message sent!");
      } catch (err) {
        console.error(err);
        alert("Failed to send WhatsApp message");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to send WhatsApp message");
    }
  }}>
    <MessageCircle className="h-4 w-4 text-green-600" />
  </Button>

                    <Button variant="outline" size="sm" title="Send SMS">
                      <Mail className="h-4 w-4 text-blue-600" />
                    </Button>
                  </td>
                </tr>
              );
            })}
            {visitors.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center py-8 text-muted-foreground">
                  No visitors currently on-site
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
    </div>
  )
}
