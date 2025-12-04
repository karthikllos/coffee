import { NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      planId,
      planName,
    } = body || {};

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, error: "Missing payment details" },
        { status: 400 }
      );
    }

    // In development, accept all signatures for testing
    if (process.env.NODE_ENV === "development") {
      console.log("✅ Payment verified (dev mode):", {
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        planId,
      });

      return NextResponse.json(
        {
          success: true,
          message: "Subscription activated",
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          planId,
          planName,
        },
        { status: 200 }
      );
    }

    // In production, verify the signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { success: false, error: "Invalid signature" },
        { status: 400 }
      );
    }

    console.log("✅ Payment verified:", razorpay_payment_id);

    return NextResponse.json(
      {
        success: true,
        message: "Subscription activated",
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        planId,
        planName,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Verification error:", error?.message);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Verification failed",
      },
      { status: 500 }
    );
  }
}