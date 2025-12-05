import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export const dynamic = "force-dynamic";

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(request) {
  try {
    const body = await request.json();
    const { planId, planName, amount } = body || {};

    if (!planId) {
      return NextResponse.json(
        { error: "planId is required" },
        { status: 400 }
      );
    }

    // Define valid plans and their amounts (in smallest currency unit - paise)
    const validPlans = {
      PLAN_FREE: { amount: 0, name: "Free" },
      PLAN_PRO_MONTHLY: { amount: 9900, name: "Pro" }, // ₹99
      PLAN_PRO_MAX_MONTHLY: { amount: 19900, name: "Pro Max" }, // ₹199
    };

    const planConfig = validPlans[planId];
    if (!planConfig) {
      return NextResponse.json(
        { error: "Invalid planId" },
        { status: 400 }
      );
    }

    // For free plan, no order needed
    if (planId === "PLAN_FREE") {
      return NextResponse.json(
        {
          orderId: `FREE_${Date.now()}`,
          amount: 0,
          currency: "INR",
          planId,
          planName: "Free",
          success: true,
        },
        { status: 200 }
      );
    }

    // Create actual Razorpay order
    try {
      const order = await razorpay.orders.create({
        amount: planConfig.amount, // Amount in paise
        currency: "INR",
        receipt: `order_${Date.now()}`,
        notes: {
          planId,
          planName: planConfig.name,
        },
      });

      console.log("✅ Razorpay Order Created:", order.id);

      return NextResponse.json(
        {
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          planId,
          planName: planConfig.name,
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          success: true,
        },
        { status: 200 }
      );
    } catch (razorpayError) {
      console.error("❌ Razorpay Error:", razorpayError.message);
      throw new Error(`Razorpay API Error: ${razorpayError.message}`);
    }
  } catch (error) {
    console.error("❌ Subscription create error:", error?.message);

    return NextResponse.json(
      {
        error: error?.message || "Failed to create order",
      },
      { status: 500 }
    );
  }
}