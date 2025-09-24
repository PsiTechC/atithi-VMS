
// export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
//   try {
//     await dbConnect();
//     const user = await requireUser(request);
//     if (!user || !user.clientId) {
//       return NextResponse.json({ error: 'Authentication required. Please log in again.' }, { status: 401 });
//     }
//     const visitorType = await VisitorType.findOne({ _id: params.id, clientId: user.clientId });
//     if (!visitorType) {
//       return NextResponse.json({ error: 'Visitor Type not found' }, { status: 404 });
//     }
//     return NextResponse.json(visitorType);
//   } catch (error: any) {
//     console.error('Error fetching visitor type:', error);
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
//     const { name, description, color, accessLevel } = body;
//     if (!name) {
//       return NextResponse.json({ error: 'Name is required' }, { status: 400 });
//     }
//     const visitorType = await VisitorType.findOneAndUpdate(
//       { _id: params.id, clientId: user.clientId },
//       { name, description, color, accessLevel },
//       { new: true, runValidators: true }
//     );
//     if (!visitorType) {
//       return NextResponse.json({ error: 'Visitor Type not found' }, { status: 404 });
//     }
//     return NextResponse.json(visitorType);
//   } catch (error: any) {
//     console.error('Error updating visitor type:', error);
//     if (error.code === 11000) {
//       return NextResponse.json({ error: 'Visitor Type with this name already exists' }, { status: 409 });
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
//     const visitorType = await VisitorType.findOneAndDelete({ _id: params.id, clientId: user.clientId });
//     if (!visitorType) {
//       return NextResponse.json({ error: 'Visitor Type not found' }, { status: 404 });
//     }
//     return NextResponse.json({ message: 'Visitor Type deleted successfully' });
//   } catch (error: any) {
//     console.error('Error deleting visitor type:', error);
//     return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
//   }
// }
// import { NextRequest, NextResponse } from 'next/server';
// import { dbConnect } from '@/lib/mongodb';
// import VisitorType from '@/models/VisitorType';
// import { requireUser } from '@/lib/auth';


// import { NextRequest, NextResponse } from "next/server";
// import { dbConnect } from "@/lib/mongodb";
// import VisitorType from "@/models/VisitorType";
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

//     const visitorType = await VisitorType.findOne({
//       _id: context.params.id,
//       clientId: user.clientId,
//     });
//     if (!visitorType) {
//       return NextResponse.json(
//         { error: "Visitor Type not found" },
//         { status: 404 }
//       );
//     }
//     return NextResponse.json(visitorType);
//   } catch (error: any) {
//     console.error("Error fetching visitor type:", error);
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
//     const { name, description, color, accessLevel } = body;

//     if (!name) {
//       return NextResponse.json({ error: "Name is required" }, { status: 400 });
//     }

//     const visitorType = await VisitorType.findOneAndUpdate(
//       { _id: context.params.id, clientId: user.clientId },
//       { name, description, color, accessLevel },
//       { new: true, runValidators: true }
//     );

//     if (!visitorType) {
//       return NextResponse.json(
//         { error: "Visitor Type not found" },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json(visitorType);
//   } catch (error: any) {
//     console.error("Error updating visitor type:", error);
//     if (error.code === 11000) {
//       return NextResponse.json(
//         { error: "Visitor Type with this name already exists" },
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

//     const visitorType = await VisitorType.findOneAndDelete({
//       _id: context.params.id,
//       clientId: user.clientId,
//     });
//     if (!visitorType) {
//       return NextResponse.json(
//         { error: "Visitor Type not found" },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json({
//       message: "Visitor Type deleted successfully",
//     });
//   } catch (error: any) {
//     console.error("Error deleting visitor type:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }


import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import VisitorType from "@/models/VisitorType";
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
    const visitorType = await VisitorType.findOne({ _id: id, clientId: user.clientId });
    if (!visitorType) {
      return NextResponse.json({ error: "Visitor Type not found" }, { status: 404 });
    }
    return NextResponse.json(visitorType);
  } catch (error: any) {
    console.error("Error fetching visitor type:", error);
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
    const { name, description, color, accessLevel } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const visitorType = await VisitorType.findOneAndUpdate(
      { _id: id, clientId: user.clientId },
      { name, description, color, accessLevel },
      { new: true, runValidators: true }
    );

    if (!visitorType) {
      return NextResponse.json({ error: "Visitor Type not found" }, { status: 404 });
    }

    return NextResponse.json(visitorType);
  } catch (error: any) {
    console.error("Error updating visitor type:", error);
    if (error?.code === 11000) {
      return NextResponse.json(
        { error: "Visitor Type with this name already exists" },
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
    const visitorType = await VisitorType.findOneAndDelete({ _id: id, clientId: user.clientId });
    if (!visitorType) {
      return NextResponse.json({ error: "Visitor Type not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Visitor Type deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting visitor type:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
