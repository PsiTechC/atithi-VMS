

// import { NextRequest, NextResponse } from "next/server";
// import { dbConnect } from "@/lib/mongodb";
// import Host from "@/models/Host";
// import { requireUser } from "@/lib/auth";
// import { uploadBufferToR2, hostImageKey } from "@/lib/r2";

// export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
//   try {
//     await dbConnect();

//     // JWT authentication
//     try {
//       requireUser(request, ["client-admin"]);
//     } catch {
//       return NextResponse.json({ error: "Authentication required. Please log in again." }, { status: 401 });
//     }

//     const host = await Host.findById(params.id);
//     if (!host) {
//       return NextResponse.json({ error: 'Host not found' }, { status: 404 });
//     }

//     return NextResponse.json(host);
//   } catch (error: any) {
//     console.error('Error fetching host:', error);
//     return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
//   }
// }


// export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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
//     const existingHost = await Host.findOne({ _id: params.id, clientId });
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
//       const buffer = Buffer.from(await file.arrayBuffer());
//       const key = hostImageKey(name, { type: file.type, name: file.name });
//       const { url } = await uploadBufferToR2({
//         buffer,
//         key,
//         contentType: file.type,
//       });
//       imageUrl = url;

//       // Delete the old image from R2 if it exists and is different
//       if (existingHost.imageUrl && existingHost.imageUrl !== imageUrl) {
//         try {
//           // Import your R2 delete util here
//           const { deleteFromR2 } = await import("@/lib/r2");
//           await deleteFromR2(existingHost.imageUrl);
//         } catch (err) {
//           console.error("Failed to delete old image from R2", err);
//         }
//       }
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
//       { _id: params.id, clientId },
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


// export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
//   try {
//     await dbConnect();

//     // JWT authentication
//     try {
//       requireUser(request, ["client-admin"]);
//     } catch {
//       return NextResponse.json({ error: "Authentication required. Please log in again." }, { status: 401 });
//     }

//     const host = await Host.findByIdAndDelete(params.id);
//     if (!host) {
//       return NextResponse.json({ error: 'Host not found' }, { status: 404 });
//     }

//     return NextResponse.json({ message: 'Host deleted successfully' });
//   } catch (error: any) {
//     console.error('Error deleting host:', error);
//     return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
//   }
// }


import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Host from "@/models/Host";
import { requireUser } from "@/lib/auth";
//import { uploadFileToR2Public } from "@/lib/r2";
//import { uploadBufferToR2, hostImageKey } from "@/lib/r2";
import { saveFileToLocal } from "@/lib/localStorage";
function getIdFromUrl(request: NextRequest): string | null {
  const url = new URL(request.url);
  return url.pathname.split("/").pop() || null;
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // JWT authentication
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
    const phone = formData.get("phone") as string;
    const isActive = formData.get("isActive") === "true";
    const approvalRequired = formData.get("approvalRequired") === "true";
    const bloodGroup = (formData.get("bloodGroup") as string) || undefined;

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

    // ✅ Handle image upload to R2
    let imageUrl: string | undefined;
    const file = formData.get("image") as File | null;
    if (file && file.size > 0) {
      imageUrl = await saveFileToLocal(file, "Hosts");

      // const buffer = Buffer.from(await file.arrayBuffer());
      // const key = hostImageKey(name, { type: file.type, name: file.name });
      // const { url } = await uploadBufferToR2({
      //   buffer,
      //   key,
      //   contentType: file.type,
      // });
      // imageUrl = url;
      
      
      //imageUrl = await uploadFileToR2Public(file, "Hosts");

      // Delete the old image from R2 if it exists and is different
      // if (existingHost.imageUrl && existingHost.imageUrl !== imageUrl) {
      //   try {
      //     const { deleteFromR2 } = await import("@/lib/r2");
      //     await deleteFromR2(existingHost.imageUrl);
      //   } catch (err) {
      //     console.error("Failed to delete old image from R2", err);
      //   }
      // }
    }

    const updateData: any = {
      name,
      department,
      email,
      phone,
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

export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();

    // JWT authentication
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
