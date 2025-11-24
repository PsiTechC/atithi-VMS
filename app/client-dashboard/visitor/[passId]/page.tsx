
"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import jsPDF from "jspdf";
import { generateVisitorPassPDF } from "@/lib/pdfUtils";
import { EditDialog } from "@/components/client/EditDialog";


const formatDateTime = (dateString: string) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};


export default function VisitorDetailsPage() {
  const { passId } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clientLogoUrl, setClientLogoUrl] = useState<string | null>(null);
  const [clientInstructions, setClientInstructions] = useState<string>("");
  const [clientAddress, setClientAddress] = useState<string>("");

  // Edit states
  const [editEntity, setEditEntity] = useState<any>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);

  // Options for selects
  const [visitorTypes, setVisitorTypes] = useState<string[]>([]);
  const [hosts, setHosts] = useState<string[]>([]);
  const [idTypes, setIdTypes] = useState<string[]>([]);
  const [purposes, setPurposes] = useState<string[]>([]);

  // Add with other useState declarations (do NOT put after return)
const [insetAlert, setInsetAlert] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
//const [pendingResend, setPendingResend] = useState(false);
// const [pendingCheckout, setPendingCheckout] = useState(false);

const [pendingAction, setPendingAction] = useState<"resend" | "checkout" | null>(null);

  useEffect(() => {
    async function fetchDetails() {
      setLoading(true);
      setError("");
      try {
        const [passRes, profileRes] = await Promise.all([
          fetch(`/api/visitor-pass/${passId}`),
          fetch(`/api/client/profile`),
        ]);

        if (!passRes.ok) throw new Error("Pass not found");

        const passData = await passRes.json();
        const profileData = await profileRes.json();

        setData(passData);
        setClientLogoUrl(profileData.logoUrl || null);
        setClientInstructions(profileData.instructions || "");
        setClientAddress(profileData.address || ""); // ✅ new line
      } catch (err) {
        setError("Failed to fetch visitor details");
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [passId]);

  useEffect(() => {
    async function fetchOptions() {
      try {
        const [vtRes, hRes, itRes, pRes] = await Promise.all([
          fetch('/api/client/settings/visitor-types'),
          fetch('/api/client/settings/hosts'),
          fetch('/api/client/settings/id-types'),
          fetch('/api/client/settings/purposes'),
        ]);
        if (vtRes.ok) {
          const vtData = await vtRes.json();
          setVisitorTypes(vtData.map((v: any) => v.name));
        }
        if (hRes.ok) {
          const hData = await hRes.json();
          setHosts(hData.map((h: any) => h.name));
        }
        if (itRes.ok) {
          const itData = await itRes.json();
          setIdTypes(itData.map((i: any) => i.name));
        }
        if (pRes.ok) {
          const pData = await pRes.json();
          setPurposes(pData.map((p: any) => p.name));
        }
      } catch (err) {
        console.error('Failed to fetch options', err);
      }
    }
    fetchOptions();
  }, []);

const handleExportPDF = async () => {
  if (!data || !data.pass) return;
  const pdfBlob = await generateVisitorPassPDF(
    data.pass,
    data.visitor,
    data.client?.name || "",
    clientLogoUrl,
    clientInstructions,
    clientAddress 
  );
  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `VisitorPass_${data.pass.passId}.pdf`;
  link.click();
};


    const blobToBase64 = (blob: Blob): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });

    if (loading) return <div className="max-w-2xl mx-auto p-6">Loading...</div>;
    if (error || !data || !data.pass)
        return <div className="max-w-2xl mx-auto p-6">Not found</div>;

    const pass = data.pass;
    const visitor = data.visitor;

    const handleEditSave = async (formData: FormData) => {
      setLoadingEdit(true);
      try {
        const res = await fetch(`/api/visitor-pass/${passId}`, {
          method: 'PUT',
          body: formData,
        });
        if (res.ok) {
          // Refetch data
          const passRes = await fetch(`/api/visitor-pass/${passId}`);
          if (passRes.ok) {
            const updatedData = await passRes.json();
            setData(updatedData);
          }
          setEditOpen(false);
          setEditEntity(null);
        } else {
          const errorData = await res.json();
          alert(errorData.error || 'Failed to update pass');
        }
      } catch (err) {
        alert('Failed to update pass');
      } finally {
        setLoadingEdit(false);
      }
    };

    const handleCheckout = async () => {
  if (!confirm("Are you sure you want to check out this visitor?")) return;

  try {
    const res = await fetch(`/api/visitor-pass/${passId}/checkout`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method: "client" }), // mark that client triggered checkout
    });

    if (!res.ok) throw new Error("Failed to check out visitor");

    // Try to use returned pass from API to avoid extra GET
    const json = await res.json();
    if (json && json.pass) {
      setData({ pass: json.pass, visitor: data?.visitor, client: data?.client });
      alert("Visitor checked out successfully.");
    } else {
      // Fallback: re-fetch the updated pass data (includes updated movementHistory)
      const updatedRes = await fetch(`/api/visitor-pass/${passId}`);
      if (updatedRes.ok) {
        const updatedData = await updatedRes.json();
        setData(updatedData);
        alert("Visitor checked out successfully.");
      }
    }
  } catch (err) {
    console.error(err);
    alert("Something went wrong while checking out.");
  }
};


//     return (
//         <>
//         <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
//             <button
//                 type="button"
//                 className="mb-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium"
//                 onClick={() => window.history.back()}
//             >
//                 &larr; Go Back
//             </button>

//             {/* Export Button */}
//             <button
//                 type="button"
//                 onClick={handleExportPDF}
//                 className="mb-4 ml-2 px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
//             >
//                 Export as PDF
//             </button>

//             {/* Edit Button */}
//             <button
//                 type="button"
//                 onClick={() => {
//                   const pass = data.pass;
//                   const checkInDate = new Date(pass.checkInDate);
//                   const localCheckIn = new Date(checkInDate.getTime() - checkInDate.getTimezoneOffset() * 60000);
//                   const expectedDate = new Date(pass.expectedCheckOutTime);
//                   const localExpected = new Date(expectedDate.getTime() - expectedDate.getTimezoneOffset() * 60000);
//                   setEditEntity({
//                     passId:pass.passId,
//                     name: pass.name,
//                     visitorType: pass.visitorType,
//                     comingFrom: pass.comingFrom,
//                     purposeOfVisit: pass.purposeOfVisit,
//                     host: pass.host,
//                     idType: pass.idType,
//                     visitorIdText: pass.visitorIdText,
//                     checkInDate: localCheckIn.toISOString().slice(0, 16),
//                     expectedCheckOutTime: localExpected.toISOString().slice(0, 16),
//                     email: pass.email || '',
//                     notes: pass.notes || '',
//                     phone: pass.phone,
//                     photo: null, // for file upload
//                   });
//                   setEditOpen(true);
//                 }}
//                 className="mb-4 ml-2 px-4 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700"
//             >
//                 Edit Pass
//             </button>

//             {/* Checkout Button */}
// {pass.status !== "checked_out" && (
//   <button
//     type="button"
//     onClick={handleCheckout}
//     className="mb-4 ml-2 px-4 py-2 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700"
//   >
//     Check Out
//   </button>
// )}


//             <h2 className="text-2xl font-bold mb-4">Visitor Pass Details</h2>
//             <div className="flex gap-6 items-center mb-6">
//                 <img
//                     src={pass.photoUrl || "/uploads/default-avatar.png"}
//                     alt="Visitor Photo"
//                     className="h-32 w-32 rounded-full object-cover border"
//                 />
//                 <div className="flex flex-col gap-1 flex-1">
//                     <div className="font-semibold text-lg">{pass.name}</div>
//                     <div className="text-sm text-muted-foreground">
//                         Email: {pass.email || visitor?.email}
//                     </div>
//                     <div className="text-sm text-muted-foreground">
//                         Phone: {pass.phone || visitor?.phone}
//                     </div>
//                     <div className="text-sm text-muted-foreground">
//                         Company: {visitor?.company}
//                     </div>
//                 </div>
//                 <div className="flex-shrink-0">
//                     <img
//                         src={pass.qrCode}
//                         alt="QR Code"
//                         className="h-32 w-32 object-contain border"
//                     />
//                 </div>
//             </div>
//             <table className="w-full text-sm mb-6">
//                 <tbody>
//                     <tr><td className="font-medium">Pass ID:</td><td>{pass.passId}</td></tr>
//                     <tr><td className="font-medium">Visitor Type:</td><td>{pass.visitorType}</td></tr>
//                     <tr><td className="font-medium">Coming From:</td><td>{pass.comingFrom}</td></tr>
//                     <tr><td className="font-medium">Purpose of Visit:</td><td>{pass.purposeOfVisit}</td></tr>
//                     <tr><td className="font-medium">Host:</td><td>{pass.host}</td></tr>
//                     <tr><td className="font-medium">ID Type:</td><td>{pass.idType}</td></tr>
//                     <tr><td className="font-medium">Visitor ID:</td><td>{pass.visitorIdText}</td></tr>
//                     <tr><td className="font-medium">Check In Date:</td><td>{formatDateTime(pass.checkInDate)}</td></tr> 
//                     {/* <tr><td className="font-medium">Check Out Date:</td><td>{new Date(pass.checkOutDate).toLocaleString()}</td></tr> */}
//                     <tr><td className="font-medium">Expected Check-Out:</td><td>{formatDateTime(pass.expectedCheckOutTime)}</td></tr>
//                     <tr><td className="font-medium">Status:</td><td>{pass.status}</td></tr>
//                     <tr><td className="font-medium">Notes:</td><td>{pass.notes}</td></tr>
//                 </tbody>
//             </table>


//       {/* Access / Movement History */}
//       {Array.isArray(pass.movementHistory) && pass.movementHistory.length > 0 ? (
//         <>
//           <h3 className="text-xl font-semibold mb-3">Access History</h3>
//           <table className="w-full text-sm border rounded">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="text-left p-2 border-b">Time</th>
//                 <th className="text-left p-2 border-b">Event</th>
//                 <th className="text-left p-2 border-b">Access Point</th>
//                 <th className="text-left p-2 border-b">Method</th>
//               </tr>
//             </thead>
//             <tbody>
//               {pass.movementHistory
//                 .slice()
//                 .sort((a:any,b:any)=> new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
//                 .map((ev:any, i:number) => (
//                 <tr key={i} className="border-b">
//                   <td className="p-2">{formatDateTime(ev.timestamp)}</td>
//                   <td className="p-2">{ev.type === 'check_in' ? 'Check-In' : 'Check-Out'}</td>
//                   <td className="p-2">{ev.accessPointName || ev.accessPointId || '-'}</td>
//                   <td className="p-2">{(ev.method || '').toUpperCase()}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </>
//       ) : null}

//       {/* WhatsApp Message History */}
//       <div className="mt-8">
//         <h3 className="text-xl font-semibold mb-3">WhatsApp Message History</h3>
//         <table className="w-full text-sm border rounded">
//           <thead className="bg-gray-50">
//             <tr>
//               <th className="text-left p-2 border-b w-16">Sr No.</th>
//               <th className="text-left p-2 border-b">Time</th>
//               <th className="text-left p-2 border-b">Status</th>
//               <th className="text-left p-2 border-b text-center">Action</th>
//             </tr>
//           </thead>
//           <tbody>
//             {(pass.whatsappHistory && pass.whatsappHistory.length > 0) ? (
//               pass.whatsappHistory.map((msg:any, index:number) => (
//                 <tr key={index} className="border-b">
//                   <td className="p-2">{index + 1}</td>
//                   <td className="p-2">{formatDateTime(msg.timestamp)}</td>
//                   <td className={`p-2 font-medium ${msg.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
//                     {msg.status === 'success' ? 'Success' : 'Failure'}
//                   </td>
//                   <td className="p-2 text-center">
//                     <button
//                       onClick={() => alert(`Resending message ${index + 1}...`)}
//                       className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
//                     >
//                       Resend
//                     </button>
//                   </td>
//                 </tr>
//               ))
//             ) : (
//               <tr>
//                 <td colSpan={4} className="p-3 text-center text-gray-500">
//                   No WhatsApp messages found
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>
//         </div>



//         <EditDialog
//           open={editOpen}
//           title="Edit Visitor Pass"
//           description="Update the visitor pass details."
//           entity={editEntity}
//           setEntity={(entity) => {
//             if (entity === null) {
//               setEditOpen(false);
//               setEditEntity(null);
//             } else {
//               setEditEntity(entity);
//             }
//           }}
//           onSubmit={async (e) => {
//             e.preventDefault();
//             if (!editEntity) return;
//             const formData = new FormData();

//             // Convert datetime-local fields (which are local wall-time) to ISO strings
//             const clone: any = { ...editEntity };
//             if (clone.checkInDate) {
//               try {
//                 clone.checkInDate = new Date(clone.checkInDate).toISOString();
//               } catch {}
//             }
//             if (clone.expectedCheckOutTime) {
//               try {
//                 clone.expectedCheckOutTime = new Date(clone.expectedCheckOutTime).toISOString();
//               } catch {}
//             }

//             Object.entries(clone).forEach(([key, value]) => {
//               if (value !== null && value !== undefined) {
//                 // File objects (photo) must be appended as-is
//                 formData.append(key, value as any);
//               }
//             });
//             await handleEditSave(formData);
//           }}
//           loading={loadingEdit}
//           fields={[
//             { type: "text", name: "name", label: "Name", required: true },
//             { type: "select", name: "visitorType", label: "Visitor Type", options: visitorTypes },
//             { type: "text", name: "comingFrom", label: "Coming From", required: true },
//             { type: "select", name: "purposeOfVisit", label: "Purpose of Visit", options: purposes },
//             { type: "select", name: "host", label: "Host", options: hosts },
//             { type: "select", name: "idType", label: "ID Type", options: idTypes },
//             { type: "text", name: "visitorIdText", label: "Visitor ID Text", required: true },
//             { type: "datetime-local", name: "checkInDate", label: "Check In Date", required: true },
//             { type: "datetime-local", name: "expectedCheckOutTime", label: "Expected Check-Out Time", required: true },
//             { type: "email", name: "email", label: "Email" },
//             { type: "text", name: "notes", label: "Notes" },
//             { type: "tel", name: "phone", label: "Phone", required: true },
//             { type: "file", name: "photo", label: "Photo" },
//           ]}
//         />
//         </>
//     );


return (
  <>

    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow h-screen flex flex-col overflow-hidden">
      {/* Top Action Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium"
          onClick={() => window.history.back()}
        >
          &larr; Go Back
        </button>

        <button
          type="button"
          onClick={handleExportPDF}
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
        >
          Export as PDF
        </button>

        <button
          type="button"
          onClick={() => {
            const pass = data.pass;
            const checkInDate = new Date(pass.checkInDate);
            const localCheckIn = new Date(checkInDate.getTime() - checkInDate.getTimezoneOffset() * 60000);
            const expectedDate = new Date(pass.expectedCheckOutTime);
            const localExpected = new Date(expectedDate.getTime() - expectedDate.getTimezoneOffset() * 60000);
            setEditEntity({
              passId: pass.passId,
              name: pass.name,
              visitorType: pass.visitorType,
              comingFrom: pass.comingFrom,
              purposeOfVisit: pass.purposeOfVisit,
              host: pass.host,
              idType: pass.idType,
              visitorIdText: pass.visitorIdText,
              checkInDate: localCheckIn.toISOString().slice(0, 16),
              expectedCheckOutTime: localExpected.toISOString().slice(0, 16),
              email: pass.email || '',
              notes: pass.notes || '',
              phone: pass.phone,
              photo: null,
            });
            setEditOpen(true);
          }}
          className="px-4 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700"
        >
          Edit Pass
        </button>

        {/* {pass.status !== "checked_out" && (
          <button
            type="button"
            onClick={handleCheckout}
            className="px-4 py-2 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700"
          >
            Check Out
          </button>
        )} */}

        {/* {pass.status !== "checked_out" && (
  <button
    type="button"
    onClick={() => {
      setPendingCheckout(true);
      setInsetAlert({
        type: "info",
        message: "Confirm check-out for this visitor?",
      });
    }}
    className="px-4 py-2 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700"
  >
    Check Out
  </button>
)} */}


{/* Checkout Button */}
{pass.status !== "checked_out" && (
  <button
    type="button"
    onClick={() => {
     setPendingAction("checkout");
      setInsetAlert({ type: "info", message: "Confirm check-out for this visitor?" });
    }}
    className="px-4 py-2 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700"
  >
    Check Out
  </button>
)}

        
{/* <button
  type="button"
  onClick={async () => {
    if (!data || !data.pass) return alert("No pass data found.");
    const pass = data.pass;

    if (!confirm("Resend WhatsApp message for this visitor?")) return;

    try {
      // 1️⃣ Generate PDF again for sending
      const pdfBlob = await generateVisitorPassPDF(
        pass,
        data.visitor,
        data.client?.name || "",
        clientLogoUrl,
        clientInstructions,
        clientAddress
      );

      // upload
              const formData = new FormData();
              formData.append(
                "file",
                new File([pdfBlob], `VisitorPass_${pass.passId}.pdf`, {
                  type: "application/pdf",
                })
              );
              const uploadRes = await fetch("/api/upload", {
                method: "POST",
                body: formData,
              });
              if (!uploadRes.ok) throw new Error("Upload failed");
              const uploadJson = await uploadRes.json();
              const pdfUrl = uploadJson?.url;
              if (!pdfUrl) throw new Error("Upload did not return url");


      //const pdfUrl = URL.createObjectURL(pdfBlob);

      // 2️⃣ Call the API that sends WhatsApp
      const res = await fetch("/api/send-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: pass.name,
          number: pass.phone,
          pdfUrl,
          mediaName: `VisitorPass_${pass.passId}.pdf`,
          passId: pass.passId,
        }),
      });

      const result = await res.json();

      if (res.ok) {
        alert("✅ WhatsApp message resent successfully!");
      } else {
        alert(`❌ Failed to resend: ${result.error || "Unknown error"}`);
      }

      // 3️⃣ Optional: refresh pass data to update WhatsApp history
      const updatedRes = await fetch(`/api/visitor-pass/${pass.passId}`);
      if (updatedRes.ok) {
        const updatedData = await updatedRes.json();
        setData(updatedData);
      }
    } catch (err) {
      console.error("Error resending WhatsApp:", err);
      alert("Something went wrong while resending WhatsApp.");
    }
  }}
  className="ml-auto px-4 py-2 bg-emerald-600 text-white rounded text-sm font-medium hover:bg-emerald-700"
>
  Resend WhatsApp
</button> */}


{/* Resend All WhatsApp Button (custom inline alert version) */}
<button
  type="button"
  onClick={() => {
    if (!data || !data.pass) {
      setInsetAlert({ type: "error", message: "No pass data found." });
      return;
    }

    // Show inline confirmation prompt
     setPendingAction("resend");
    setInsetAlert({
      type: "info",
      message: "Confirm resend WhatsApp message for this visitor.",
    });
  }}
  className="ml-auto px-4 py-2 bg-emerald-600 text-white rounded text-sm font-medium hover:bg-emerald-700"
>
  Resend WhatsApp
</button>
{/* Inline Custom Alert UI */}


      </div>

      {/* Scrollable Content Section */}
      <div className="overflow-y-auto flex-1 pr-2 space-y-8">
        <h2 className="text-2xl font-bold">Visitor Pass Details</h2>

        {/* Visitor Info */}
        <div className="flex gap-6 items-center">
          <img
            src={pass.photoUrl || "/uploads/default-avatar.png"}
            alt="Visitor Photo"
            className="h-32 w-32 rounded-full object-cover border"
          />
          <div className="flex flex-col gap-1 flex-1">
            <div className="font-semibold text-lg">{pass.name}</div>
            <div className="text-sm text-muted-foreground">Email: {pass.email || visitor?.email}</div>
            <div className="text-sm text-muted-foreground">Phone: {pass.phone || visitor?.phone}</div>
            <div className="text-sm text-muted-foreground">Company: {visitor?.company}</div>
          </div>
          <div className="flex-shrink-0">
            <img src={pass.qrCode} alt="QR Code" className="h-32 w-32 object-contain border" />
          </div>
        </div>

        {/* Pass Info */}
        <table className="w-full text-sm">
          <tbody>
            <tr><td className="font-medium">Pass ID:</td><td>{pass.passId}</td></tr>
            <tr><td className="font-medium">Visitor Type:</td><td>{pass.visitorType}</td></tr>
            <tr><td className="font-medium">Coming From:</td><td>{pass.comingFrom}</td></tr>
            <tr><td className="font-medium">Purpose of Visit:</td><td>{pass.purposeOfVisit}</td></tr>
            <tr><td className="font-medium">Host:</td><td>{pass.host}</td></tr>
            <tr><td className="font-medium">ID Type:</td><td>{pass.idType}</td></tr>
            <tr><td className="font-medium">Visitor ID:</td><td>{pass.visitorIdText}</td></tr>
            <tr><td className="font-medium">Check In Date:</td><td>{formatDateTime(pass.checkInDate)}</td></tr>
            <tr><td className="font-medium">Expected Check-Out:</td><td>{formatDateTime(pass.expectedCheckOutTime)}</td></tr>
            <tr><td className="font-medium">Status:</td><td>{pass.status}</td></tr>
            <tr><td className="font-medium">Notes:</td><td>{pass.notes}</td></tr>
          </tbody>
        </table>

        {/* Access / Movement History */}
        {Array.isArray(pass.movementHistory) && pass.movementHistory.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold mb-3">Access History</h3>
            <div className="max-h-60 overflow-y-auto border rounded">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left p-2 border-b">Time</th>
                    <th className="text-left p-2 border-b">Event</th>
                    <th className="text-left p-2 border-b">Access Point</th>
                    <th className="text-left p-2 border-b">Method</th>
                  </tr>
                </thead>
                <tbody>
                  {pass.movementHistory
                    .slice()
                    .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((ev: any, i: number) => (
                      <tr key={i} className="border-b">
                        <td className="p-2">{formatDateTime(ev.timestamp)}</td>
                        <td className="p-2">{ev.type === "check_in" ? "Check-In" : "Check-Out"}</td>
                        <td className="p-2">{ev.accessPointName || ev.accessPointId || "-"}</td>
                        <td className="p-2">{(ev.method || "").toUpperCase()}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* WhatsApp Message History */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-semibold">WhatsApp Message History</h3>
          </div>
          <div className="max-h-40 overflow-y-auto border rounded">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left p-2 border-b w-16">Sr No.</th>
                  <th className="text-left p-2 border-b">Time</th>
                  <th className="text-left p-2 border-b">Status</th>
                </tr>
              </thead>
              <tbody>
                {(pass.whatsappHistory && pass.whatsappHistory.length > 0) ? (
                  pass.whatsappHistory.map((msg: any, index: number) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{index + 1}</td>
                      <td className="p-2">{formatDateTime(msg.timestamp)}</td>
                      <td className={`p-2 font-medium ${msg.status === "success" ? "text-green-600" : "text-red-600"}`}>
                        {msg.status === "success" ? "Success" : "Failure"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="p-3 text-center text-gray-500">
                      No WhatsApp messages found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    {/* Edit Dialog */}
    <EditDialog
      open={editOpen}
      title="Edit Visitor Pass"
      description="Update the visitor pass details."
      entity={editEntity}
      setEntity={(entity) => {
        if (entity === null) {
          setEditOpen(false);
          setEditEntity(null);
        } else {
          setEditEntity(entity);
        }
      }}
      onSubmit={async (e) => {
        e.preventDefault();
        if (!editEntity) return;
        const formData = new FormData();

        const clone: any = { ...editEntity };
        if (clone.checkInDate) clone.checkInDate = new Date(clone.checkInDate).toISOString();
        if (clone.expectedCheckOutTime) clone.expectedCheckOutTime = new Date(clone.expectedCheckOutTime).toISOString();

        Object.entries(clone).forEach(([key, value]) => {
          if (value !== null && value !== undefined) formData.append(key, value as any);
        });
        await handleEditSave(formData);
      }}
      loading={loadingEdit}
      fields={[
        { type: "text", name: "name", label: "Name", required: true },
        { type: "select", name: "visitorType", label: "Visitor Type", options: visitorTypes },
        { type: "text", name: "comingFrom", label: "Coming From", required: true },
        { type: "select", name: "purposeOfVisit", label: "Purpose of Visit", options: purposes },
        { type: "select", name: "host", label: "Host", options: hosts },
        { type: "select", name: "idType", label: "ID Type", options: idTypes },
        { type: "text", name: "visitorIdText", label: "Visitor ID Text", required: true },
        { type: "datetime-local", name: "checkInDate", label: "Check In Date", required: true },
        { type: "datetime-local", name: "expectedCheckOutTime", label: "Expected Check-Out Time", required: true },
        { type: "email", name: "email", label: "Email" },
        { type: "text", name: "notes", label: "Notes" },
        { type: "tel", name: "phone", label: "Phone", required: true },
        { type: "file", name: "photo", label: "Photo" },
      ]}
    />

    {/* Floating Alert Modal */}
{/* {insetAlert && (
  <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
    <div className="bg-white border rounded shadow-lg p-6 max-w-sm w-full flex flex-col gap-4">
      <div className={`font-medium text-sm ${
        insetAlert.type === "success" ? "text-green-700" :
        insetAlert.type === "error" ? "text-red-700" :
        "text-blue-700"
      }`}>
        {insetAlert.message}
      </div>

      {pendingAction && (
        <div className="flex justify-end gap-2">
          <button
            className={`px-4 py-1 rounded text-white text-sm ${
              pendingAction === "checkout" ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"
            }`}
            onClick={async (e) => {
              e.stopPropagation();

              if (pendingAction === "resend") {
                try {
                  setPendingAction(null);
                  setInsetAlert({ type: "info", message: "Resending WhatsApp..." });

                  const pass = data.pass;
                  const pdfBlob = await generateVisitorPassPDF(
                    pass,
                    data.visitor,
                    data.client?.name || "",
                    clientLogoUrl,
                    clientInstructions,
                    clientAddress
                  );

                  const formData = new FormData();
                  formData.append(
                    "file",
                    new File([pdfBlob], `VisitorPass_${pass.passId}.pdf`, { type: "application/pdf" })
                  );

                  const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
                  if (!uploadRes.ok) throw new Error("Upload failed");
                  const pdfUrl = (await uploadRes.json()).url;
                  if (!pdfUrl) throw new Error("Upload did not return URL");

                  const res = await fetch("/api/send-whatsapp", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      name: pass.name,
                      number: pass.phone,
                      pdfUrl,
                      mediaName: `VisitorPass_${pass.passId}.pdf`,
                      passId: pass.passId,
                    }),
                  });

                  const result = await res.json();
                  if (res.ok) setInsetAlert({ type: "success", message: "WhatsApp message resent successfully!" });
                  else setInsetAlert({ type: "error", message: `Failed to resend: ${result.error || "Unknown error"}` });

                  const updatedRes = await fetch(`/api/visitor-pass/${pass.passId}`);
                  if (updatedRes.ok) setData(await updatedRes.json());
                } catch (err) {
                  console.error(err);
                  setInsetAlert({ type: "error", message: "Something went wrong while resending WhatsApp." });
                }
              }

              if (pendingAction === "checkout") {
                setPendingAction(null);
                setInsetAlert({ type: "info", message: "Checking out visitor..." });
                try {
                  const res = await fetch(`/api/visitor-pass/${passId}/checkout`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ method: "client" }),
                  });
                  if (!res.ok) throw new Error("Checkout failed");

                  const json = await res.json();
                  if (json?.pass) setData({ pass: json.pass, visitor: data?.visitor, client: data?.client });
                  else {
                    const updatedRes = await fetch(`/api/visitor-pass/${passId}`);
                    if (updatedRes.ok) setData(await updatedRes.json());
                  }
                  setInsetAlert({ type: "success", message: "Visitor checked out successfully!" });
                } catch (err) {
                  console.error(err);
                  setInsetAlert({ type: "error", message: "Something went wrong while checking out." });
                }
              }
            }}
          >
            Yes
          </button>

          <button
            className="px-4 py-1 bg-gray-100 text-gray-800 rounded text-sm hover:bg-gray-200"
            onClick={(e) => {
              e.stopPropagation();
              setPendingAction(null);
              setInsetAlert(null);
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {!pendingAction && (
        <button
          className="self-end text-gray-500 hover:text-gray-800 text-sm"
          onClick={() => setInsetAlert(null)}
        >
          Close
        </button>
      )}
    </div>
  </div>
)} */}

{/* Floating Alert Modal */}
{insetAlert && (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
    <div
      className={`relative w-full max-w-sm mx-4 rounded-2xl shadow-2xl border
        ${insetAlert.type === "success"
          ? "border-green-200 bg-gradient-to-b from-white to-green-50"
          : insetAlert.type === "error"
          ? "border-red-200 bg-gradient-to-b from-white to-red-50"
          : "border-blue-200 bg-gradient-to-b from-white to-blue-50"
        } transition-all duration-200`}
    >
      {/* Decorative top bar */}
      {/* <div
        className={`h-1 rounded-t-2xl ${
          insetAlert.type === "success"
            ? "bg-green-500"
            : insetAlert.type === "error"
            ? "bg-red-500"
            : "bg-blue-500"
        }`}
      ></div> */}

      {/* Soft glowing border effect */}
<div
  className={`absolute inset-0 rounded-xl pointer-events-none
    ${
      insetAlert.type === "success"
        ? "shadow-[0_0_15px_2px_rgba(16,185,129,0.5)] ring-1 ring-emerald-400/30"
        : insetAlert.type === "error"
        ? "shadow-[0_0_15px_2px_rgba(239,68,68,0.5)] ring-1 ring-red-400/30"
        : "shadow-[0_0_15px_2px_rgba(59,130,246,0.5)] ring-1 ring-blue-400/30"
    }`}
></div>


      <div className="p-6 space-y-4">
        {/* Alert Title + Message */}
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center
            ${insetAlert.type === "success" ? "bg-green-100 text-green-700" :
              insetAlert.type === "error" ? "bg-red-100 text-red-700" :
              "bg-blue-100 text-blue-700"}
          `}>
            {insetAlert.type === "success" && "✓"}
            {insetAlert.type === "error" && "⚠"}
            {insetAlert.type === "info" && "ℹ"}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-800 text-base">
              {insetAlert.type === "success"
                ? "Success"
                : insetAlert.type === "error"
                ? "Error"
                : "Confirm Action"}
            </p>
            <p className="text-sm text-gray-600 mt-1">{insetAlert.message}</p>
          </div>
        </div>

        {/* Action Buttons */}
        {pendingAction && (
          <div className="flex justify-end gap-2 pt-2">
            <button
              className={`px-4 py-2 text-sm text-white rounded-lg shadow-sm transition
                ${pendingAction === "checkout"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              onClick={async (e) => {
                e.stopPropagation();
                if (pendingAction === "resend") {
                  try {
                    setPendingAction(null);
                    setInsetAlert({ type: "info", message: "Resending WhatsApp..." });

                    const pass = data.pass;
                    const pdfBlob = await generateVisitorPassPDF(
                      pass,
                      data.visitor,
                      data.client?.name || "",
                      clientLogoUrl,
                      clientInstructions,
                      clientAddress
                    );

                    const formData = new FormData();
                    formData.append(
                      "file",
                      new File([pdfBlob], `VisitorPass_${pass.passId}.pdf`, {
                        type: "application/pdf",
                      })
                    );

                    const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
                    if (!uploadRes.ok) throw new Error("Upload failed");
                    const pdfUrl = (await uploadRes.json()).url;
                    if (!pdfUrl) throw new Error("Upload did not return URL");

                    const res = await fetch("/api/send-whatsapp", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        name: pass.name,
                        number: pass.phone,
                        pdfUrl,
                        mediaName: `VisitorPass_${pass.passId}.pdf`,
                        passId: pass.passId,
                      }),
                    });

                    const result = await res.json();
                    if (res.ok)
                      setInsetAlert({
                        type: "success",
                        message: "WhatsApp message resent successfully!",
                      });
                    else
                      setInsetAlert({
                        type: "error",
                        message: `Failed to resend: ${result.error || "Unknown error"}`,
                      });

                    const updatedRes = await fetch(`/api/visitor-pass/${pass.passId}`);
                    if (updatedRes.ok) setData(await updatedRes.json());
                  } catch (err) {
                    console.error(err);
                    setInsetAlert({
                      type: "error",
                      message: "Something went wrong while resending WhatsApp.",
                    });
                  }
                }

                if (pendingAction === "checkout") {
                  setPendingAction(null);
                  setInsetAlert({ type: "info", message: "Checking out visitor..." });
                  try {
                    const res = await fetch(`/api/visitor-pass/${passId}/checkout`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ method: "client" }),
                    });
                    if (!res.ok) throw new Error("Checkout failed");

                    const json = await res.json();
                    if (json?.pass)
                      setData({ pass: json.pass, visitor: data?.visitor, client: data?.client });
                    else {
                      const updatedRes = await fetch(`/api/visitor-pass/${passId}`);
                      if (updatedRes.ok) setData(await updatedRes.json());
                    }
                    setInsetAlert({
                      type: "success",
                      message: "Visitor checked out successfully!",
                    });
                  } catch (err) {
                    console.error(err);
                    setInsetAlert({
                      type: "error",
                      message: "Something went wrong while checking out.",
                    });
                  }
                }
              }}
            >
              Yes
            </button>

            <button
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              onClick={(e) => {
                e.stopPropagation();
                setPendingAction(null);
                setInsetAlert(null);
              }}
            >
              Cancel
            </button>
          </div>
        )}

        {!pendingAction && (
          <div className="flex justify-end pt-2">
            <button
              className="text-sm text-gray-500 hover:text-gray-800 transition"
              onClick={() => setInsetAlert(null)}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
)}



  </>
);



}
