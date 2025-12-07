import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/auth";
import connectDb from "../../../../lib/connectDb";
import User from "../../../../models/user";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    console.log("[Invoices] Fetching invoices");

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.warn("[Invoices] Unauthorized GET attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDb();

    const user = await User.findOne({
      email: session.user.email.toLowerCase().trim(),
    })
      .select("subscriptionPlan subscriptionRenewalDate subscriptionStartDate paymentHistory")
      .lean();

    if (!user) {
      console.error("[Invoices] User not found:", session.user.email);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const invoices = [];

    // Build invoices from payment history
    if (user.paymentHistory && user.paymentHistory.length > 0) {
      user.paymentHistory.forEach((payment, idx) => {
        invoices.push({
          id: `inv_${user._id}_${idx}`,
          paymentId: payment.razorpayPaymentId,
          date: new Date(payment.createdAt).toISOString().split("T")[0],
          amount: payment.amount,
          status: payment.status || "paid",
          pdfUrl: null,
          planName: payment.plan,
          description: `${payment.plan} Plan`,
        });
      });
    }

    // If user has active subscription, add current invoice
    if (
      user.subscriptionPlan &&
      user.subscriptionPlan !== "Free" &&
      user.subscriptionRenewalDate
    ) {
      const planAmounts = {
        Starter: 4999,
        Pro: 9999,
        Premium: 19999,
        "Pro Max": 19999,
      };

      invoices.push({
        id: `inv_${user._id}_current`,
        date: new Date(user.subscriptionStartDate).toISOString().split("T")[0],
        nextBillingDate: new Date(user.subscriptionRenewalDate).toISOString().split("T")[0],
        amount: planAmounts[user.subscriptionPlan] || 0,
        status: "active",
        pdfUrl: null,
        planName: user.subscriptionPlan,
        description: `${user.subscriptionPlan} Plan (Active)`,
      });
    }

    console.log("[Invoices] Fetched", invoices.length, "invoices for user:", user._id);

    return NextResponse.json(invoices, { status: 200 });
  } catch (error) {
    console.error("[Invoices] GET error:", {
      message: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { error: "Failed to fetch invoices", details: error.message },
      { status: 500 }
    );
  }
}