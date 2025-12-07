// lib/creditEnforcement.js
import connectDb from "./connectDb";
import User from "../models/user";

export const CREDIT_COSTS = {
  AI_NOTES: 1,
  AI_QUIZ: 2,
  FOCUS_PREDICTION: 1,
  REFLECTION: 0,
};

/**
 * Atomic credit deduction - prevents race conditions
 * @param {string} userId - User ID
 * @param {string} feature - Feature name (AI_NOTES, AI_QUIZ, etc)
 * @returns {Promise<{success: boolean, message: string, creditsRemaining: number, code: number}>}
 */
export async function enforceCredits(userId, feature) {
  try {
    await connectDb();

    // Get user info first
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, message: "User not found", code: 404, creditsRemaining: 0 };
    }

    const cost = CREDIT_COSTS[feature] || 0;

    console.log(`[Credits] Enforcing ${feature} for user ${userId}:`, {
      plan: user.subscriptionPlan,
      currentCredits: user.aiCredits,
      cost,
    });

    // ✅ Pro Max and Premium get unlimited access
    if (user.subscriptionPlan === "Pro Max" || user.subscriptionPlan === "Premium") {
      console.log(`[Credits] ✅ ${feature} is FREE for ${user.subscriptionPlan} subscriber`);
      return {
        success: true,
        message: "Unlimited access for your plan",
        creditsRemaining: 999999,
        cost: 0,
        code: 200,
        isUnlimited: true,
      };
    }

    // ✅ Free features for all plans
    if (cost === 0) {
      return {
        success: true,
        message: "Feature is free",
        creditsRemaining: user.aiCredits || 0,
        cost: 0,
        code: 200,
        isFree: true,
      };
    }

    // ✅ Pro plan: 50 credits per month (reset on 1st of month)
    if (user.subscriptionPlan === "Pro") {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      // Reset credits if new month
      if (!user.creditMonthResetDate || new Date(user.creditMonthResetDate) < monthStart) {
        await User.updateOne(
          { _id: userId },
          {
            aiCredits: 50,
            creditMonthResetDate: monthStart,
          }
        );

        user.aiCredits = 50;
        user.creditMonthResetDate = monthStart;

        console.log(`[Credits] ✅ Pro plan credits reset to 50 for user ${userId}`);
      }

      // ✅ ATOMIC UPDATE: Deduct credits only if user has enough
      const result = await User.updateOne(
        {
          _id: userId,
          aiCredits: { $gte: cost }, // Only update if balance >= cost
        },
        {
          $inc: { aiCredits: -cost }, // Atomic decrement
        }
      );

      if (result.modifiedCount === 0) {
        // Update failed - user doesn't have enough credits
        const currentUser = await User.findById(userId).select("aiCredits");
        console.warn(`[Credits] ❌ Insufficient credits for Pro user ${userId}:`, {
          needed: cost,
          available: currentUser.aiCredits,
        });

        return {
          success: false,
          message: `Insufficient credits. You have ${currentUser.aiCredits} but need ${cost}`,
          creditsRemaining: currentUser.aiCredits || 0,
          cost: cost,
          code: 402,
        };
      }

      // Success - get updated balance
      const updatedUser = await User.findById(userId).select("aiCredits");

      console.log(`[Credits] ✅ Deducted ${cost} credits for Pro user. Remaining: ${updatedUser.aiCredits}`);

      return {
        success: true,
        message: "Credit deducted successfully",
        creditsRemaining: updatedUser.aiCredits,
        cost: cost,
        code: 200,
      };
    }

    // ✅ Free/Starter plan: ATOMIC deduction with race condition protection
    const result = await User.updateOne(
      {
        _id: userId,
        aiCredits: { $gte: cost }, // Only update if balance >= cost
      },
      {
        $inc: { aiCredits: -cost }, // Atomic decrement
      }
    );

    if (result.modifiedCount === 0) {
      // Update failed - insufficient credits
      const currentUser = await User.findById(userId).select("aiCredits");

      console.warn(`[Credits] ❌ Insufficient credits for Free user ${userId}:`, {
        needed: cost,
        available: currentUser.aiCredits,
      });

      return {
        success: false,
        message: `Insufficient credits. You have ${currentUser.aiCredits} but need ${cost}. Upgrade your plan for more credits.`,
        creditsRemaining: currentUser.aiCredits || 0,
        cost: cost,
        code: 402,
      };
    }

    // Success - get updated balance
    const updatedUser = await User.findById(userId).select("aiCredits");

    console.log(`[Credits] ✅ Deducted ${cost} credits. Remaining: ${updatedUser.aiCredits}`);

    return {
      success: true,
      message: "Credit deducted successfully",
      creditsRemaining: updatedUser.aiCredits,
      cost: cost,
      code: 200,
    };
  } catch (error) {
    console.error("[Credits] ❌ Enforcement error:", error.message);
    return {
      success: false,
      message: "Credit enforcement failed",
      error: error.message,
      code: 500,
      creditsRemaining: 0,
    };
  }
}

/**
 * Get user's credit balance and subscription info
 */
export async function getUserCreditInfo(userId) {
  try {
    await connectDb();

    const user = await User.findById(userId).select(
      "aiCredits subscriptionPlan isProSubscriber creditMonthResetDate"
    );

    if (!user) {
      return null;
    }

    // Check if Pro monthly credits need reset
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    if (
      user.subscriptionPlan === "Pro" &&
      (!user.creditMonthResetDate || new Date(user.creditMonthResetDate) < monthStart)
    ) {
      await User.updateOne(
        { _id: userId },
        {
          aiCredits: 50,
          creditMonthResetDate: monthStart,
        }
      );

      user.aiCredits = 50;
    }

    const isUnlimited = user.subscriptionPlan === "Pro Max" || user.subscriptionPlan === "Premium";

    return {
      credits: isUnlimited ? 999999 : (user.aiCredits || 0),
      subscriptionPlan: user.subscriptionPlan,
      isProSubscriber: user.isProSubscriber,
      creditsRemaining: isUnlimited ? 999999 : (user.aiCredits || 0),
      isUnlimited: isUnlimited,
    };
  } catch (error) {
    console.error("[Credits] ❌ Get info error:", error.message);
    return null;
  }
}