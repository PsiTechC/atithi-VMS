// import { NextRequest } from "next/server";
// import { verifyAccessToken } from "@/lib/jwt";
// import type { Role, JWTPayload } from "@/lib/jwt";

// export function requireUser(req: NextRequest, roles?: Role[]) {
//     const auth = req.headers.get("authorization") || "";
//     const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
//     if (!token) throw new Error("Unauthorized: missing token");

//     const user = verifyAccessToken<JWTPayload>(token);
//     if (roles && !roles.includes(user.role)) throw new Error("Forbidden");
//     return user; // { sub, email, role, clientId, pv }
// }
