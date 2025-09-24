// import { NextRequest, NextResponse } from 'next/server';
// import { dbConnect } from '@/lib/mongodb';
// import Purpose from '@/models/Purpose';
// import { requireUser } from '@/lib/auth';

// export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
//   try {
//     await dbConnect();
//     const user = await requireUser(request);
//     if (!user || !user.clientId) {
//       return NextResponse.json({ error: 'Authentication required. Please log in again.' }, { status: 401 });
//     }
//     const purpose = await Purpose.findOne({ _id: params.id, clientId: user.clientId });
//     if (!purpose) {
//       return NextResponse.json({ error: 'Purpose not found' }, { status: 404 });
//     }
//     return NextResponse.json(purpose);
//   } catch (error: any) {
//     console.error('Error fetching purpose:', error);
//     return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
//   }
// }

// export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
//   try {
//     await dbConnect();
//     const user = await requireUser(request);
//     if (!user || !user.clientId) {
//       return NextResponse.json({ error: 'Authentication required. Please log in again.' }, { status: 401 });
//     }
//     const body = await request.json();
//     const { name, description } = body;
//     if (!name) {
//       return NextResponse.json({ error: 'Name is required' }, { status: 400 });
//     }
//     const purpose = await Purpose.findOneAndUpdate(
//       { _id: params.id, clientId: user.clientId },
//       { name, description },
//       { new: true, runValidators: true }
//     );
//     if (!purpose) {
//       return NextResponse.json({ error: 'Purpose not found' }, { status: 404 });
//     }
//     return NextResponse.json(purpose);
//   } catch (error: any) {
//     console.error('Error updating purpose:', error);
//     if (error.code === 11000) {
//       return NextResponse.json({ error: 'Purpose with this name already exists' }, { status: 409 });
//     }
//     return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
//   }
// }

// export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
//   try {
//     await dbConnect();
//     const user = await requireUser(request);
//     if (!user || !user.clientId) {
//       return NextResponse.json({ error: 'Authentication required. Please log in again.' }, { status: 401 });
//     }
//     const purpose = await Purpose.findOneAndDelete({ _id: params.id, clientId: user.clientId });
//     if (!purpose) {
//       return NextResponse.json({ error: 'Purpose not found' }, { status: 404 });
//     }
//     return NextResponse.json({ message: 'Purpose deleted successfully' });
//   } catch (error: any) {
//     console.error('Error deleting purpose:', error);
//     return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
//   }
// }



// import { NextRequest, NextResponse } from "next/server";
// import { dbConnect } from "@/lib/mongodb";
// import Purpose from "@/models/Purpose";
// import { requireUser } from "@/lib/auth";

// export async function GET(
//   request: NextRequest,
//   context: { params: { id: string } }
// ) {
//   try {
//     await dbConnect();
//     const user = await requireUser(request);
//     if (!user || !user.clientId) {
//       return NextResponse.json(
//         { error: "Authentication required. Please log in again." },
//         { status: 401 }
//       );
//     }

//     const purpose = await Purpose.findOne({
//       _id: context.params.id,
//       clientId: user.clientId,
//     });
//     if (!purpose) {
//       return NextResponse.json({ error: "Purpose not found" }, { status: 404 });
//     }
//     return NextResponse.json(purpose);
//   } catch (error: any) {
//     console.error("Error fetching purpose:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }

// export async function PUT(
//   request: NextRequest,
//   context: { params: { id: string } }
// ) {
//   try {
//     await dbConnect();
//     const user = await requireUser(request);
//     if (!user || !user.clientId) {
//       return NextResponse.json(
//         { error: "Authentication required. Please log in again." },
//         { status: 401 }
//       );
//     }

//     const body = await request.json();
//     const { name, description } = body;

//     if (!name) {
//       return NextResponse.json({ error: "Name is required" }, { status: 400 });
//     }

//     const purpose = await Purpose.findOneAndUpdate(
//       { _id: context.params.id, clientId: user.clientId },
//       { name, description },
//       { new: true, runValidators: true }
//     );

//     if (!purpose) {
//       return NextResponse.json({ error: "Purpose not found" }, { status: 404 });
//     }

//     return NextResponse.json(purpose);
//   } catch (error: any) {
//     console.error("Error updating purpose:", error);
//     if (error.code === 11000) {
//       return NextResponse.json(
//         { error: "Purpose with this name already exists" },
//         { status: 409 }
//       );
//     }
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }

// export async function DELETE(
//   request: NextRequest,
//   context: { params: { id: string } }
// ) {
//   try {
//     await dbConnect();
//     const user = await requireUser(request);
//     if (!user || !user.clientId) {
//       return NextResponse.json(
//         { error: "Authentication required. Please log in again." },
//         { status: 401 }
//       );
//     }

//     const purpose = await Purpose.findOneAndDelete({
//       _id: context.params.id,
//       clientId: user.clientId,
//     });
//     if (!purpose) {
//       return NextResponse.json({ error: "Purpose not found" }, { status: 404 });
//     }

//     return NextResponse.json({ message: "Purpose deleted successfully" });
//   } catch (error: any) {
//     console.error("Error deleting purpose:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }

import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Purpose from "@/models/Purpose";
import { requireUser } from "@/lib/auth";

export async function GET(request: Request, context: any) {
  try {
    await dbConnect();
    const user = await requireUser(request as any);
    if (!user || !user.clientId) {
      return NextResponse.json(
        { error: "Authentication required. Please log in again." },
        { status: 401 }
      );
    }

    const { id } = context?.params || {};
    const purpose = await Purpose.findOne({ _id: id, clientId: user.clientId });
    if (!purpose) {
      return NextResponse.json({ error: "Purpose not found" }, { status: 404 });
    }
    return NextResponse.json(purpose);
  } catch (error: any) {
    console.error("Error fetching purpose:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request, context: any) {
  try {
    await dbConnect();
    const user = await requireUser(request as any);
    if (!user || !user.clientId) {
      return NextResponse.json(
        { error: "Authentication required. Please log in again." },
        { status: 401 }
      );
    }

    const { id } = context?.params || {};
    const { name, description } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const purpose = await Purpose.findOneAndUpdate(
      { _id: id, clientId: user.clientId },
      { name, description },
      { new: true, runValidators: true }
    );

    if (!purpose) {
      return NextResponse.json({ error: "Purpose not found" }, { status: 404 });
    }

    return NextResponse.json(purpose);
  } catch (error: any) {
    console.error("Error updating purpose:", error);
    if (error?.code === 11000) {
      return NextResponse.json(
        { error: "Purpose with this name already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: any) {
  try {
    await dbConnect();
    const user = await requireUser(request as any);
    if (!user || !user.clientId) {
      return NextResponse.json(
        { error: "Authentication required. Please log in again." },
        { status: 401 }
      );
    }

    const { id } = context?.params || {};
    const purpose = await Purpose.findOneAndDelete({ _id: id, clientId: user.clientId });
    if (!purpose) {
      return NextResponse.json({ error: "Purpose not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Purpose deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting purpose:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
