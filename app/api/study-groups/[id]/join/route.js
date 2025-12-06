// app/api/study-groups/[id]/join/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../../lib/auth";
import connectDb from "../../../../../lib/connectDb";
import StudyGroup from "../../../../../models/StudyGroup";
import User from "../../../../../models/user";

export const dynamic = "force-dynamic";

export async function POST(request, context) {
  try {
    console.log("[StudyGroups] Joining group");
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.warn("[StudyGroups] Unauthorized join attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Access params correctly in Next.js 15
    const params = await context.params;
    const { id } = params;

    if (!id) {
      console.warn("[StudyGroups] Missing group ID");
      return NextResponse.json({ error: "Group ID is required" }, { status: 400 });
    }

    await connectDb();

    const user = await User.findOne({
      email: session.user.email.toLowerCase().trim(),
    });

    if (!user) {
      console.error("[StudyGroups] User not found:", session.user.email);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const group = await StudyGroup.findById(id);
    if (!group) {
      console.warn("[StudyGroups] Group not found:", id);
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Check if already a member
    if (group.members.some(memberId => memberId.toString() === user._id.toString())) {
      console.warn("[StudyGroups] User already member of group:", id);
      return NextResponse.json(
        { error: "Already a member of this group" },
        { status: 400 }
      );
    }

    // Check if group is full
    if (group.members.length >= group.maxMembers) {
      console.warn("[StudyGroups] Group is full:", id);
      return NextResponse.json(
        { error: "Group is full" },
        { status: 400 }
      );
    }

    // Add user to group
    group.members.push(user._id);
    await group.save();

    console.log("[StudyGroups] User joined group successfully", {
      groupId: id,
      userId: user._id,
      memberCount: group.members.length,
    });

    return NextResponse.json(
      { 
        success: true,
        message: "Successfully joined group", 
        group: {
          id: group._id,
          name: group.name,
          memberCount: group.members.length,
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[StudyGroups] Error joining group:", {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: "Failed to join group", details: error.message },
      { status: 500 }
    );
  }
}