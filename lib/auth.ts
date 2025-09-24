import { NextRequest } from "next/server"
import jwt from "jsonwebtoken"


export type SessionUser = {
    id: string
    email: string
    role: "super-admin" | "client-admin" | "client-user"
    clientId?: string
}


// export function requireUser(req: NextRequest, roles?: SessionUser["role"][]) {
//     const hdr = req.headers.get("authorization") || ""
//     const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null
//     if (!token) throw new Error("Missing bearer token")


//     const payload = jwt.verify(token, process.env.JWT_SECRET!) as SessionUser
//     if (!payload) throw new Error("Invalid token")


//     if (roles && !roles.includes(payload.role)) throw new Error("Forbidden")
//     return payload
// }

export function requireUser(req: NextRequest, roles?: SessionUser["role"][]) {
    let token: string | null = null;

    // Check Authorization header
    const hdr = req.headers.get("authorization") || "";
    if (hdr.startsWith("Bearer ")) {
        token = hdr.slice(7);
    }

    // ✅ Fallback: check cookies
    if (!token) {
        const cookieToken = req.cookies.get("auth-token")?.value;
        if (cookieToken) token = cookieToken;
    }

    if (!token) throw new Error("Missing bearer token");

    const payload = jwt.verify(token, process.env.JWT_SECRET!) as SessionUser;
    if (!payload) throw new Error("Invalid token");

    if (roles && !roles.includes(payload.role)) throw new Error("Forbidden");
    return payload;
}
