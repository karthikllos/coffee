// app/api/study-groups/[id]/messages/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../../lib/auth";
import connectDb from "../../../../../lib/connectDb";
import StudyGroup from "../../../../../models/StudyGroup";
import GroupMessage from "../../../../../models/GroupMessage";
import User from "../../../../../models/user";

export const dynamic = "force-dynamic";

/**
 * GET - Fetch all messages for a study group
 */
export async function GET(request, context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const { id } = params;

    await connectDb();

    // Verify user is a member of the group
    const user = await User.findOne({
      email: session.user.email.toLowerCase().trim(),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const group = await StudyGroup.findById(id);
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    if (!group.members.some((memberId) => memberId.toString() === user._id.toString())) {
      return NextResponse.json(
        { error: "You are not a member of this group" },
        { status: 403 }
      );
    }

    // Fetch messages with sender info
    const messages = await GroupMessage.find({ group: id })
      .populate("sender", "username email profilepic")
      .sort({ createdAt: 1 })
      .limit(100) // Last 100 messages
      .lean();

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("[Group Messages] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

/**
 * POST - Send a new message to the group
 */
export async function POST(request, context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const { id } = params;

    const body = await request.json();
    const { content, attachmentUrl } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: "Message is too long (max 2000 characters)" },
        { status: 400 }
      );
    }

    await connectDb();

    // Verify user is a member of the group
    const user = await User.findOne({
      email: session.user.email.toLowerCase().trim(),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const group = await StudyGroup.findById(id);
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    if (!group.members.some((memberId) => memberId.toString() === user._id.toString())) {
      return NextResponse.json(
        { error: "You are not a member of this group" },
        { status: 403 }
      );
    }

    // Create message
    const message = await GroupMessage.create({
      group: id,
      sender: user._id,
      content: content.trim(),
      attachmentUrl: attachmentUrl || null,
    });

    // Populate sender info for response
    const populatedMessage = await GroupMessage.findById(message._id)
      .populate("sender", "username email profilepic")
      .lean();

    console.log("[Group Messages] Message sent:", {
      groupId: id,
      senderId: user._id,
      messageId: message._id,
    });

    return NextResponse.json({ message: populatedMessage }, { status: 201 });
  } catch (error) {
    console.error("[Group Messages] POST error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}