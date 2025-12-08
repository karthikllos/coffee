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

    console.log(`[Credits] 🔍 Checking credits for feature: ${feature}, user: ${userId}`);

    // Get user info first
    const user = await User.findById(userId);
    if (!user) {
      console.error(`[Credits] ❌ User not found: ${userId}`);
      return { 
        success: false, 
        message: "User not found", 
        code: 404, 
        creditsRemaining: 0 
      };
    }

    const cost = CREDIT_COSTS[feature] || 0;

    // ✅ AUTO-MIGRATION: If aiCredits is undefined, migrate now
    let aiCredits = user.aiCredits;
    
    if (aiCredits === undefined || aiCredits === null) {
      console.log(`[Credits] 🔄 Auto-migrating user from old credit system`);
      
      if (user.subscriptionPlan === "Pro") {
        aiCredits = 50;
        await User.updateOne(
          { _id: userId },
          { $set: { aiCredits: 50, creditMonthResetDate: new Date() } }
        );
      } else if (user.subscriptionPlan === "Pro Max" || user.subscriptionPlan === "Premium") {
        aiCredits = 999999;
        await User.updateOne({ _id: userId }, { $set: { aiCredits: 999999 } });
      } else {
        // Migrate old credits or set default
        const oldAvailable = (user.credits || 0) - (user.creditsUsed || 0);
        aiCredits = oldAvailable > 0 ? oldAvailable : 5;
        await User.updateOne({ _id: userId }, { $set: { aiCredits: aiCredits } });
      }
      
      console.log(`[Credits] ✅ Migration complete: ${aiCredits} credits`);
      user.aiCredits = aiCredits; // Update in-memory object
    }

    console.log(`[Credits] 📊 User state:`, {
      userId: userId,
      plan: user.subscriptionPlan,
      aiCredits: user.aiCredits,
      featureCost: cost,
    });

    // ✅ Pro Max and Premium get unlimited access
    if (user.subscriptionPlan === "Pro Max" || user.subscriptionPlan === "Premium") {
      console.log(`[Credits] ✅ Unlimited access for ${user.subscriptionPlan} user`);
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
      console.log(`[Credits] ✅ Free feature: ${feature}`);
      return {
        success: true,
        message: "Feature is free",
        creditsRemaining: user.aiCredits || 0,
        cost: 0,
        code: 200,
        isFree: true,
      };
    }

    // ✅ Pro plan: Monthly allowance (50 credits, resets on 1st of month)
    if (user.subscriptionPlan === "Pro") {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

      console.log(`[Credits] 📅 Checking Pro plan reset:`, {
        currentMonth: monthStart,
        lastReset: user.creditMonthResetDate,
        needsReset: !user.creditMonthResetDate || new Date(user.creditMonthResetDate) < monthStart,
      });

      // Reset credits if new month
      if (!user.creditMonthResetDate || new Date(user.creditMonthResetDate) < monthStart) {
        console.log(`[Credits] 🔄 Resetting Pro credits to 50`);
        
        await User.updateOne(
          { _id: userId },
          {
            aiCredits: 50,
            creditMonthResetDate: monthStart,
          }
        );

        user.aiCredits = 50;
        user.creditMonthResetDate = monthStart;
      }

      // Check if user has enough credits (use updated value)
      const currentCredits = aiCredits || user.aiCredits || 0;
      
      console.log(`[Credits] 💰 Pro user credits:`, {
        available: currentCredits,
        needed: cost,
        sufficient: currentCredits >= cost,
      });

      if (currentCredits < cost) {
        console.warn(`[Credits] ❌ Insufficient Pro credits:`, {
          available: currentCredits,
          needed: cost,
        });

        return {
          success: false,
          message: `Insufficient credits. You have ${currentCredits} but need ${cost}`,
          creditsRemaining: currentCredits,
          cost: cost,
          code: 402,
        };
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
        console.error(`[Credits] ❌ Atomic update failed (race condition or insufficient credits)`);
        
        // Re-fetch to get current state
        const currentUser = await User.findById(userId).select("aiCredits");
        
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

      console.log(`[Credits] ✅ Pro credits deducted:`, {
        cost: cost,
        remaining: updatedUser.aiCredits,
      });

      return {
        success: true,
        message: "Credit deducted successfully",
        creditsRemaining: updatedUser.aiCredits,
        cost: cost,
        code: 200,
      };
    }

    // ✅ Free/Starter plan: Use aiCredits field (with auto-migration)
    console.log(`[Credits] 💳 Free/Starter plan - checking aiCredits`);
    
    let currentCredits = user.aiCredits;
    
    // Auto-migrate if needed
    if (currentCredits === undefined || currentCredits === null) {
      const oldAvailable = (user.credits || 0) - (user.creditsUsed || 0);
      currentCredits = oldAvailable > 0 ? oldAvailable : 5;
      await User.updateOne({ _id: userId }, { $set: { aiCredits: currentCredits } });
      console.log(`[Credits] 🔄 Auto-migrated Free/Starter user: ${currentCredits} credits`);
    }
    
    console.log(`[Credits] 💳 Available: ${currentCredits}, Needed: ${cost}`);

    if (currentCredits < cost) {
      console.warn(`[Credits] ❌ Insufficient credits for Free/Starter:`, {
        available: currentCredits,
        needed: cost,
      });

      return {
        success: false,
        message: `Insufficient credits. You have ${currentCredits} but need ${cost}. Upgrade your plan for more credits.`,
        creditsRemaining: currentCredits,
        cost: cost,
        code: 402,
      };
    }

    // ✅ ATOMIC deduction with race condition protection
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
      console.error(`[Credits] ❌ Atomic update failed`);
      
      // Re-fetch current state
      const currentUser = await User.findById(userId).select("aiCredits");

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

    console.log(`[Credits] ✅ Credits deducted successfully:`, {
      cost: cost,
      remaining: updatedUser.aiCredits,
    });

    return {
      success: true,
      message: "Credit deducted successfully",
      creditsRemaining: updatedUser.aiCredits,
      cost: cost,
      code: 200,
    };
  } catch (error) {
    console.error("[Credits] ❌ Enforcement error:", error.message);
    console.error("[Credits] Stack:", error.stack);
    
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

    console.log(`[Credits] 📊 Fetching credit info for user: ${userId}`);

    const user = await User.findById(userId).select(
      "aiCredits subscriptionPlan subscriptionStatus creditMonthResetDate"
    );

    if (!user) {
      console.error(`[Credits] ❌ User not found: ${userId}`);
      return null;
    }

    // Check if Pro monthly credits need reset
    if (user.subscriptionPlan === "Pro") {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

      if (!user.creditMonthResetDate || new Date(user.creditMonthResetDate) < monthStart) {
        console.log(`[Credits] 🔄 Resetting Pro credits during info fetch`);
        
        await User.updateOne(
          { _id: userId },
          {
            aiCredits: 50,
            creditMonthResetDate: monthStart,
          }
        );

        user.aiCredits = 50;
      }
    }

    const isUnlimited = user.subscriptionPlan === "Pro Max" || user.subscriptionPlan === "Premium";

    const info = {
      credits: isUnlimited ? 999999 : (user.aiCredits || 0),
      subscriptionPlan: user.subscriptionPlan || "Free",
      subscriptionStatus: user.subscriptionStatus,
      creditsRemaining: isUnlimited ? 999999 : (user.aiCredits || 0),
      isUnlimited: isUnlimited,
    };

    console.log(`[Credits] ✅ Credit info fetched:`, info);

    return info;
  } catch (error) {
    console.error("[Credits] ❌ Get info error:", error.message);
    return null;
  }
}

/**
 * Add credits to user (for purchases)
 */
export async function addCredits(userId, amount, source = "purchase") {
  try {
    await connectDb();

    console.log(`[Credits] 💰 Adding ${amount} credits to user ${userId} (source: ${source})`);

    const result = await User.updateOne(
      { _id: userId },
      {
        $inc: { aiCredits: amount },
        $set: { 
          lastCreditPurchaseDate: new Date(),
          lastCreditPurchaseAmount: amount,
        },
      }
    );

    if (result.modifiedCount === 0) {
      console.error(`[Credits] ❌ Failed to add credits - user not found`);
      return { success: false, message: "User not found" };
    }

    const user = await User.findById(userId).select("aiCredits");

    console.log(`[Credits] ✅ Credits added successfully:`, {
      added: amount,
      newBalance: user.aiCredits,
    });

    return {
      success: true,
      message: "Credits added successfully",
      newBalance: user.aiCredits,
      added: amount,
    };
  } catch (error) {
    console.error("[Credits] ❌ Add credits error:", error.message);
    return {
      success: false,
      message: "Failed to add credits",
      error: error.message,
    };
  }
}