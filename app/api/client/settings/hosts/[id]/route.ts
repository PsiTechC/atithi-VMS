


// import { NextRequest, NextResponse } from "next/server";
// import { dbConnect } from "@/lib/mongodb";
// import Host from "@/models/Host";
// import { requireUser } from "@/lib/auth";
// import { saveFileToLocal } from "@/lib/localStorage";
// function getIdFromUrl(request: NextRequest): string | null {
//   const url = new URL(request.url);
//   return url.pathname.split("/").pop() || null;
// }

// export async function GET(request: NextRequest) {
//   try {
//     await dbConnect();

//     // JWT authentication
//     try {
//       requireUser(request, ["client-admin"]);
//     } catch {
//       return NextResponse.json(
//         { error: "Authentication required. Please log in again." },
//         { status: 401 }
//       );
//     }

//     const id = getIdFromUrl(request);
//     if (!id) {
//       return NextResponse.json({ error: "Host ID is required" }, { status: 400 });
//     }

//     const host = await Host.findById(id);
//     if (!host) {
//       return NextResponse.json({ error: "Host not found" }, { status: 404 });
//     }

//     return NextResponse.json(host);
//   } catch (error: any) {
//     console.error("Error fetching host:", error);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }

// export async function PUT(request: NextRequest) {
//   try {
//     await dbConnect();

//     // 🔐 Auth
//     let clientId;
//     try {
//       clientId = requireUser(request, ["client-admin"]).clientId;
//     } catch {
//       return NextResponse.json(
//         { error: "Authentication required. Please log in again." },
//         { status: 401 }
//       );
//     }

//     const id = getIdFromUrl(request);
//     if (!id) {
//       return NextResponse.json({ error: "Host ID is required" }, { status: 400 });
//     }

//     // ⬅️ Parse multipart form data
//     const formData = await request.formData();
//     const name = formData.get("name") as string;
//     const department = formData.get("department") as string;
//     const email = formData.get("email") as string;
//     const phone = formData.get("phone") as string;
//     const isActive = formData.get("isActive") === "true";
//     const approvalRequired = formData.get("approvalRequired") === "true";
//     const bloodGroup = (formData.get("bloodGroup") as string) || undefined;

//     if (!name || !department || !email) {
//       return NextResponse.json(
//         { error: "Name, department, and email are required" },
//         { status: 400 }
//       );
//     }

//     // Fetch the existing host to get the old image URL
//     const existingHost = await Host.findOne({ _id: id, clientId });
//     if (!existingHost) {
//       return NextResponse.json(
//         { error: "Host not found or not authorized" },
//         { status: 404 }
//       );
//     }

//     // ✅ Handle image upload to R2
//     let imageUrl: string | undefined;
//     const file = formData.get("image") as File | null;
//     if (file && file.size > 0) {
//       imageUrl = await saveFileToLocal(file, "Hosts");
//     }

//     const updateData: any = {
//       name,
//       department,
//       email,
//       phone,
//       isActive,
//       approvalRequired,
//       bloodGroup,
//     };

//     if (imageUrl) {
//       updateData.imageUrl = imageUrl;
//     }

//     const host = await Host.findOneAndUpdate(
//       { _id: id, clientId },
//       updateData,
//       { new: true, runValidators: true }
//     );

//     if (!host) {
//       return NextResponse.json(
//         { error: "Host not found or not authorized" },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json(host);
//   } catch (error: any) {
//     console.error("Error updating host:", error);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }

// export async function DELETE(request: NextRequest) {
//   try {
//     await dbConnect();

//     // JWT authentication
//     try {
//       requireUser(request, ["client-admin"]);
//     } catch {
//       return NextResponse.json(
//         { error: "Authentication required. Please log in again." },
//         { status: 401 }
//       );
//     }

//     const id = getIdFromUrl(request);
//     if (!id) {
//       return NextResponse.json({ error: "Host ID is required" }, { status: 400 });
//     }

//     const host = await Host.findByIdAndDelete(id);
//     if (!host) {
//       return NextResponse.json({ error: "Host not found" }, { status: 404 });
//     }

//     return NextResponse.json({ message: "Host deleted successfully" });
//   } catch (error: any) {
//     console.error("Error deleting host:", error);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }



import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Host from "@/models/Host";
import { requireUser } from "@/lib/auth";
import { saveFileToLocal } from "@/lib/localStorage";

function getIdFromUrl(request: NextRequest): string | null {
  const url = new URL(request.url);
  return url.pathname.split("/").pop() || null;
}

// ✅ GET host by ID
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    try {
      requireUser(request, ["client-admin"]);
    } catch {
      return NextResponse.json(
        { error: "Authentication required. Please log in again." },
        { status: 401 }
      );
    }

    const id = getIdFromUrl(request);
    if (!id) {
      return NextResponse.json({ error: "Host ID is required" }, { status: 400 });
    }

    const host = await Host.findById(id);
    if (!host) {
      return NextResponse.json({ error: "Host not found" }, { status: 404 });
    }

    return NextResponse.json(host);
  } catch (error: any) {
    console.error("Error fetching host:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ✅ PUT — Update host (supports multiple phone numbers)
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();

    // 🔐 Auth
    let clientId;
    try {
      clientId = requireUser(request, ["client-admin"]).clientId;
    } catch {
      return NextResponse.json(
        { error: "Authentication required. Please log in again." },
        { status: 401 }
      );
    }

    const id = getIdFromUrl(request);
    if (!id) {
      return NextResponse.json({ error: "Host ID is required" }, { status: 400 });
    }

    // ⬅️ Parse multipart form data
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const department = formData.get("department") as string;
    const email = formData.get("email") as string;

    // 🧩 Multi-phone support
    let phones: string[] = [];
    const singlePhone = formData.get("phone") as string | null;
    const phonesArray = formData.getAll("phones[]") as string[];

    if (phonesArray && phonesArray.length > 0) {
      phones = phonesArray.filter((p) => p.trim() !== "");
    } else if (singlePhone && singlePhone.trim() !== "") {
      phones = [singlePhone];
    }

    const isActive = formData.get("isActive") === "true";
    const approvalRequired = formData.get("approvalRequired") === "true";
    const bloodGroup =
      (formData.get("bloodGroup") as string) || undefined;

    if (!name || !department || !email) {
      return NextResponse.json(
        { error: "Name, department, and email are required" },
        { status: 400 }
      );
    }

    // Fetch the existing host to get the old image URL
    const existingHost = await Host.findOne({ _id: id, clientId });
    if (!existingHost) {
      return NextResponse.json(
        { error: "Host not found or not authorized" },
        { status: 404 }
      );
    }

    // ✅ Handle image upload (R2/local)
    let imageUrl: string | undefined;
    const file = formData.get("image") as File | null;
    if (file && file.size > 0) {
      imageUrl = await saveFileToLocal(file, "Hosts");
    }

    // ✅ Build update object
    const updateData: any = {
      name,
      department,
      email,
      phones,            // 👈 updated here
      isActive,
      approvalRequired,
      bloodGroup,
    };

    if (imageUrl) {
      updateData.imageUrl = imageUrl;
    }

    const host = await Host.findOneAndUpdate(
      { _id: id, clientId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!host) {
      return NextResponse.json(
        { error: "Host not found or not authorized" },
        { status: 404 }
      );
    }

    return NextResponse.json(host);
  } catch (error: any) {
    console.error("Error updating host:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ✅ DELETE host by ID
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();

    try {
      requireUser(request, ["client-admin"]);
    } catch {
      return NextResponse.json(
        { error: "Authentication required. Please log in again." },
        { status: 401 }
      );
    }

    const id = getIdFromUrl(request);
    if (!id) {
      return NextResponse.json({ error: "Host ID is required" }, { status: 400 });
    }

    const host = await Host.findByIdAndDelete(id);
    if (!host) {
      return NextResponse.json({ error: "Host not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Host deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting host:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
