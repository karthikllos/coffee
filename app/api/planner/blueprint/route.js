import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/auth";
import connectDb from "../../../../lib/connectDb";
import User from "../../../../models/user";

export const dynamic = "force-dynamic";

// Validate blueprint data
function validateBlueprint(data) {
  const errors = [];

  if (data.routines && !Array.isArray(data.routines)) {
    errors.push("routines must be an array");
  }

  if (data.assignments && !Array.isArray(data.assignments)) {
    errors.push("assignments must be an array");
  }

  if (data.microGoals && !Array.isArray(data.microGoals)) {
    errors.push("microGoals must be an array");
  }

  return errors;
}

export async function GET(request) {
  try {
    console.log("[Blueprint] 📋 Fetching daily blueprint");

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.warn("[Blueprint] ❌ Unauthorized GET attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDb();

    const user = await User.findOne({
      email: session.user.email.toLowerCase().trim(),
    })
      .select("_id dailyBlueprint")
      .lean();

    if (!user) {
      console.error("[Blueprint] ❌ User not found:", session.user.email);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return existing blueprint or empty structure
    const blueprint = user.dailyBlueprint || {
      userId: user._id,
      date: new Date().toISOString().split("T")[0],
      routines: [],
      assignments: [],
      microGoals: [],
      focusPrediction: null,
      createdAt: new Date(),
    };

    console.log("[Blueprint] ✅ Blueprint fetched for user:", user._id);

    return NextResponse.json(
      { success: true, blueprint },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Blueprint] ❌ GET error:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch blueprint", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    console.log("[Blueprint] 📝 Creating/updating blueprint");

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.warn("[Blueprint] ❌ Unauthorized POST attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { routines = [], assignments = [], microGoals = [], focusPrediction } = body || {};

    // Validate input
    const validationErrors = validateBlueprint({
      routines,
      assignments,
      microGoals,
    });

    if (validationErrors.length > 0) {
      console.warn("[Blueprint] ⚠️ Validation errors:", validationErrors);
      return NextResponse.json(
        { error: "Validation failed", details: validationErrors },
        { status: 400 }
      );
    }

    await connectDb();

    const blueprint = {
      date: new Date().toISOString().split("T")[0],
      routines,
      assignments,
      microGoals,
      focusPrediction,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const user = await User.findOneAndUpdate(
      { email: session.user.email.toLowerCase().trim() },
      {
        dailyBlueprint: blueprint,
        lastBlueprintUpdate: new Date(),
      },
      { new: true, runValidators: true }
    ).select("_id dailyBlueprint");

    if (!user) {
      console.error("[Blueprint] ❌ User not found:", session.user.email);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("[Blueprint] ✅ Blueprint updated for user:", user._id);

    return NextResponse.json(
      {
        success: true,
        message: "Blueprint updated successfully",
        blueprint: user.dailyBlueprint,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Blueprint] ❌ POST error:", error.message);
    return NextResponse.json(
      { error: "Failed to update blueprint", details: error.message },
      { status: 500 }
    );
  }
}