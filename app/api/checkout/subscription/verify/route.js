// app/api/checkout/subscription/verify/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../../lib/auth";
import connectDb from "../../../../../lib/connectDb";
import User from "../../../../../models/user";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    console.log("[Subscription] Verifying payment");

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      planId,
    } = body || {};

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing payment details" },
        { status: 400 }
      );
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const hmac = crypto.createHmac("sha256", keySecret);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== razorpay_signature) {
      console.warn("[Subscription] Invalid signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    await connectDb();

    // ✅ CHECK IF PAYMENT ALREADY PROCESSED (prevent duplicates)
    const existingPayment = await User.findOne({
      email: session.user.email,
      "paymentHistory.razorpayPaymentId": razorpay_payment_id,
    });

    if (existingPayment) {
      console.warn(
        "[Subscription] Payment already processed:",
        razorpay_payment_id
      );
      return NextResponse.json(
        {
          success: true,
          message: "Payment already processed",
          subscription: {
            planName: existingPayment.subscriptionPlan,
            credits: existingPayment.aiCredits,
            status: existingPayment.subscriptionStatus,
          },
        },
        { status: 200 }
      );
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const planMapping = {
      starter: "Starter",
      pro: "Pro",
      premium: "Premium",
      PLAN_PRO_MONTHLY: "Pro",
      PLAN_PRO_MAX_MONTHLY: "Pro Max",
      PLAN_FREE: "Free",
    };

    const amounts = {
      Starter: 4999,
      Pro: 9999,
      "Pro Max": 19999,
      Premium: 19999,
      Free: 0,
    };

    const credits = {
      Starter: 50,
      Pro: 200,
      "Pro Max": 500,
      Premium: 1000,
      Free: 5,
    };

    const newPlan = planMapping[planId] || "Pro";
    const now = new Date();
    const renewalDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // ✅ UPDATE SUBSCRIPTION AND ADD TO PAYMENT HISTORY (atomic operation)
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        subscriptionPlan: newPlan,
        subscriptionStatus: "active",
        subscriptionStartDate: now,
        subscriptionRenewalDate: renewalDate,
        aiCredits: credits[newPlan],
        creditsUsed: 0,
        lastPaymentDate: now,
        lastPaymentAmount: amounts[newPlan],
        subscriptionPaymentId: razorpay_payment_id,
        $push: {
          paymentHistory: {
            razorpayPaymentId: razorpay_payment_id,
            razorpayOrderId: razorpay_order_id,
            plan: newPlan,
            amount: amounts[newPlan],
            status: "completed",
            createdAt: now,
          },
        },
      },
      { new: true }
    );

    console.log("[Subscription] ✅ Payment processed successfully:", {
      userId: user._id,
      plan: newPlan,
      paymentId: razorpay_payment_id,
      credits: credits[newPlan],
    });

    // ✅ CRITICAL FIX: Update the session with new subscription plan
    if (session.user) {
      session.user.subscriptionPlan = newPlan;
    }

    return NextResponse.json(
      {
        success: true,
        subscription: {
          planName: updatedUser.subscriptionPlan,
          credits: updatedUser.aiCredits,
          status: updatedUser.subscriptionStatus,
          renewalDate: updatedUser.subscriptionRenewalDate,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Subscription] Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}