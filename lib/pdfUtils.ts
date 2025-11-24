

// //original pdf code(1)
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
//   const pageHeight = pdf.internal.pageSize.getHeight();
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
//     } catch {}
//   }
//   y += 55;

//   // --- Client Name ---
//   if (clientName) {
//     pdf.setFont("helvetica", "bold");
//     pdf.setFontSize(14);
//     pdf.text(clientName, pageWidth / 2, y, { align: "center" });
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

//   // --- Separator ---
//   textY += 20;
//   pdf.setDrawColor(180);
//   pdf.line(margin + 20, textY, pageWidth - margin - 20, textY);

//   // --- General Instructions ---
//   textY += 40;
//   pdf.setFont("helvetica", "bold");
//   pdf.setFontSize(14);
//   pdf.text("General Instructions", margin + 30, textY);

//   textY += 20;
//   pdf.setFont("helvetica", "normal");
//   pdf.setFontSize(11);

//   if (clientInstructions) {
//     const lines = pdf.splitTextToSize(
//       clientInstructions,
//       pageWidth - margin * 2
//     );
//     pdf.text(lines, margin + 40, textY);
//   } else {
//     pdf.text("No special instructions provided.", margin + 40, textY);
//   }

//   return pdf.output("blob");
// }


import jsPDF from "jspdf";

export async function generateVisitorPassPDF(
  pass: any,
  visitor: any,
  clientName: string,
  clientLogoUrl: string | null,
  clientInstructions: string,
  clientAddress?: string
): Promise<Blob> {
  // Quarter A4 (10.5 cm × 14.85 cm) ≈ [298 pt, 421 pt]
  const pdf = new jsPDF("p", "pt", [298, 421]);
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 18;
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

    // Format date as DD/MM/YYYY HH:MM
    const formatDateTime = (value?: any) => {
      if (!value) return "";
      const d = new Date(value);
      if (isNaN(d.getTime())) return "";
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    };

  // --- Border ---
  pdf.setDrawColor(180);
  pdf.setLineWidth(0.8);
  pdf.rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2);

  // --- Logo ---
  if (clientLogoUrl) {
    try {
      const logoData = await loadImageAsBase64(
        `/api/proxy-image?url=${encodeURIComponent(clientLogoUrl)}`
      );
      pdf.addImage(logoData, "PNG", pageWidth / 2 - 25, y+3, 50, 25);
    } catch {}
  }
  y += 35;

  // --- Client Name ---
  if (clientName) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text(clientName, pageWidth / 2, y, { align: "center" });
    y += 12;
  }

  // --- Client Address ---
  if (clientAddress) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    const addrLines: string[] = pdf.splitTextToSize(clientAddress, 180);
    addrLines.forEach((line: string, i: number) =>
      pdf.text(line, pageWidth / 2, y + i * 10, { align: "center" })
    );
    y += addrLines.length * 10 + 5;
  }

  // --- Title ---
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text("Visitor Pass", pageWidth / 2, y, { align: "center" });
  y += 15;

  // --- Layout setup ---
  const leftX = margin + 10;
  const rightX = pageWidth - margin - 70;
  const imageSize = 60; // ✅ same for photo and QR
  let textY = y + 5;

  // --- Visitor Details (Left side) ---
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  const details: [string, any][] = [
    ["Pass ID", pass.passId],
    ["Name", pass.name],
    ["Phone", pass.phone || visitor?.phone],
    ["Visitor Type", pass.visitorType],
    ["Coming From", pass.comingFrom],
    ["Purpose", pass.purposeOfVisit],
    ["Host", pass.host],
    ["Check-In", formatDateTime(pass.checkInDate)],
    ["Expected Check-Out", formatDateTime(pass.expectedCheckOutTime)],
  ];

  details.forEach(([label, value]) => {
    pdf.setFont("helvetica", "bold");
    pdf.text(`${label}:`, leftX, textY);
    pdf.setFont("helvetica", "normal");
    pdf.text(`${value || ""}`, leftX + 80, textY);
    textY += 11;
  });

  // --- Photo + QR (Right side) ---
  let imgY = y + 5;
  if (pass.photoUrl) {
    try {
      const imgData = await loadImageAsBase64(
        `/api/proxy-image?url=${encodeURIComponent(pass.photoUrl)}`
      );
      pdf.addImage(imgData, "JPEG", rightX, imgY, imageSize, imageSize);
    } catch {}
  }
  imgY += imageSize + 8;

  if (pass.qrCode) {
    try {
      const qrData = await loadImageAsBase64(pass.qrCode);
      pdf.addImage(qrData, "PNG", rightX, imgY, imageSize, imageSize);
    } catch {}
  }

  // --- Signature Section (Horizontal) ---
  let sigY = textY + 60; // compact spacing
  const sigWidth = 70;
  const spacing = 12;
  const startX = margin + 10;

  pdf.setDrawColor(160);
  pdf.setLineWidth(0.7);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);

  const sigLabels = ["Host Sign", "Authorised Sign", "Visitor Sign"];
  sigLabels.forEach((label, idx) => {
    const x = startX + idx * (sigWidth + spacing);
    pdf.line(x, sigY, x + sigWidth, sigY);
    pdf.text(label, x + sigWidth / 2, sigY + 10, { align: "center" });
  });

  // --- Separator ---
  sigY += 20;
  pdf.setDrawColor(180);
  pdf.line(margin + 5, sigY, pageWidth - margin - 5, sigY);

  // --- General Instructions ---
  let instrY = sigY + 10;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.text("General Instructions:", margin + 10, instrY);

  instrY += 12;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);

  // ✅ FIX: Wrap text safely inside margins
  const usableWidth = pageWidth - margin * 2 - 10; // reduce by 10 to avoid edge overflow
  const lines = pdf.splitTextToSize(
    clientInstructions || "No special instructions provided.",
    usableWidth
  );

  pdf.text(lines, margin + 10, instrY, {
    maxWidth: usableWidth,
    align: "left",
  });

  return pdf.output("blob");
}