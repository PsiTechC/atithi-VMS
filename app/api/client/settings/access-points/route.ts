// import { NextRequest, NextResponse } from 'next/server';
// import { dbConnect } from '@/lib/mongodb';
// import AccessPoint from '@/models/AccessPoint';

// export async function GET(request: NextRequest) {
//   try {
//     await dbConnect();

//     // Get client ID from cookie
//     const clientSession = request.cookies.get("client-session");
//     if (!clientSession || !clientSession.value) {
//       return NextResponse.json({ error: "Authentication required. Please log in again." }, { status: 401 });
//     }
//     const clientId = clientSession.value;

//     // Only return access points for the logged-in client
//     const accessPoints = await AccessPoint.find({ clientId }).sort({ createdAt: -1 });
//     return NextResponse.json(accessPoints);
//   } catch (error: any) {
//     console.error('Error fetching access points:', error);
//     return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
//   }
// }

// export async function POST(request: NextRequest) {
//   try {
//     await dbConnect();

//     // Get client ID from cookie
//     const clientSession = request.cookies.get("client-session");
//     if (!clientSession || !clientSession.value) {
//       return NextResponse.json({ error: "Authentication required. Please log in again." }, { status: 401 });
//     }
//     const clientId = clientSession.value;

//     const body = await request.json();
//     const { name, description, location, active } = body;

//     if (!name) {
//       return NextResponse.json({ error: 'Name is required' }, { status: 400 });
//     }

//     const accessPoint = new AccessPoint({
//       name,
//       description,
//       location,
//       active: active !== undefined ? active : true,
//       clientId
//     });

//     await accessPoint.save();
//     return NextResponse.json(accessPoint, { status: 201 });
//   } catch (error: any) {
//     console.error('Error creating access point:', error);
//     if (error.code === 11000) {
//       return NextResponse.json({ error: 'Access Point with this name already exists' }, { status: 409 });
//     }
//     return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
//   }
// }
import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import AccessPoint from '@/models/AccessPoint';
import { requireUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Use JWT for authentication
    let clientId;
    try {
      // Allow both client-admin and client-user to access
      const user = requireUser(request, ["client-admin", "client-user"]);
      clientId = user.clientId;
    } catch {
      return NextResponse.json({ error: "Authentication required. Please log in again." }, { status: 401 });
    }

  // Only return access points for the logged-in client
  const accessPoints = await AccessPoint.find({ clientId }).sort({ createdAt: -1 });
    return NextResponse.json(accessPoints);
  } catch (error: any) {
    console.error('Error fetching access points:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Use JWT for authentication
    let clientId;
    try {
      const user = requireUser(request, ["client-admin"]);
      clientId = user.clientId;
    } catch {
      return NextResponse.json({ error: "Authentication required. Please log in again." }, { status: 401 });
    }

  const body = await request.json();
  // Debug incoming payload to help trace missing deviceId issues
  console.log('Create AccessPoint payload:', body);
  const { name, description, location, active } = body;

  // Detect deviceId in body case-insensitively (client might send deviceID or other variant)
  let deviceId: string | null = null;
  if (body && typeof body === 'object') {
    const key = Object.keys(body).find((k) => k.toLowerCase() === 'deviceid');
    if (key) {
      const raw = (body as any)[key];
      if (raw !== null && raw !== undefined && String(raw).trim() !== '') {
        deviceId = String(raw).trim();
      } else {
        deviceId = null;
      }
    }
  }
  console.log('Normalized deviceId:', deviceId);

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const accessPoint = new AccessPoint({
      name,
      description,
      location,
      deviceId: deviceId,
      active: active !== undefined ? active : true,
      clientId
    });

    const saved = await accessPoint.save();
    // Log the saved plain object to verify persisted fields (deviceId etc.)
    try {
      console.log('Saved AccessPoint (toObject):', saved.toObject());
    } catch (e) {
      console.log('Saved AccessPoint (raw):', saved);
    }
    // Return the saved object so client can inspect persisted fields
    return NextResponse.json(saved, { status: 201 });
  } catch (error: any) {
    console.error('Error creating access point:', error);
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Access Point with this name already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}