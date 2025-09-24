// import { NextRequest, NextResponse } from 'next/server';
// import { dbConnect } from '@/lib/mongodb';
// import IdType from '@/models/IdType';
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

//     const idType = await IdType.findById(params.id);
//     if (!idType) {
//       return NextResponse.json({ error: 'ID Type not found' }, { status: 404 });
//     }

//     return NextResponse.json(idType);
//   } catch (error: any) {
//     console.error('Error fetching ID type:', error);
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
//     const { name, description, required } = body;

//     if (!name) {
//       return NextResponse.json({ error: 'Name is required' }, { status: 400 });
//     }

//     const idType = await IdType.findByIdAndUpdate(
//       params.id,
//       { name, description, required },
//       { new: true, runValidators: true }
//     );

//     if (!idType) {
//       return NextResponse.json({ error: 'ID Type not found' }, { status: 404 });
//     }

//     return NextResponse.json(idType);
//   } catch (error: any) {
//     console.error('Error updating ID type:', error);
//     if (error.code === 11000) {
//       return NextResponse.json({ error: 'ID Type with this name already exists' }, { status: 409 });
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

//     const idType = await IdType.findByIdAndDelete(params.id);
//     if (!idType) {
//       return NextResponse.json({ error: 'ID Type not found' }, { status: 404 });
//     }

//     return NextResponse.json({ message: 'ID Type deleted successfully' });
//   } catch (error: any) {
//     console.error('Error deleting ID type:', error);
//     return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
//   }
// }


// import { NextRequest, NextResponse } from "next/server";
// import { dbConnect } from "@/lib/mongodb";
// import IdType from "@/models/IdType";
// import { requireUser } from "@/lib/auth";

// export async function GET(
//   request: NextRequest,
//   context: { params: { id: string } }
// ) {
//   try {
//     await dbConnect();

//     try {
//       requireUser(request, ["client-admin"]);
//     } catch {
//       return NextResponse.json(
//         { error: "Authentication required. Please log in again." },
//         { status: 401 }
//       );
//     }

//     const idType = await IdType.findById(context.params.id);
//     if (!idType) {
//       return NextResponse.json({ error: "ID Type not found" }, { status: 404 });
//     }

//     return NextResponse.json(idType);
//   } catch (error: any) {
//     console.error("Error fetching ID type:", error);
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

//     try {
//       requireUser(request, ["client-admin"]);
//     } catch {
//       return NextResponse.json(
//         { error: "Authentication required. Please log in again." },
//         { status: 401 }
//       );
//     }

//     const body = await request.json();
//     const { name, description, required } = body;

//     if (!name) {
//       return NextResponse.json({ error: "Name is required" }, { status: 400 });
//     }

//     const idType = await IdType.findByIdAndUpdate(
//       context.params.id,
//       { name, description, required },
//       { new: true, runValidators: true }
//     );

//     if (!idType) {
//       return NextResponse.json({ error: "ID Type not found" }, { status: 404 });
//     }

//     return NextResponse.json(idType);
//   } catch (error: any) {
//     console.error("Error updating ID type:", error);
//     if (error.code === 11000) {
//       return NextResponse.json(
//         { error: "ID Type with this name already exists" },
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

//     try {
//       requireUser(request, ["client-admin"]);
//     } catch {
//       return NextResponse.json(
//         { error: "Authentication required. Please log in again." },
//         { status: 401 }
//       );
//     }

//     const idType = await IdType.findByIdAndDelete(context.params.id);
//     if (!idType) {
//       return NextResponse.json({ error: "ID Type not found" }, { status: 404 });
//     }

//     return NextResponse.json({ message: "ID Type deleted successfully" });
//   } catch (error: any) {
//     console.error("Error deleting ID type:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import IdType from "@/models/IdType";
import { requireUser } from "@/lib/auth";

export async function GET(request: NextRequest, context: any) {
  try {
    await dbConnect();

    let user;
    try {
      user = requireUser(request, ["client-admin"]);
    } catch {
      return NextResponse.json(
        { error: "Authentication required. Please log in again." },
        { status: 401 }
      );
    }

    const idType = await IdType.findById(context.params.id);
    if (!idType) {
      return NextResponse.json({ error: "ID Type not found" }, { status: 404 });
    }

    return NextResponse.json(idType);
  } catch (error: any) {
    console.error("Error fetching ID type:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: any) {
  try {
    await dbConnect();

    let user;
    try {
      user = requireUser(request, ["client-admin"]);
    } catch {
      return NextResponse.json(
        { error: "Authentication required. Please log in again." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, required } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const idType = await IdType.findByIdAndUpdate(
      context.params.id,
      { name, description, required },
      { new: true, runValidators: true }
    );

    if (!idType) {
      return NextResponse.json({ error: "ID Type not found" }, { status: 404 });
    }

    return NextResponse.json(idType);
  } catch (error: any) {
    console.error("Error updating ID type:", error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "ID Type with this name already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: any) {
  try {
    await dbConnect();

    let user;
    try {
      user = requireUser(request, ["client-admin"]);
    } catch {
      return NextResponse.json(
        { error: "Authentication required. Please log in again." },
        { status: 401 }
      );
    }

    const idType = await IdType.findByIdAndDelete(context.params.id);
    if (!idType) {
      return NextResponse.json({ error: "ID Type not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "ID Type deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting ID type:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
