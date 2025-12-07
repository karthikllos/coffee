import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/auth";
import { getUserCreditInfo } from "../../../../lib/creditEnforcement";
import connectDb from "../../../../lib/connectDb";
import User from "../../../../models/User";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    console.log("[Credits API] Fetching user credits");

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDb();

    const user = await User.findOne({
      email: session.user.email.toLowerCase().trim(),
    }).select("_id subscriptionPlan aiCredits creditMonthResetDate");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const creditInfo = await getUserCreditInfo(user._id.toString());

    console.log("[Credits API] ✅ Fetched:", {
      userId: user._id,
      plan: creditInfo.subscriptionPlan,
      credits: creditInfo.creditsRemaining,
    });

    return NextResponse.json(creditInfo, { status: 200 });
  } catch (error) {
    console.error("[Credits API] ❌ Error:", error.message);

    return NextResponse.json(
      { error: "Failed to fetch credits", details: error.message },
      { status: 500 }
    );
  }
}
