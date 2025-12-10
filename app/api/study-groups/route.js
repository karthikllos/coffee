// app/api/study-groups/[id]/join/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { enforceCredits } from "@/lib/creditEnforcement";
import connectDb from "@/lib/connectDb";
import StudyGroup from "@/models/studyGroup";
import User from "@/models/user";

export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
    try {
        const { id } = params;
        const session = await getServerSession(authOptions);
        
        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        await connectDb();

        // Get user
        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Check if user is already in the group
        const existingMember = await StudyGroup.findOne({
            _id: id,
            members: user._id
        });

        if (existingMember) {
            return NextResponse.json(
                { error: "You are already a member of this group" },
                { status: 400 }
            );
        }

        // Enforce credit check
        const creditCheck = await enforceCredits(user._id, 'STUDY_GROUP_JOIN');
        if (!creditCheck.success) {
            return NextResponse.json(
                { 
                    error: "Insufficient credits to join study group",
                    required: 1,
                    available: creditCheck.creditsRemaining || 0
                },
                { status: 402 }
            );
        }

        // Add user to study group
        const updatedGroup = await StudyGroup.findByIdAndUpdate(
            id,
            { $addToSet: { members: user._id } },
            { new: true }
        );

        if (!updatedGroup) {
            // Refund credits if group not found
            await addCredits(user._id, 1, 'refund', {
                reason: 'Study group not found',
                groupId: id
            });
            
            return NextResponse.json(
                { error: "Study group not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Successfully joined study group",
            group: updatedGroup,
            creditsRemaining: creditCheck.creditsRemaining
        });

    } catch (error) {
        console.error("Error joining study group:", error);
        return NextResponse.json(
            { 
                error: "Failed to join study group",
                details: error.message 
            },
            { status: 500 }
        );
    }
}