import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/auth";
import connectDb from "../../../../lib/connectDb";
import User from "../../../../models/user";
import { sendTaskReminder } from "../../../../lib/emailService";

export const dynamic = "force-dynamic";

/**
 * POST /api/notifications/task-reminder
 * Send a task reminder email to the authenticated user
 */
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDb();

    const body = await req.json();
    const { taskId, title, dueDate } = body;

    if (!taskId || !title) {
      return NextResponse.json(
        { error: "taskId and title are required" },
        { status: 400 }
      );
    }

    // Fetch user email
    const user = await User.findOne({
      email: session.user.email.toLowerCase().trim(),
    }).select("email");

    if (!user?.email) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Send reminder
    const result = await sendTaskReminder(
      user.email,
      `Task Reminder: ${title}`,
      title,
      dueDate
    );

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to send reminder", details: result.error },
        { status: 500 }
      );
    }

    console.log("[Task Reminder] ✅ Sent to:", user.email);

    return NextResponse.json({
      success: true,
      message: "Task reminder sent successfully",
      sentTo: user.email,
    });
  } catch (error) {
    console.error("[Task Reminder] ❌ Error:", error.message);
    return NextResponse.json(
      { error: "Failed to send reminder", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/notifications/task-reminder?taskId=xxx&title=xxx
 * Preview reminder details (for testing)
 */
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("taskId");
    const title = searchParams.get("title");
    const dueDate = searchParams.get("dueDate");

    if (!taskId || !title) {
      return NextResponse.json(
        { error: "taskId and title are required" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      preview: {
        taskId,
        title,
        dueDate: dueDate || "No due date",
        reminderWouldBeSentTo: session.user.email,
        subject: `Task Reminder: ${title}`,
      },
    });
  } catch (error) {
    console.error("[Task Reminder] ❌ Error:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch task reminder info", details: error.message },
      { status: 500 }
    );
  }
}
