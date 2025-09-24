
import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import { requireUser } from "@/lib/auth";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendUserInviteMail } from "@/lib/mailer"; // 🔹 add a mailer helper for users
import type { IClient as ClientType } from "@/models/Client";

export const dynamic = "force-dynamic";


// PATCH /api/users/password: Change own password
export async function PATCH(req: NextRequest) {
    try {
        await dbConnect();
        const me = requireUser(req, ["client-admin", "client-user"]);
        const { oldPassword, newPassword } = await req.json();
        if (!oldPassword || !newPassword) {
            return NextResponse.json({ error: "Old and new password are required" }, { status: 400 });
        }
        const user = await User.findById(me.id);
        if (!user || !user.passwordHash) {
            return NextResponse.json({ error: "User not found or password not set" }, { status: 404 });
        }
        const valid = await bcrypt.compare(oldPassword, user.passwordHash);
        if (!valid) {
            return NextResponse.json({ error: "Old password is incorrect" }, { status: 401 });
        }
        const newHash = await bcrypt.hash(newPassword, 12);
        user.passwordHash = newHash;
        await user.save();
        return NextResponse.json({ success: true });
    } catch (err: any) {
        const msg = err?.message || "Failed to change password";
        const status =
            msg === "Missing bearer token" || msg === "Invalid token"
                ? 401
                : msg === "Forbidden"
                    ? 403
                    : 500;
        return NextResponse.json({ error: msg }, { status });
    }
}
