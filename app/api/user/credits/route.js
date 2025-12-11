// app/api/user/credits/route.js - FIXED VERSION
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/auth";
import User from "../../../../models/user";
import connectDb from "../../../../lib/connectDb";

export const dynamic = "force-dynamic";

// Plan credit defaults
const PLAN_CREDITS = {
  'Free': 5,
  'Starter': 10,
  'Pro': 50,
  'Pro Max': 999999,
  'Premium': 999999
};

export async function GET(request) {
  try {
    console.log("[Credits API] Fetching user credits");

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.warn("[Credits API] Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDb();

    let user = await User.findOne({
      email: session.user.email.toLowerCase().trim(),
    }).select("subscriptionPlan subscriptionStatus aiCredits creditsUsed creditMonthResetDate paymentHistory");

    if (!user) {
      console.error("[Credits API] User not found:", session.user.email);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const plan = user.subscriptionPlan || "Free";
    const isUnlimited = plan === "Premium" || plan === "Pro Max";

    // ✅ Initialize credits if missing
    if (user.aiCredits === undefined || user.aiCredits === null) {
      const defaultCredits = PLAN_CREDITS[plan] || 5;
      console.log(`[Credits API] 🎁 Initializing credits: ${defaultCredits} for ${plan} user`);
      
      await User.updateOne(
        { _id: user._id },
        { 
          $set: { 
            aiCredits: defaultCredits,
            creditsUsed: 0,
            creditMonthResetDate: new Date()
          } 
        }
      );
      
      user.aiCredits = defaultCredits;
      user.creditsUsed = 0;
    }

    // ✅ Initialize creditsUsed if missing
    if (user.creditsUsed === undefined || user.creditsUsed === null) {
      console.log(`[Credits API] 🔧 Initializing creditsUsed=0`);
      await User.updateOne({ _id: user._id }, { $set: { creditsUsed: 0 } });
      user.creditsUsed = 0;
    }

    // ✅ Check monthly reset
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    if (!user.creditMonthResetDate || new Date(user.creditMonthResetDate) < monthStart) {
      console.log(`[Credits API] 🔄 Monthly reset for ${plan} user`);
      
      const monthlyAllotment = PLAN_CREDITS[plan] || 5;
      
      await User.updateOne(
        { _id: user._id },
        { 
          $set: { 
            aiCredits: monthlyAllotment,
            creditsUsed: 0,
            creditMonthResetDate: monthStart
          } 
        }
      );
      
      user.aiCredits = monthlyAllotment;
      user.creditsUsed = 0;
    }

    const total = user.aiCredits || 0;
    const used = user.creditsUsed || 0;
    const available = isUnlimited ? 999999 : Math.max(0, total - used);

    console.log("[Credits API] ✅ Credits fetched:", {
      userId: user._id,
      plan,
      total,
      used,
      available,
      isUnlimited
    });

    return NextResponse.json(
      {
        plan,
        available,
        used,
        total,
        status: user.subscriptionStatus,
        isUnlimited,
        lastPayment: user.paymentHistory?.[user.paymentHistory.length - 1],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Credits API] ❌ Error:", error);

    return NextResponse.json(
      { 
        error: "Failed to fetch credits", 
        details: process.env.NODE_ENV === 'development' ? error.message : undefined 
      },
      { status: 500 }
    );
  }
}