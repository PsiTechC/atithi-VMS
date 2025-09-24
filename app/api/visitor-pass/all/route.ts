// import { NextResponse } from "next/server";
// import { dbConnect } from "@/lib/mongodb";
// import VisitorPass from "@/models/VisitorPass";
// //fetch only passes that have clientId matching the logged in client

// //implement client id session and fetch passes based on that client id session


// export async function GET(req: Request) {
    
// 	try {
// 		const { searchParams } = new URL(req.url);
// 			const passId = searchParams.get("passId");
// 			await dbConnect();
// 			if (passId) {
// 				const pass = await VisitorPass.findOne({ passId }).lean();
// 				if (!pass) {
// 					return NextResponse.json({ error: "Pass not found" }, { status: 404 });
// 				}
// 				return NextResponse.json({ pass });
// 			} else {
// 				const passes = await VisitorPass.find({}).lean();
// 				return NextResponse.json({ passes });
// 			}
// 	} catch (error) {
// 		const errorMessage = typeof error === "object" && error !== null && "message" in error
// 			? (error as { message?: string }).message
// 			: "Failed to fetch pass details";
// 		return NextResponse.json({ error: errorMessage || "Failed to fetch pass details" }, { status: 500 });
// 	}
// }
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import VisitorPass from "@/models/VisitorPass";
import { requireUser } from "@/lib/auth"; // adjust path if needed
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        
        // If accessed directly in browser (not XHR/fetch), return generic message
        const accept = req.headers.get('accept') || '';
        if (accept.includes('text/html')) {
            return new Response('Not Found', { status: 404 });
        }

        // ✅ Enforce authentication and extract user from JWT
        const user = requireUser(req, ["super-admin", "client-admin", "client-user"]);

        // ❌ Safety: Client users must always be scoped to their own clientId
        if (user.role !== "super-admin" && !user.clientId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const passId = searchParams.get("passId");

        if (passId) {
            const query: any = { passId };
            // only super-admin can bypass tenant filter
            if (user.role !== "super-admin") {
                query.clientId = user.clientId;
            }

            const pass = await VisitorPass.findOne(query).lean();
            if (!pass) {
                return NextResponse.json({ error: "Pass not found" }, { status: 404 });
            }
            return NextResponse.json({ pass });
        } else {
            const query: any = {};
            if (user.role !== "super-admin") {
                query.clientId = user.clientId;
            }

            const passes = await VisitorPass.find(query).lean();
            return NextResponse.json({ passes });
        }
    } catch (error) {
        const errorMessage =
            typeof error === "object" && error !== null && "message" in error
                ? (error as { message?: string }).message
                : "Failed to fetch pass details";
        return NextResponse.json(
            { error: errorMessage || "Failed to fetch pass details" },
            { status: 500 }
        );
    }
}
