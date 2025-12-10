// app/api/user/credits/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getUserCreditInfo } from "@/lib/creditEnforcement";
import connectDb from "@/lib/connectDb";
import User from "@/models/user";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
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

        const creditInfo = await getUserCreditInfo(user._id);

        return NextResponse.json({
            success: true,
            ...creditInfo
        });

    } catch (error) {
        console.error("Error getting user credits:", error);
        return NextResponse.json(
            { error: "Failed to get credit information" },
            { status: 500 }
        );
    }
}