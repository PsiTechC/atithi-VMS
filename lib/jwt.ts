// import jwt from "jsonwebtoken";

// export type Role = "super-admin" | "client-admin" | "client-user";

// export type JWTPayload = {
//     sub: string;            // user id
//     email: string;
//     role: Role;
//     clientId?: string;      // tenant
//     pv?: number;            // token version (bump on password change)
// };

// export function signAccessToken(payload: JWTPayload, expiresIn?: string | number) {
//     return jwt.sign(payload, process.env.JWT_SECRET!, {
//         expiresIn: expiresIn ?? process.env.JWT_EXPIRES ?? "8h",
//     });
// }

// export function verifyAccessToken<T = JWTPayload>(token: string): T {
//     return jwt.verify(token, process.env.JWT_SECRET!) as T;
// }
