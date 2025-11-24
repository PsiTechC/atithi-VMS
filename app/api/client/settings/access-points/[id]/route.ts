// import { NextRequest, NextResponse } from 'next/server';
// import { dbConnect } from '@/lib/mongodb';
// import AccessPoint from '@/models/AccessPoint';
// import { requireUser } from '@/lib/auth';

// export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
//   try {
//     await dbConnect();

//     // JWT authentication
//     try {
//       requireUser(request, ["client-admin"]);
//     } catch {
//       return NextResponse.json({ error: "Authentication required. Please log in again." }, { status: 401 });
//     }

//     const accessPoint = await AccessPoint.findById(params.id);
//     if (!accessPoint) {
//       return NextResponse.json({ error: 'Access Point not found' }, { status: 404 });
//     }

//     return NextResponse.json(accessPoint);
//   } catch (error: any) {
//     console.error('Error fetching access point:', error);
//     return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
//   }
// }

// export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
//   try {
//     await dbConnect();

//     // JWT authentication
//     try {
//       requireUser(request, ["client-admin"]);
//     } catch {
//       return NextResponse.json({ error: "Authentication required. Please log in again." }, { status: 401 });
//     }

//     const body = await request.json();
//     const { name, description, location, active } = body;

//     if (!name) {
//       return NextResponse.json({ error: 'Name is required' }, { status: 400 });
//     }

//     const accessPoint = await AccessPoint.findByIdAndUpdate(
//       params.id,
//       { name, description, location, active },
//       { new: true, runValidators: true }
//     );

//     if (!accessPoint) {
//       return NextResponse.json({ error: 'Access Point not found' }, { status: 404 });
//     }

//     return NextResponse.json(accessPoint);
//   } catch (error: any) {
//     console.error('Error updating access point:', error);
//     if (error.code === 11000) {
//       return NextResponse.json({ error: 'Access Point with this name already exists' }, { status: 409 });
//     }
//     return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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

//     const accessPoint = await AccessPoint.findByIdAndDelete(params.id);
//     if (!accessPoint) {
//       return NextResponse.json({ error: 'Access Point not found' }, { status: 404 });
//     }

//     return NextResponse.json({ message: 'Access Point deleted successfully' });
//   } catch (error: any) {
//     console.error('Error deleting access point:', error);
//     return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
//   }
// }


import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import AccessPoint from "@/models/AccessPoint";
import { requireUser } from "@/lib/auth";

function getIdFromUrl(request: NextRequest) {
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
      return NextResponse.json({ error: "Access Point ID is required" }, { status: 400 });
    }

    const accessPoint = await AccessPoint.findById(id);
    if (!accessPoint) {
      return NextResponse.json({ error: "Access Point not found" }, { status: 404 });
    }

    return NextResponse.json(accessPoint);
  } catch (error: any) {
    console.error("Error fetching access point:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
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
      return NextResponse.json({ error: "Access Point ID is required" }, { status: 400 });
    }

  const body = await request.json();
  const { name, description, location, active, deviceId } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const accessPoint = await AccessPoint.findByIdAndUpdate(
      id,
      { name, description, location, active, deviceId: deviceId ?? null },
      { new: true, runValidators: true }
    );

    if (!accessPoint) {
      return NextResponse.json({ error: "Access Point not found" }, { status: 404 });
    }

    return NextResponse.json(accessPoint);
  } catch (error: any) {
    console.error("Error updating access point:", error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Access Point with this name already exists" },
        { status: 409 }
      );
    }
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
      return NextResponse.json({ error: "Access Point ID is required" }, { status: 400 });
    }

    const accessPoint = await AccessPoint.findByIdAndDelete(id);
    if (!accessPoint) {
      return NextResponse.json({ error: "Access Point not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Access Point deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting access point:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
