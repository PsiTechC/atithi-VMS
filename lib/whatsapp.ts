

const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY as string;

interface WhatsAppResponse {
  status: "success" | "error";
  result?: any;
  error?: string;
}

export async function sendingWhatsapp(
  name: string,
  number: string,
  pdfUrl: string,
  mediaName: string = "VisitorPass.pdf"
): Promise<WhatsAppResponse> {
  const apiUrl = "https://whatsapp-api-backend-production.up.railway.app/api/send-message";

  const requestBody = {
    to_number: number,
    media_url: pdfUrl,
    media_name: mediaName,
    parameters: [name],
    template_name: "atithi_v2",
    whatsapp_request_type: "TEMPLATE_WITH_DOCUMENT",
  };

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": WHATSAPP_API_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errMsg = `HTTP error! Status: ${response.status}`;
      console.error(`❌ Error sending document message to ${number}:`, errMsg);


  // Log error (mailFailWs removed)
  console.error(`Mail failure for WhatsApp to ${number}: ${errMsg}`);

      throw new Error(errMsg);
    }

    const result = await response.json();
    console.log(`✅ Document message sent successfully to ${number}:`, result);
    return { status: "success", result };
  } catch (error: any) {
    const errMsg = error?.message || "Unknown server error";
    console.error(`❌ Exception while sending document message to ${number}:`, errMsg);


  // Log error (mailFailWs removed)
  console.error(`Mail failure for WhatsApp to ${number}: ${errMsg}`);

    return { status: "error", error: errMsg };
  }
}
