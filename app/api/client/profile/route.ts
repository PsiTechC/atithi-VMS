
import { NextResponse } from "next/server";
import Client from "@/models/Client";
import { dbConnect } from "@/lib/mongodb";
import { requireUser } from "@/lib/auth"; // your helper

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/client/profile -> get current client profile (logo, name, etc) */
export async function GET(req: Request) {
  await dbConnect();

  // If accessed directly in browser (not XHR/fetch), return generic message
  const accept = req.headers.get('accept') || '';
  if (accept.includes('text/html')) {
    return new Response('Not Found', { status: 404 });
  }

  try {
    // ✅ Allow both client-admin and client-user
    const user = requireUser(req as any, ["client-admin", "client-user"]);

    if (!user.clientId) {
      return NextResponse.json({ error: "Client ID not found" }, { status: 401 });
    }

    const client = await Client.findById(user.clientId);
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // ✅ Return only safe fields
    return NextResponse.json({
      name: client.name,
      logoUrl: client.logoUrl || null,
      email: client.email,
      address: client.address || "",
      instructions: client.instructions || "",
      status: client.status,
      liscenseStart: client.liscenseStart,
      liscenseEnd: client.liscenseEnd
    });
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
