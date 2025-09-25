// import jsPDF from "jspdf";

// export async function generateVisitorPassPDF(
//   pass: any,
//   visitor: any,
//   clientName: string,
//   clientLogoUrl: string | null,
//   clientInstructions: string
// ): Promise<Blob> {
//   const pdf = new jsPDF("p", "pt", "a4");
//   const pageWidth = pdf.internal.pageSize.getWidth();
//   const margin = 40;
//   let y = margin;

//   const loadImageAsBase64 = (url: string): Promise<string> =>
//     new Promise((resolve, reject) => {
//       const img = new Image();
//       img.crossOrigin = "Anonymous";
//       img.onload = () => {
//         const canvas = document.createElement("canvas");
//         canvas.width = img.width;
//         canvas.height = img.height;
//         const ctx = canvas.getContext("2d");
//         if (ctx) ctx.drawImage(img, 0, 0);
//         resolve(canvas.toDataURL("image/png"));
//       };
//       img.onerror = reject;
//       img.src = url;
//     });

//   // Border
//   pdf.setDrawColor(180);
//   pdf.setLineWidth(1);
//   pdf.rect(margin, margin, pageWidth - margin * 2, pdf.internal.pageSize.getHeight() - margin * 2);

//   // Logo
//   if (clientLogoUrl) {
//     try {
//       const logoData = await loadImageAsBase64(`/api/proxy-image?url=${encodeURIComponent(clientLogoUrl)}`);
//       pdf.addImage(logoData, "PNG", pageWidth / 2 - 40, y, 80, 40);
//     } catch {}
//   }
//   y += 55;

//   // Client Name
//   if (clientName) {
//     pdf.setFont("helvetica", "bold");
//     pdf.setFontSize(14);
//     pdf.text(clientName, pageWidth / 2, y, { align: "center" });
//   }
//   y += 30;

//   // Title
//   pdf.setFont("helvetica", "bold");
//   pdf.setFontSize(20);
//   pdf.text("Visitor Pass", pageWidth / 2, y, { align: "center" });
//   y += 40;

//   // Visitor Details
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

//   // Separator
//   textY += 20;
//   pdf.setDrawColor(180);
//   pdf.line(margin + 20, textY, pageWidth - margin - 20, textY);

//   // Instructions
//   textY += 40;
//   pdf.setFont("helvetica", "bold");
//   pdf.setFontSize(14);
//   pdf.text("General Instructions", margin + 30, textY);

//   textY += 20;
//   pdf.setFont("helvetica", "normal");
//   pdf.setFontSize(11);

//   if (clientInstructions) {
//     const lines = pdf.splitTextToSize(clientInstructions, pageWidth - margin * 2);
//     pdf.text(lines, margin + 40, textY);
//   } else {
//     pdf.text("No special instructions provided.", margin + 40, textY);
//   }

//   return pdf.output("blob"); // Return blob instead of saving
// }


import jsPDF from "jspdf";

export async function generateVisitorPassPDF(
  pass: any,
  visitor: any,
  clientName: string,
  clientLogoUrl: string | null,
  clientInstructions: string
): Promise<Blob> {
  const pdf = new jsPDF("p", "pt", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 40;
  let y = margin;

  const loadImageAsBase64 = (url: string): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
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

  // --- Outer border ---
  pdf.setDrawColor(180);
  pdf.setLineWidth(1);
  pdf.rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2);

  // --- Client Logo ---
  if (clientLogoUrl) {
    try {
      const logoData = await loadImageAsBase64(
        `/api/proxy-image?url=${encodeURIComponent(clientLogoUrl)}`
      );
      pdf.addImage(logoData, "PNG", pageWidth / 2 - 40, y, 80, 40);
    } catch {}
  }
  y += 55;

  // --- Client Name ---
  if (clientName) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text(clientName, pageWidth / 2, y, { align: "center" });
  }
  y += 30;

  // --- Title ---
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  pdf.text("Visitor Pass", pageWidth / 2, y, { align: "center" });
  y += 40;

  // --- Photo (left) & QR (right) ---
  const photoSize = 120;
  if (pass.photoUrl) {
    try {
      const imgData = await loadImageAsBase64(
        `/api/proxy-image?url=${encodeURIComponent(pass.photoUrl)}`
      );
      pdf.addImage(imgData, "JPEG", margin + 20, y, photoSize, photoSize);
    } catch (err) {
      console.error("Photo load error:", err);
    }
  }

  if (pass.qrCode) {
    try {
      const qrData = await loadImageAsBase64(pass.qrCode);
      pdf.addImage(
        qrData,
        "PNG",
        pageWidth - margin - photoSize - 20,
        y,
        photoSize,
        photoSize
      );
    } catch (err) {
      console.error("QR load error:", err);
    }
  }

  y += photoSize + 40;

  // --- Visitor Details ---
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(12);

  const details: [string, any][] = [
    ["Pass ID", pass.passId],
    ["Name", pass.name],
    ["Phone", pass.phone || visitor?.phone],
    ["Email", pass.email || visitor?.email],
    ["Visitor Type", pass.visitorType],
    ["Coming From", pass.comingFrom],
    ["Purpose of Visit", pass.purposeOfVisit],
    ["Host", pass.host],
    ["ID Type", pass.idType],
    ["Visitor ID", pass.visitorIdText],
    ["Check In Date", new Date(pass.checkInDate).toLocaleString()],
    ["Expected Check-Out", new Date(pass.expectedCheckOutTime).toLocaleString()],
    ["Status", pass.status],
    ["Notes", pass.notes || ""],
  ];

  let textY = y;
  details.forEach(([label, value]) => {
    pdf.setFont("helvetica", "bold");
    pdf.text(`${label}:`, margin + 30, textY);
    pdf.setFont("helvetica", "normal");
    pdf.text(`${value || ""}`, margin + 160, textY);
    textY += 20;
  });

  // --- Separator ---
  textY += 20;
  pdf.setDrawColor(180);
  pdf.line(margin + 20, textY, pageWidth - margin - 20, textY);

  // --- General Instructions ---
  textY += 40;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text("General Instructions", margin + 30, textY);

  textY += 20;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);

  if (clientInstructions) {
    const lines = pdf.splitTextToSize(
      clientInstructions,
      pageWidth - margin * 2
    );
    pdf.text(lines, margin + 40, textY);
  } else {
    pdf.text("No special instructions provided.", margin + 40, textY);
  }

  return pdf.output("blob");
}
