// // app/api/super-admin/clients/[id]/invite/route.ts
// import { NextResponse } from 'next/server';
// import { Types } from 'mongoose';
// import bcrypt from 'bcryptjs';
// import Client from '@/models/Client';
// import { dbConnect } from '@/lib/mongodb';
// import { transporter } from '@/lib/mailer';

// function genPassword(length = 12) {
//     const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
//     return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
// }

// export async function POST(req, { params }) {
//     await dbConnect();
//     const { id } = params;
//     if (!Types.ObjectId.isValid(id)) {
//         return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
//     }

//     const client = await Client.findById(id);
//     if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
//     if (!client.email) return NextResponse.json({ error: "Client has no contact email" }, { status: 400 });

//     // prevent overwrite unless explicitly requested
//     const url = new URL(req.url);
//     const overwrite = url.searchParams.get("overwrite") === "true";
//     if (client.passwordHash && !overwrite) {
//         return NextResponse.json({ error: "Password already set. Use ?overwrite=true to regenerate." }, { status: 409 });
//     }

//     const plainPassword = genPassword();
//     const hash = await bcrypt.hash(plainPassword, 10);

//     client.passwordHash = hash;
//     client.passwordSetAt = new Date();
//     await client.save();

//     const origin = process.env.APP_ORIGIN || 'http://localhost:3000';
//     const loginUrl = `${origin}/client/login`;

//     const html = `
//     <h2>Your Client Access</h2>
//     <p>Hi ${client.name},</p>
//     <p>Your account is ready. Use these credentials to log in:</p>
//     <ul>
//       <li><strong>Login link:</strong> <a href="${loginUrl}">${loginUrl}</a></li>
//       <li><strong>Email:</strong> ${client.email}</li>
//       <li><strong>Password:</strong> ${plainPassword}</li>
//     </ul>
//     <p>Keep this email safe. You can change the password from your profile at any time.</p>
//   `;

//     await transporter.sendMail({
//         from: process.env.SMTP_USER,
//         to: client.email,
//         subject: "Your Client Login – Visitor Management",
//         html,
//     });

//     return NextResponse.json({ ok: true });
// }


import { NextResponse } from "next/server";
import { Types } from "mongoose";
import bcrypt from "bcryptjs";

import { dbConnect } from "@/lib/mongodb";
import Client from "@/models/Client";
import { sendInviteEmail } from "@/lib/mailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Generate a strong but readable default password (if not already set)
function genPassword(len = 12) {
    const a = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const b = "abcdefghjkmnpqrstuvwxyz";
    const c = "23456789";
    const d = "!@#$%^&*";
    const dict = a + b + c + d;
    let out = "";
    for (let i = 0; i < len; i++) {
        out += dict[Math.floor(Math.random() * dict.length)];
    }
    return out;
}

export async function POST(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();

        const { id } = await params;
        if (!Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: "Invalid id" }, { status: 400 });
        }

        const client = await Client.findById(id);
        if (!client) {
            return NextResponse.json({ error: "Client not found" }, { status: 404 });
        }

        // Use existing plainPassword if available, else generate new
        let plainPassword: string;

        if (client.plainPassword) {
            plainPassword = client.plainPassword;
        } else {
            plainPassword = genPassword(12);
            const hash = await bcrypt.hash(plainPassword, 12);
            client.passwordHash = hash;
            client.passwordSetAt = new Date();
            client.plainPassword = plainPassword;
            await client.save();
        }

        // Build login URL (adjust the path to your actual login route)
        const base = process.env.APP_BASE_URL || "http://localhost:3000";
        const loginUrl = `${base}/login`;

        try {
            console.log(`[Mailer] Sending invite email to ${client.email}...`);
            await sendInviteEmail({
                to: client.email,
                clientName: client.name,
                loginUrl,
                emailForLogin: client.email,
                plainPassword,
            });
            console.log(`[Mailer] Invite email sent to ${client.email}`);
        } catch (mailErr) {
            console.error(`[Mailer] Failed to send invite email to ${client.email}:`, mailErr);
        }

        return NextResponse.json({ ok: true });
    } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to send invite";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
