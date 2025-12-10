// app/api/ai/quiz/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/auth";
// 🚨 ASSUMPTION: 'refundCredits' is now exported from this file
import { enforceCredits, refundCredits } from "../../../../lib/creditEnforcement";
import { generateQuiz } from "../../../../lib/aiService";
import connectDb from "../../../../lib/connectDb";
import User from "../../../../models/user";

export const dynamic = "force-dynamic";

/**
 * Generate AI Quiz
 * Cost: 2 credits (Pro: from monthly 50, Pro Max/Premium: free, Free/Starter: from purchased credits)
 */
export async function POST(request) {
  const serviceType = "AI_QUIZ";
  const requiredCredits = 2; // Hardcoding cost as it's defined in the enforcement logic

  try {
    console.log(`[${serviceType}] 🎯 Starting quiz generation`);

    // ✅ 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.warn(`[${serviceType}] ❌ Unauthorized attempt`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ 2. Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error(`[${serviceType}] ❌ Invalid JSON:`, parseError);
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { topic, difficulty = "medium", questionCount = 5 } = body || {};

    // Validate topic
    if (!topic || typeof topic !== "string" || !topic.trim()) {
      console.warn(`[${serviceType}] ❌ Missing or invalid topic`);
      return NextResponse.json(
        { error: "Topic is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    // Validate difficulty
    const validDifficulties = ["easy", "medium", "hard"];
    if (!validDifficulties.includes(difficulty)) {
      console.warn(`[${serviceType}] ❌ Invalid difficulty:`, difficulty);
      return NextResponse.json(
        { error: "Difficulty must be one of: easy, medium, hard" },
        { status: 400 }
      );
    }

    // Validate question count
    const count = parseInt(questionCount);
    if (isNaN(count) || count < 1 || count > 20) {
      console.warn(`[${serviceType}] ❌ Invalid question count:`, questionCount);
      return NextResponse.json(
        { error: "Question count must be between 1 and 20" },
        { status: 400 }
      );
    }

    // ✅ 3. Database connection and User lookup
    await connectDb();

    const user = await User.findOne({
      email: session.user.email.toLowerCase().trim(),
    });

    if (!user) {
      console.error(`[${serviceType}] ❌ User not found:`, session.user.email);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log(`[${serviceType}] 👤 User found:`, {
      id: user._id,
      email: user.email,
      plan: user.subscriptionPlan,
    });

    // ✅ 4. ATOMIC credit enforcement (STEP 1: Enforce)
    const creditCheck = await enforceCredits(user._id.toString(), serviceType);

    if (!creditCheck.success) {
      console.warn(`[${serviceType}] ❌ Credit check failed:`, {
        userId: user._id,
        reason: creditCheck.message,
      });

      return NextResponse.json(
        {
          error: creditCheck.message,
          message: creditCheck.message,
          creditsRemaining: creditCheck.creditsRemaining,
          requiredCredits: requiredCredits,
        },
        { status: creditCheck.code }
      );
    }

    console.log(`[${serviceType}] ✅ Credits checked:`, {
      used: creditCheck.cost,
      remaining: creditCheck.creditsRemaining,
      isUnlimited: creditCheck.isUnlimited,
    });

    // ✅ 5. Generate quiz using AI (STEP 2: Perform AI operation)
    let result;
    try {
      result = await generateQuiz(topic, difficulty, count);
    } catch (aiError) {
      console.error(`[${serviceType}] ❌ AI generation failed:`, aiError);

      // ✅ STEP 3: REFUND on AI failure
      if (!creditCheck.isUnlimited) {
        await refundCredits(
          user._id.toString(),
          creditCheck.cost,
          "ai_operation_failed"
        );
        console.log(`[${serviceType}] 💰 Credits refunded due to AI failure`);
      }

      return NextResponse.json(
        {
          error: "Failed to generate quiz. Please try again.",
          details: process.env.NODE_ENV === "development" ? aiError.message : undefined,
        },
        { status: 500 }
      );
    }

    // ✅ 6. Validate AI response (STEP 4: Validate response)
    if (!result || !result.questions || !Array.isArray(result.questions) || result.questions.length === 0) {
      const reason = !result?.questions ? "Invalid response structure" : "Empty questions array";
      console.error(`[${serviceType}] ❌ ${reason}:`, result);

      // ✅ STEP 3: REFUND on invalid response
      if (!creditCheck.isUnlimited) {
        await refundCredits(
          user._id.toString(),
          creditCheck.cost,
          "invalid_response"
        );
        console.log(`[${serviceType}] 💰 Credits refunded due to ${reason}`);
      }

      const errorMessage = reason === "Empty questions array" 
        ? "No questions generated. Please try a different topic."
        : "Invalid response from AI service. Please try again.";

      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }

    // ✅ 7. Success response (STEP 5: Success)
    console.log(`[${serviceType}] ✅ Quiz generated successfully:`, {
      userId: user._id,
      topic,
      difficulty,
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
          isUnlimited: creditCheck.isUnlimited || false,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`[${serviceType}] ❌ Unexpected error:`, {
      message: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      {
        error: "An unexpected error occurred. Please try again.",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check quiz generation availability
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDb();

    const user = await User.findOne({
      email: session.user.email.toLowerCase().trim(),
    }).select("subscriptionPlan aiCredits creditsUsed");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isUnlimited = ["Pro Max", "Premium"].includes(user.subscriptionPlan);
    // Use the required credits constant
    const required = 2; 
    const available = isUnlimited ? 999999 : (user.aiCredits || 0);

    return NextResponse.json(
      {
        available: available >= required,
        credits: {
          available: available,
          required: required,
          isUnlimited,
        },
        plan: user.subscriptionPlan,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[AI Quiz] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}