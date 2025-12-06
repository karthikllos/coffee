import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import connectDb from "../../../lib/connectDb";
import User from "../../../models/User";

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
    }).lean();

    if (!user) {
      console.error("[Invoices] User not found:", session.user.email);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const invoices = [];

    if (user.subscriptionPlan !== "Free" && user.subscriptionRenewalDate) {
      invoices.push({
        id: `inv_${user._id}_latest`,
        date: new Date().toISOString(),
        amount: user.subscriptionPlan === "Pro" ? 9999 : 19999,
        status: "paid",
        pdfUrl: null,
        planName: user.subscriptionPlan,
      });
    }

    console.log(
      "[Invoices] Fetched",
      invoices.length,
      "invoices for user:",
      user._id
    );
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