import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../../lib/auth";
import User from "../../../../../models/user";
import connectDb from "../../../../../lib/connectDb";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    console.log("[Credits] Deducting credits");

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { creditsNeeded, feature } = body || {};

    if (!creditsNeeded || creditsNeeded <= 0) {
      return NextResponse.json(
        { error: "Invalid credit amount" },
        { status: 400 }
      );
    }

    await connectDb();

    const user = await User.findOne({
      email: session.user.email.toLowerCase().trim(),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is Premium (unlimited)
    if (user.subscriptionPlan === "Premium") {
      console.log("[Credits] Premium user - unlimited access:", {
        userId: user._id,
        feature,
      });
      return NextResponse.json(
        {
          success: true,
          message: "Premium user - unlimited access",
          available: 99999,
          used: user.creditsUsed || 0,
          isPremium: true,
        },
        { status: 200 }
      );
    }

    const available = (user.credits || 0) - (user.creditsUsed || 0);

    if (available < creditsNeeded) {
      console.warn("[Credits] Insufficient credits:", {
        userId: user._id,
        available,
        needed: creditsNeeded,
      });
      return NextResponse.json(
        {
          error: "Insufficient credits",
          available,
          needed: creditsNeeded,
        },
        { status: 402 }
      );
    }

    // Deduct credits
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        $inc: { creditsUsed: creditsNeeded },
      },
      { new: true }
    );

    const newAvailable = (updatedUser.credits || 0) - (updatedUser.creditsUsed || 0);

    console.log("[Credits] Credits deducted successfully:", {
      userId: user._id,
      feature,
      deducted: creditsNeeded,
      remaining: newAvailable,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Credits deducted successfully",
        used: creditsNeeded,
        available: newAvailable,
        total: updatedUser.credits,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Credits] Deduct error:", {
      message: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { error: "Failed to deduct credits", details: error.message },
      { status: 500 }
    );
  }
}