import User from "../models/user";
import connectDb from "./connectDb";

const TIER_CREDITS = {
  Free: 0,
  Starter: 50,
  Pro: 200,
  Premium: 1000,
};

export const recordSubscriptionChange = async (userId, planName, paymentId, amount) => {
  await connectDb();

  const now = new Date();
  const renewalDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  try {
    const creditsToAdd = TIER_CREDITS[planName] || 0;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        subscriptionPlan: planName,
        subscriptionStatus: "active",
        subscriptionStartDate: now,
        subscriptionRenewalDate: renewalDate,
        credits: creditsToAdd,
        creditsUsed: 0,
        $push: {
          paymentHistory: {
            razorpayPaymentId: paymentId,
            plan: planName,
            amount: amount,
            status: "completed",
            createdAt: now,
          },
        },
      },
      { new: true }
    );

    console.log(`✅ [Subscription] Updated for user ${userId}:`, {
      plan: planName,
      credits: creditsToAdd,
      renewalDate,
      paymentId,
    });

    return user;
  } catch (error) {
    console.error("❌ [Subscription] Update failed:", error.message);
    throw error;
  }
};

export const getUserCredits = async (userId) => {
  await connectDb();
  const user = await User.findById(userId).select(
    "credits creditsUsed subscriptionPlan subscriptionStatus"
  );

  if (!user) {
    return { available: 0, used: 0, plan: "Free", status: "inactive" };
  }

  return {
    available: Math.max(0, (user.credits || 0) - (user.creditsUsed || 0)),
    used: user.creditsUsed || 0,
    plan: user.subscriptionPlan || "Free",
    status: user.subscriptionStatus,
    total: user.credits || 0,
  };
};

export const deductCredits = async (userId, creditsNeeded, feature) => {
  await connectDb();
  const user = await User.findById(userId);

  if (!user) throw new Error("User not found");

  // Premium users have unlimited credits
  if (user.subscriptionPlan === "Premium") {
    console.log(`✅ [Credits] Premium user using ${feature} - unlimited`);
    return { available: 99999, used: 0, isPremium: true };
  }

  const available = (user.credits || 0) - (user.creditsUsed || 0);

  if (available < creditsNeeded) {
    throw new Error(
      `Insufficient credits. Available: ${available}, Needed: ${creditsNeeded}`
    );
  }

  const updated = await User.findByIdAndUpdate(
    userId,
    { $inc: { creditsUsed: creditsNeeded } },
    { new: true }
  );

  const newAvailable = (updated.credits || 0) - (updated.creditsUsed || 0);

  console.log(`✅ [Credits] Deducted for ${feature}:`, {
    userId,
    deducted: creditsNeeded,
    remaining: newAvailable,
  });

  return {
    available: newAvailable,
    used: updated.creditsUsed,
    plan: updated.subscriptionPlan,
  };
};