// import { NextRequest, NextResponse } from "next/server";
// import bcrypt from "bcryptjs";
// import Client from "@/models/Client";
// import { dbConnect } from "@/lib/mongodb";

// export async function POST(req: NextRequest) {
//   try {
//     await dbConnect();

//     const { email, password } = await req.json();

//     if (!email || !password) {
//       return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
//     }

//     // Find client by email
//     const client = await Client.findOne({ email: email.toLowerCase() });
//     if (!client) {
//       return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
//     }

//     // Check if password hash exists
//     if (!client.passwordHash) {
//       return NextResponse.json({ error: "No password set. Please contact administrator." }, { status: 401 });
//     }

//     // Verify password
//     const isValid = await bcrypt.compare(password, client.passwordHash);
//     if (!isValid) {
//       return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
//     }

//     // Check if client is active
//     if (!client.isActive) {
//       return NextResponse.json({ error: "Account is not active" }, { status: 403 });
//     }

//     // For simplicity, return client data (in production, use JWT or session)
//     const response = NextResponse.json({
//       success: true,
//       client: {
//         id: client._id,
//         name: client.name,
//         email: client.email,
//       },
//       redirect: "/client-dashboard/check-in"
//     });

//     // Set a simple cookie for session (in production, use secure JWT)
//     response.cookies.set("client-session", client._id.toString(), {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "strict",
//       maxAge: 60 * 60 * 24 * 7, // 7 days
//     });

//     return response;
//   } catch (error) {
//     console.error("Login error:", error);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }

// import { NextRequest, NextResponse } from "next/server";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";
// import Client from "@/models/Client";
// import { dbConnect } from "@/lib/mongodb";

// export async function POST(req: NextRequest) {
//   try {
//     await dbConnect();

//     const { email, password } = await req.json();

//     if (!email || !password) {
//       return NextResponse.json(
//         { error: "Email and password are required" },
//         { status: 400 }
//       );
//     }

//     // Find client by email
//     const client = await Client.findOne({ email: email.toLowerCase() });
//     if (!client) {
//       return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
//     }

//     // Check if password hash exists
//     if (!client.passwordHash) {
//       return NextResponse.json(
//         { error: "No password set. Please contact administrator." },
//         { status: 401 }
//       );
//     }

//     // Verify password
//     const isValid = await bcrypt.compare(password, client.passwordHash);
//     if (!isValid) {
//       return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
//     }

//     // Check if client is active
//     if (!client.isActive) {
//       return NextResponse.json(
//         { error: "Account is not active" },
//         { status: 403 }
//       );
//     }

//     // ✅ Issue JWT (role fixed as client-admin)
//     const token = jwt.sign(
//       {
//         id: client._id.toString(),
//         email: client.email,
//         role: "client-admin",
//         clientId: client._id.toString(),
//       },
//       process.env.JWT_SECRET!,
//       { expiresIn: "7d" }
//     );

//     const response = NextResponse.json({
//       success: true,
//       client: {
//         id: client._id,
//         name: client.name,
//         email: client.email,
//       },
//       token, // expose token in JSON for frontend use if needed
//       redirect: "/client-dashboard/check-in",
//     });

//     // ✅ Store JWT in cookie
//     response.cookies.set("auth-token", token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "strict",
//       maxAge: 60 * 60 * 24 * 7, // 7 days
//     });

//     return response;
//   } catch (error) {
//     console.error("Login error:", error);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }



// app/api/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Client from "@/models/Client";
import User from "@/models/User";   // <-- create this model similar to Client
import { dbConnect } from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    // If accessed directly in browser (not XHR/fetch), return generic message
    const accept = req.headers.get('accept') || '';
    if (accept.includes('text/html')) {
      return new Response('Not Found', { status: 404 });
    }

    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // 1️⃣ Try USER login first
    const user = await User.findOne({ email: email.toLowerCase() }).lean();
    if (user) {
      if (user.status !== "active") {
        return NextResponse.json({ error: "Account is not active" }, { status: 403 });
      }
      // Fetch the user's client and check status
      const client = await Client.findById(user.clientId).lean();
      if (!client || Array.isArray(client)) {
        return NextResponse.json({ error: "Client not found for user" }, { status: 403 });
      }
      if ((client as any).status === "suspended") {
        return NextResponse.json({ error: "Client account is suspended. Please contact your administrator." }, { status: 403 });
      }
      if (!user.passwordHash) {
        return NextResponse.json({ error: "No password set. Please contact administrator." }, { status: 401 });
      }

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

      // ✅ Issue JWT with role + clientId
      const token = jwt.sign(
        {
          id: String(user._id),
          email: user.email,
          role: user.role || "client-user",   // default to client-user
          clientId: String(user.clientId),    // each user belongs to a client
        },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" }
      );

      const res = NextResponse.json({
        success: true,
        role: user.role || "client-user",
        clientId: String(user.clientId),
        redirect: "/client-dashboard/check-in", // same dashboard as client
        token,
      });

      res.cookies.set("auth-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
      });

      return res;
    }

    // 2️⃣ Fallback: your existing CLIENT login (unchanged)
    const client = await Client.findOne({ email: email.toLowerCase() });
    if (!client) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (!client.passwordHash) {
      return NextResponse.json({ error: "No password set. Please contact administrator." }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, client.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (!client.isActive) {
      return NextResponse.json({ error: "Account is not active" }, { status: 403 });
    }

    // ✅ Issue JWT for client-admin
    const token = jwt.sign(
      {
        id: String(client._id),
        email: client.email,
        role: "client-admin",
        clientId: String(client._id),
      },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    const response = NextResponse.json({
      success: true,
      client: { id: client._id, name: client.name, email: client.email },
      role: "client-admin",
      redirect: "/client-dashboard/check-in",
      token,
    });

    // keep both cookies for compatibility
    response.cookies.set("client-session", client._id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7,
    });
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
