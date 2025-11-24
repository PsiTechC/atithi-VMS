
// import { NextRequest, NextResponse } from "next/server";
// import { dbConnect } from "@/lib/mongodb";
// import Host from "@/models/Host";
// import { requireUser } from "@/lib/auth";
// import { saveFileToLocal } from "@/lib/localStorage";
// // ✅ GET all hosts for client
// export async function GET(request: NextRequest) {
//   try {
//     await dbConnect();
    
//     const user = await requireUser(request);
//     if (!user || !user.clientId) {
//       return NextResponse.json({ error: "Authentication required. Please log in again." }, { status: 401 });
//     }
//     // Only return hosts for the logged-in client
//     const hosts = await Host.find({ clientId: user.clientId }).sort({ createdAt: -1 });
//     return NextResponse.json(hosts);
//   } catch (error: any) {
//     console.error("Error fetching hosts:", error);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }

// // ✅ POST create host
// export async function POST(request: NextRequest) {
//   try {
//     await dbConnect();

//     let clientId;
//     try {
//       clientId = requireUser(request, ["client-admin"]).clientId;
//     } catch {
//       return NextResponse.json(
//         { error: "Authentication required. Please log in again." },
//         { status: 401 }
//       );
//     }

//     const formData = await request.formData();
//     const name = formData.get("name") as string;
//     const department = formData.get("department") as string;
//     const email = formData.get("email") as string;
//     const phone = formData.get("phone") as string;
//     const isActive = formData.get("isActive") === "true";
//     const bloodGroupRaw = formData.get("bloodGroup");
//     const bloodGroup =
//       bloodGroupRaw && bloodGroupRaw !== "" ? (bloodGroupRaw as string) : undefined;

//     const approvalRequired = formData.get("approvalRequired") === "true";

//     if (!name || !department || !email) {
//       return NextResponse.json(
//         { error: "Name, department, and email are required" },
//         { status: 400 }
//       );
//     }

//     // ✅ Handle image upload to R2
//     let imageUrl = "";
//     const file = formData.get("image") as File | null;
//     if (file && file.size > 0) {

      
//     imageUrl = await saveFileToLocal(file, "Hosts");  

//     }

//     const host = new Host({
//       name,
//       department,
//       email,
//       phone,
//       imageUrl,
//       isActive,
//       bloodGroup,
//       approvalRequired,
//       clientId,
//     });

//     await host.save();
//     return NextResponse.json(host, { status: 201 });
//   } catch (error: any) {
//     console.error("Error creating host:", error);
//     if (error.code === 11000) {
//       return NextResponse.json(
//         { error: "Host with this email already exists" },
//         { status: 409 }
//       );
//     }
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }


import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Host from "@/models/Host";
import { requireUser } from "@/lib/auth";
import { saveFileToLocal } from "@/lib/localStorage";

// ✅ GET all hosts for client
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const user = await requireUser(request);
    if (!user || !user.clientId) {
      return NextResponse.json(
        { error: "Authentication required. Please log in again." },
        { status: 401 }
      );
    }

    // Only return hosts for the logged-in client
    const hosts = await Host.find({ clientId: user.clientId }).sort({
      createdAt: -1,
    });
    return NextResponse.json(hosts);
  } catch (error: any) {
    console.error("Error fetching hosts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ✅ POST create host (multi-phone support)
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    let clientId;
    try {
      clientId = requireUser(request, ["client-admin"]).clientId;
    } catch {
      return NextResponse.json(
        { error: "Authentication required. Please log in again." },
        { status: 401 }
      );
    }

    const formData = await request.formData();

    const name = formData.get("name") as string;
    const department = formData.get("department") as string;
    const email = formData.get("email") as string;

    // 🧩 Multi-phone support (handles both single and array)
    let phones: string[] = [];
    const phone = formData.get("phone") as string | null;
    const phonesArray = formData.getAll("phones[]") as string[];

    if (phonesArray && phonesArray.length > 0) {
      phones = phonesArray.filter((p) => p.trim() !== "");
    } else if (phone && phone.trim() !== "") {
      phones = [phone];
    }

    const isActive = formData.get("isActive") === "true";
    const approvalRequired = formData.get("approvalRequired") === "true";
    const bloodGroupRaw = formData.get("bloodGroup");
    const bloodGroup =
      bloodGroupRaw && bloodGroupRaw !== "" ? (bloodGroupRaw as string) : undefined;

    if (!name || !department || !email) {
      return NextResponse.json(
        { error: "Name, department, and email are required" },
        { status: 400 }
      );
    }

    // ✅ Handle image upload (R2/local)
    let imageUrl = "";
    const file = formData.get("image") as File | null;
    if (file && file.size > 0) {
      imageUrl = await saveFileToLocal(file, "Hosts");
    }

    // ✅ Create Host document
    const host = new Host({
      name,
      department,
      email,
      phones, // 👈 store array
      imageUrl,
      isActive,
      bloodGroup,
      approvalRequired,
      clientId,
    });

    await host.save();
    return NextResponse.json(host, { status: 201 });
  } catch (error: any) {
    console.error("Error creating host:", error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Host with this email already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
