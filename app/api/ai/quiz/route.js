// app/api/quizzes/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/auth";
import { enforceCredits } from "../../../../lib/creditEnforcement";
import { generateQuiz } from "../../../../lib/aiService";
import connectDb from "../../../../lib/connectDb";
import User from "../../../../models/user";

export const dynamic = "force-dynamic";

/**
 * Generate AI Quiz
 * Cost: 2 credits (Pro: from monthly 50, Pro Max/Premium: free, Free/Starter: from purchased credits)
 */
export async function POST(request) {
  try {
    console.log("[AI Quiz] Starting quiz generation");

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { topic, difficulty = "medium", questionCount = 5 } = body || {};

    if (!topic || !topic.trim()) {
      return NextResponse.json(
        { error: "Topic is required" },
        { status: 400 }
      );
    }

    await connectDb();

    const user = await User.findOne({
      email: session.user.email.toLowerCase().trim(),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ✅ ATOMIC credit enforcement
    const creditCheck = await enforceCredits(user._id.toString(), "AI_QUIZ");

    if (!creditCheck.success) {
      console.warn("[AI Quiz] ❌ Credit check failed:", {
        userId: user._id,
        reason: creditCheck.message,
      });

      return NextResponse.json(
        {
          error: creditCheck.message,
          creditsRemaining: creditCheck.creditsRemaining,
          requiredCredits: 2,
        },
        { status: creditCheck.code }
      );
    }

    // ✅ Generate quiz using Gemini API
    const result = await generateQuiz(topic, difficulty, parseInt(questionCount));

    console.log("[AI Quiz] ✅ Quiz generated successfully:", {
      userId: user._id,
      topic,
      questionsCount: result.questions.length,
      creditsUsed: creditCheck.cost,
      creditsRemaining: creditCheck.creditsRemaining,
    });

    return NextResponse.json(
      {
        success: true,
        quiz: {
          topic,
          difficulty,
          questions: result.questions,
        },
        credits: {
          used: creditCheck.cost,
          remaining: creditCheck.creditsRemaining,
          isUnlimited: creditCheck.isUnlimited,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[AI Quiz] ❌ Error:", error.message);

    return NextResponse.json(
      { error: "Failed to generate quiz", details: error.message },
      { status: 500 }
    );
  }
}