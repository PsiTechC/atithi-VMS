import { NextRequest, NextResponse } from "next/server";
import { otpStore } from "@/lib/otpStore";
import { sendOtpWhatsapp } from "@/lib/whatsapp";
import { dbConnect } from "@/lib/mongodb";

// Helper function to get client name from session
async function getClientName(req: NextRequest): Promise<string> {
  try {
    // Get client ID from cookie session
    const clientSession = req.cookies.get("client-session");
    const clientId = clientSession?.value;

    if (!clientId) {
      return "Visitor Management"; // Fallback if no session
    }

    // Connect to database and fetch client
    await dbConnect();
    const Client = (await import("@/models/Client")).default;
    const client = await Client.findById(clientId).select("name").lean<{ name: string }>();

    // Return client name or fallback
    return client?.name || "Visitor Management";
  } catch (error) {
    console.error("Error fetching client name:", error);
    return "Visitor Management"; // Fallback on error
  }
}

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber } = await req.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return NextResponse.json(
        { error: "Invalid phone number format" },
        { status: 400 }
      );
    }

    // Check rate limiting
    const { canSend, message } = otpStore.canSendOTP(phoneNumber);
    if (!canSend) {
      return NextResponse.json(
        { error: message },
        { status: 429 }
      );
    }

    // Get client name from session
    const clientName = await getClientName(req);

    // Generate OTP
    const otp = otpStore.generateOTP();

    // Send OTP via WhatsApp with client name in header
    const result = await sendOtpWhatsapp(phoneNumber, otp, clientName);

    if (result.status === "error") {
      return NextResponse.json(
        { error: "Failed to send OTP. Please try again." },
        { status: 500 }
      );
    }

    // Store OTP
    otpStore.setOTP(phoneNumber, otp);

    console.log(`✅ OTP sent to ${phoneNumber}: ${otp} | Client: ${clientName}`); // Remove in production

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully to your WhatsApp number"
    });

  } catch (error: any) {
    console.error("❌ send-otp route error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send OTP" },
      { status: 500 }
    );
  }
}
