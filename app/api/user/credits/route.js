import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/auth";
import User from "../../../../models/user";
import connectDb from "../../../../lib/connectDb";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    console.log("[Credits] Fetching user credits");

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.warn("[Credits] Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDb();

    const user = await User.findOne({
      email: session.user.email.toLowerCase().trim(),
    }).select("subscriptionPlan subscriptionStatus credits creditsUsed paymentHistory");

    if (!user) {
      console.error("[Credits] User not found:", session.user.email);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const available = (user.credits || 0) - (user.creditsUsed || 0);

    console.log("[Credits] Credits fetched for user:", {
      userId: user._id,
      plan: user.subscriptionPlan,
      total: user.credits,
      used: user.creditsUsed,
      available,
    });

    return NextResponse.json(
      {
        plan: user.subscriptionPlan || "Free",
        available: Math.max(0, available),
        used: user.creditsUsed || 0,
        total: user.credits || 0,
        status: user.subscriptionStatus,
        lastPayment: user.paymentHistory?.[user.paymentHistory.length - 1],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Credits] GET error:", {
      message: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { error: "Failed to fetch credits", details: error.message },
      { status: 500 }
    );
  }
}