import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/auth";
import connectDb from "../../../../lib/connectDb";
import User from "../../../../models/user";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    console.log("[Blueprint] Fetching daily blueprint");

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.warn("[Blueprint] Unauthorized GET attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDb();

    const user = await User.findOne({
      email: session.user.email.toLowerCase().trim(),
    }).lean();

    if (!user) {
      console.error("[Blueprint] User not found:", session.user.email);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return empty blueprint structure or existing blueprint from user
    const blueprint = {
      userId: user._id,
      date: new Date().toISOString().split("T")[0],
      routines: user.routines || [],
      assignments: user.assignments || [],
      microGoals: user.microGoals || [],
      focusPrediction: user.focusPrediction || null,
      createdAt: new Date(),
    };

    console.log("[Blueprint] Blueprint fetched for user:", user._id);

    return NextResponse.json(blueprint, { status: 200 });
  } catch (error) {
    console.error("[Blueprint] GET error:", {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: "Failed to fetch blueprint", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    console.log("[Blueprint] Creating/updating blueprint");

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.warn("[Blueprint] Unauthorized POST attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { routines, assignments, microGoals } = body || {};

    await connectDb();

    const user = await User.findOneAndUpdate(
      { email: session.user.email.toLowerCase().trim() },
      {
        routines: routines || [],
        assignments: assignments || [],
        microGoals: microGoals || [],
        lastBlueprintUpdate: new Date(),
      },
      { new: true }
    );

    if (!user) {
      console.error("[Blueprint] User not found:", session.user.email);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const blueprint = {
      userId: user._id,
      date: new Date().toISOString().split("T")[0],
      routines: user.routines || [],
      assignments: user.assignments || [],
      microGoals: user.microGoals || [],
      createdAt: user.lastBlueprintUpdate,
    };

    console.log("[Blueprint] Blueprint updated for user:", user._id);

    return NextResponse.json(
      { success: true, blueprint },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Blueprint] POST error:", {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: "Failed to update blueprint", details: error.message },
      { status: 500 }
    );
  }
}