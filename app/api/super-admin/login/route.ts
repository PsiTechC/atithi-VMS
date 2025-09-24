import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const superEmail = process.env.SUPERADMIN_EMAIL;
    const superPassword = process.env.SUPERADMIN_PASSWORD;

    if (!superEmail || !superPassword) {
      return NextResponse.json({ error: "Super admin credentials not set in environment." }, { status: 500 });
    }

    if (email !== superEmail || password !== superPassword) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    // Issue JWT
    const token = jwt.sign(
      {
        id: "superadmin",
        email: superEmail,
        role: "super-admin"
      },
      process.env.JWT_SECRET!,
      { expiresIn: "1d" }
    );

    return NextResponse.json({ token, role: "super-admin" });
  } catch (error) {
    return NextResponse.json({ error: "Login failed." }, { status: 500 });
  }
}
