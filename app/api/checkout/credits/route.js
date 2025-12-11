// app/api/checkout/credits/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../app/api/auth/[...nextauth]/route";
import { addCredits } from "../../../../lib/creditEnforcement";
import connectDb from "../../../../lib/connectDb";
import User from "../../../../models/user";

export const dynamic = "force-dynamic";

// Get available credit packages
export async function GET() {
    const packages = [
        {
            id: "credits_50",
            name: "Starter Pack",
            credits: 50,
            price: 499,
            savings: "0%",
        },
        {
            id: "credits_150",
            name: "Popular Pack",
            credits: 150,
            price: 1299,
            savings: "15%",
        },
        {
            id: "credits_500",
            name: "Pro Pack",
            credits: 500,
            price: 3499,
            savings: "25%",
        },
        {
            id: "credits_1000",
            name: "Max Pack",
            credits: 1000,
            price: 6299,
            savings: "35%",
        },
    ];

    return NextResponse.json(packages);
}

// Handle credit purchase
export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { packageId, paymentId, amount, credits } = await request.json();

        if (!packageId || !paymentId || !amount || !credits) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        await connectDb();
        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Add credits
        const result = await addCredits(
            user._id,
            credits,
            'purchase',
            {
                packageId,
                paymentId,
                amount,
                currency: 'INR'
            }
        );

        return NextResponse.json({
            success: true,
            message: "Credits added successfully",
            ...result
        });

    } catch (error) {
        console.error("Error processing credit purchase:", error);
        return NextResponse.json(
            { error: "Failed to process credit purchase", details: error.message },
            { status: 500 }
        );
    }
}