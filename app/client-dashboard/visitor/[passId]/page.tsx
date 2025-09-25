
"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import jsPDF from "jspdf";
import { generateVisitorPassPDF } from "@/lib/pdfUtils";    

const loadImageAsBase64 = (url: string): Promise<string> =>
    new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous"; // important for CORS
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            if (ctx) ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = reject;
        img.src = url;
    });


export default function VisitorDetailsPage() {
  const { passId } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clientLogoUrl, setClientLogoUrl] = useState<string | null>(null);
  const [clientInstructions, setClientInstructions] = useState<string>("");

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
      } catch (err) {
        setError("Failed to fetch visitor details");
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [passId]);


//     const handleExportPDF = async () => {
//   if (!data || !data.pass) return;
//   const pass = data.pass;
//   const visitor = data.visitor;

//   const pdf = new jsPDF("p", "pt", "a4");
//   const pageWidth = pdf.internal.pageSize.getWidth();
//   const pageHeight = pdf.internal.pageSize.getHeight();
//   const margin = 40;
//   let y = margin;

//   // --- Outer border ---
//   pdf.setDrawColor(180);
//   pdf.setLineWidth(1);
//   pdf.rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2);

//   // --- Client Logo ---
//   if (clientLogoUrl) {
//     try {
//       const logoData = await loadImageAsBase64(
//         `/api/proxy-image?url=${encodeURIComponent(clientLogoUrl)}`
//       );
//       pdf.addImage(logoData, "PNG", pageWidth / 2 - 40, y, 80, 40);
//     } catch (err) {
//       console.error("Logo load error:", err);
//     }
//   }
//   y += 55;

//   // --- Client Name ---
//   if (data?.client?.name) {
//     pdf.setFont("helvetica", "bold");
//     pdf.setFontSize(14);
//     pdf.text(data.client.name, pageWidth / 2, y, { align: "center" });
//   }
//   y += 30;

//   // --- Title ---
//   pdf.setFont("helvetica", "bold");
//   pdf.setFontSize(20);
//   pdf.text("Visitor Pass", pageWidth / 2, y, { align: "center" });
//   y += 40;

//   // --- Photo (left) & QR (right) ---
//   const photoSize = 120;
//   if (pass.photoUrl) {
//     try {
//       const imgData = await loadImageAsBase64(
//         `/api/proxy-image?url=${encodeURIComponent(pass.photoUrl)}`
//       );
//       pdf.addImage(imgData, "JPEG", margin + 20, y, photoSize, photoSize);
//     } catch (err) {
//       console.error("Photo load error:", err);
//     }
//   }

//   if (pass.qrCode) {
//     try {
//       const qrData = await loadImageAsBase64(pass.qrCode);
//       pdf.addImage(
//         qrData,
//         "PNG",
//         pageWidth - margin - photoSize - 20,
//         y,
//         photoSize,
//         photoSize
//       );
//     } catch (err) {
//       console.error("QR load error:", err);
//     }
//   }

//   y += photoSize + 40;

//   // --- Visitor Details ---
//   pdf.setFont("helvetica", "normal");
//   pdf.setFontSize(12);

//   const details: [string, any][] = [
//     ["Pass ID", pass.passId],
//     ["Name", pass.name],
//     ["Phone", pass.phone || visitor?.phone],
//     ["Email", pass.email || visitor?.email],
//     ["Visitor Type", pass.visitorType],
//     ["Coming From", pass.comingFrom],
//     ["Purpose of Visit", pass.purposeOfVisit],
//     ["Host", pass.host],
//     ["ID Type", pass.idType],
//     ["Visitor ID", pass.visitorIdText],
//     ["Check In Date", new Date(pass.checkInDate).toLocaleString()],
//     // ["Check Out Date", new Date(pass.checkOutDate).toLocaleString()],
//     ["Expected Check-Out", new Date(pass.expectedCheckOutTime).toLocaleString()],
//     ["Status", pass.status],
//     ["Notes", pass.notes || ""],
//   ];

//   let textY = y;
//   details.forEach(([label, value]) => {
//     pdf.setFont("helvetica", "bold");
//     pdf.text(`${label}:`, margin + 30, textY);
//     pdf.setFont("helvetica", "normal");
//     pdf.text(`${value || ""}`, margin + 160, textY);
//     textY += 20;
//   });


//    // --- Separator line ---
//   textY += 20;
//   pdf.setDrawColor(180);
//   pdf.setLineWidth(0.5);
//   pdf.line(margin + 20, textY, pageWidth - margin - 20, textY);


//   // --- ✅ General Instructions Section ---
//   textY += 40;
//   pdf.setFont("helvetica", "bold");
//   pdf.setFontSize(14);
//   pdf.text("General Instructions", margin + 30, textY);

//   textY += 20;
//   pdf.setFont("helvetica", "normal");
//   pdf.setFontSize(11);

// // Use clientInstructions from state

//     if (clientInstructions) {
//         // If client has multiline instructions, split into lines
//         const lines = pdf.splitTextToSize(clientInstructions, pageWidth - margin * 2);
//         pdf.text(lines, margin + 40, textY);
//         textY += lines.length * 15;
//     } else {
//         pdf.text("No special instructions provided.", margin + 40, textY);
//         textY += 15;
//     }

//   pdf.save(`VisitorPass_${pass.passId}.pdf`);
// };


const handleExportPDF = async () => {
  if (!data || !data.pass) return;
  const pdfBlob = await generateVisitorPassPDF(
    data.pass,
    data.visitor,
    data.client?.name || "",
    clientLogoUrl,
    clientInstructions
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

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
            <button
                type="button"
                className="mb-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium"
                onClick={() => window.history.back()}
            >
                &larr; Go Back
            </button>

            {/* Export Button */}
            <button
                type="button"
                onClick={handleExportPDF}
                className="mb-4 ml-2 px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
            >
                Export as PDF
            </button>

            <h2 className="text-2xl font-bold mb-4">Visitor Pass Details</h2>
            <div className="flex gap-6 items-center mb-6">
                <img
                    src={pass.photoUrl || "/uploads/default-avatar.png"}
                    alt="Visitor Photo"
                    className="h-32 w-32 rounded-full object-cover border"
                />
                <div className="flex flex-col gap-1 flex-1">
                    <div className="font-semibold text-lg">{pass.name}</div>
                    <div className="text-sm text-muted-foreground">
                        Email: {pass.email || visitor?.email}
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Phone: {pass.phone || visitor?.phone}
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Company: {visitor?.company}
                    </div>
                </div>
                <div className="flex-shrink-0">
                    <img
                        src={pass.qrCode}
                        alt="QR Code"
                        className="h-32 w-32 object-contain border"
                    />
                </div>
            </div>
            <table className="w-full text-sm mb-6">
                <tbody>
                    <tr><td className="font-medium">Pass ID:</td><td>{pass.passId}</td></tr>
                    <tr><td className="font-medium">Visitor Type:</td><td>{pass.visitorType}</td></tr>
                    <tr><td className="font-medium">Coming From:</td><td>{pass.comingFrom}</td></tr>
                    <tr><td className="font-medium">Purpose of Visit:</td><td>{pass.purposeOfVisit}</td></tr>
                    <tr><td className="font-medium">Host:</td><td>{pass.host}</td></tr>
                    <tr><td className="font-medium">ID Type:</td><td>{pass.idType}</td></tr>
                    <tr><td className="font-medium">Visitor ID Text:</td><td>{pass.visitorIdText}</td></tr>
                    <tr><td className="font-medium">Check In Date:</td><td>{new Date(pass.checkInDate).toLocaleString()}</td></tr>
                    {/* <tr><td className="font-medium">Check Out Date:</td><td>{new Date(pass.checkOutDate).toLocaleString()}</td></tr> */}
                    <tr><td className="font-medium">Expected Check-Out:</td><td>{new Date(pass.expectedCheckOutTime).toLocaleString()}</td></tr>
                    <tr><td className="font-medium">Status:</td><td>{pass.status}</td></tr>
                    <tr><td className="font-medium">Notes:</td><td>{pass.notes}</td></tr>
                </tbody>
            </table>


      {/* Access / Movement History */}
      {Array.isArray(pass.movementHistory) && pass.movementHistory.length > 0 ? (
        <>
          <h3 className="text-xl font-semibold mb-3">Access History</h3>
          <table className="w-full text-sm border rounded">
            <thead className="bg-gray-50">
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
                .sort((a:any,b:any)=> new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .map((ev:any, i:number) => (
                <tr key={i} className="border-b">
                  <td className="p-2">{new Date(ev.timestamp).toLocaleString()}</td>
                  <td className="p-2">{ev.type === 'check_in' ? 'Check-In' : 'Check-Out'}</td>
                  <td className="p-2">{ev.accessPointName || ev.accessPointId || '-'}</td>
                  <td className="p-2">{(ev.method || '').toUpperCase()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : null}
        </div>
    );
}
