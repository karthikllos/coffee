// app/api/ai/notes/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/auth";
// 🚨 ASSUMPTION: 'refundCredits' is now exported from this file
import { enforceCredits, refundCredits } from "../../../../lib/creditEnforcement"; 
import { generateNotes } from "../../../../lib/aiService";
import connectDb from "../../../../lib/connectDb";
import User from "../../../../models/user";

export const dynamic = "force-dynamic";

/**
 * Generate AI Notes
 * Cost: 1 credit
 */
export async function POST(request) {
  const serviceType = "AI_NOTES";
  const requiredCredits = 1;

  try {
    console.log(`[${serviceType}] 🎯 Starting notes generation`);

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
    
    const { content } = body || {};

    if (!content || typeof content !== "string" || !content.trim()) {
      console.warn(`[${serviceType}] ❌ Missing or invalid content`);
      return NextResponse.json(
        { error: "Content is required and must be a non-empty string" },
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

    // ✅ 5. Generate notes using AI (STEP 2: Perform AI operation)
    let result;
    try {
      result = await generateNotes(content);
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
          error: "Failed to generate notes. Please try again.",
          details: process.env.NODE_ENV === "development" ? aiError.message : undefined,
        },
        { status: 500 }
      );
    }

    // ✅ 6. Validate AI response (STEP 4: Validate response)
    // Assuming 'result' must contain a non-empty 'notes' string or property
    if (!result || !result.notes || typeof result.notes !== "string" || result.notes.trim().length === 0) {
      console.error(`[${serviceType}] ❌ Invalid AI response structure or empty notes:`, result);

      // ✅ STEP 3: REFUND on invalid response
      if (!creditCheck.isUnlimited) {
        await refundCredits(
          user._id.toString(),
          creditCheck.cost,
          "invalid_response"
        );
        console.log(`[${serviceType}] 💰 Credits refunded due to invalid response`);
      }

      return NextResponse.json(
        { error: "Invalid response from AI service. Please try again." },
        { status: 500 }
      );
    }

    // ✅ 7. Success response (STEP 5: Success)
    console.log(`[${serviceType}] ✅ Notes generated successfully:`, {
      userId: user._id,
      contentLength: content.length,
      notesLength: result.notes.length,
      creditsUsed: creditCheck.cost,
      creditsRemaining: creditCheck.creditsRemaining,
    });

    return NextResponse.json(
      {
        success: true,
        notes: result.notes,
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