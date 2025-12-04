import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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

    // Define valid plans and their amounts (in smallest currency unit)
    const validPlans = {
      PLAN_FREE: { amount: 0, name: "Free" },
      PLAN_PRO_MONTHLY: { amount: 90000, name: "Pro" }, // $9.00
      PLAN_PRO_MAX_MONTHLY: { amount: 190000, name: "Pro Max" }, // $19.00
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
          currency: "USD",
          planId,
          planName: "Free",
          success: true,
        },
        { status: 200 }
      );
    }

    // Create order for paid plans
    const mockOrder = {
      orderId: `order_${Math.random().toString(36).substr(2, 9)}`,
      amount: planConfig.amount,
      currency: "USD",
      planId,
      planName: planConfig.name,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      success: true,
    };

    console.log("✅ Order created:", mockOrder);

    return NextResponse.json(mockOrder, { status: 200 });
  } catch (error) {
    console.error("❌ Subscription create error:", error?.message);

    return NextResponse.json(
      {
        error: error?.message || "Failed to create order",
        details:
          process.env.NODE_ENV === "development"
            ? error?.message
            : undefined,
      },
      { status: 500 }
    );
  }
}