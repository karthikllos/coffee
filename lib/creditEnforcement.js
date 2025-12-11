// lib/creditEnforcement.js - FIXED VERSION
import connectDb from "./connectDb";
import User from "../models/user";

export const CREDIT_COSTS = {
    AI_NOTES: 1,
    AI_QUIZ: 2,
    FOCUS_PREDICTION: 1,
    REFLECTION: 0,
    STUDY_GROUP_JOIN: 1,
};

// Monthly credit allotments for subscription plans
const MONTHLY_PLAN_CREDITS = {
    'Pro': 50,
    'Starter': 10,
    'Free': 5,
    'Premium': 999999, // Effectively unlimited
    'Pro Max': 999999   // Effectively unlimited
};

/**
 * Check and reset monthly credits if needed
 */
async function checkAndResetMonthlyCredits(user) {
    const plan = user.subscriptionPlan || 'Free';
    const monthlyAllotment = MONTHLY_PLAN_CREDITS[plan] || 5;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    // Check if we need to reset (no reset date OR last reset was before this month)
    if (!user.creditMonthResetDate || new Date(user.creditMonthResetDate) < monthStart) {
        console.log(`[Credits] 🔄 Monthly reset for ${plan} user ${user._id}`);
        
        // Reset credits to monthly allotment
        await User.updateOne(
            { _id: user._id },
            {
                $set: {
                    aiCredits: monthlyAllotment,
                    creditsUsed: 0, // ✅ Reset usage counter
                    creditMonthResetDate: monthStart,
                }
            }
        );
        
        user.aiCredits = monthlyAllotment;
        user.creditsUsed = 0;
        user.creditMonthResetDate = monthStart;
    }

    return user;
}

/**
 * Initialize credits for new users or users without credits
 */
async function initializeUserCredits(user) {
    const plan = user.subscriptionPlan || 'Free';
    const defaultCredits = MONTHLY_PLAN_CREDITS[plan] || 5;
    
    // If user has no credits set, initialize them
    if (user.aiCredits === undefined || user.aiCredits === null) {
        console.log(`[Credits] 🎁 Initializing credits for ${plan} user ${user._id}`);
        
        await User.updateOne(
            { _id: user._id },
            {
                $set: {
                    aiCredits: defaultCredits,
                    creditsUsed: 0,
                    creditMonthResetDate: new Date(),
                }
            }
        );
        
        user.aiCredits = defaultCredits;
        user.creditsUsed = 0;
    }
    
    return user;
}

/**
 * Enforce credit check and deduction atomically
 */
export async function enforceCredits(userId, feature) {
    try {
        await connectDb();
        const cost = CREDIT_COSTS[feature] || 0;
        
        // Get user
        let user = await User.findById(userId);
        if (!user) {
            return {
                success: false,
                message: 'User not found',
                code: 404
            };
        }

        // ✅ Initialize credits if needed
        user = await initializeUserCredits(user);
        
        // ✅ Check and reset monthly credits
        user = await checkAndResetMonthlyCredits(user);

        // Handle unlimited plans
        if (user.subscriptionPlan === 'Premium' || user.subscriptionPlan === 'Pro Max') {
            console.log(`[Credits] ✅ Unlimited plan user: ${user.subscriptionPlan}`);
            return { 
                success: true, 
                cost: 0,
                creditsRemaining: 999999, 
                isUnlimited: true 
            };
        }

        // Calculate available credits
        const available = (user.aiCredits || 0) - (user.creditsUsed || 0);
        
        console.log(`[Credits] 💳 User ${userId} - Plan: ${user.subscriptionPlan}, Available: ${available}, Cost: ${cost}`);

        // Check if user has enough credits
        if (available < cost) {
            return {
                success: false,
                message: `Insufficient credits. You have ${available} credits but need ${cost}.`,
                creditsRemaining: available,
                code: 402
            };
        }

        // Deduct credits
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $inc: { creditsUsed: cost } },
            { new: true }
        );

        const newAvailable = (updatedUser.aiCredits || 0) - (updatedUser.creditsUsed || 0);
        
        console.log(`[Credits] ✅ Deducted ${cost} credits. Remaining: ${newAvailable}`);
        
        return {
            success: true,
            cost: cost,
            creditsRemaining: newAvailable,
            isUnlimited: false
        };
    } catch (error) {
        console.error('[Credits] ❌ Enforcement failed:', error);
        return {
            success: false,
            message: 'Credit system error',
            code: 500
        };
    }
}

/**
 * Refund credits (for failed operations)
 */
export async function refundCredits(userId, amount, reason = 'refund') {
    try {
        await connectDb();
        
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Don't refund for unlimited plans
        if (user.subscriptionPlan === 'Premium' || user.subscriptionPlan === 'Pro Max') {
            console.log(`[Credits] 💰 No refund needed for unlimited plan`);
            return { success: true };
        }

        // Refund by reducing creditsUsed
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $inc: { creditsUsed: -amount } },
            { new: true }
        );

        // Ensure creditsUsed doesn't go negative
        if (updatedUser.creditsUsed < 0) {
            await User.updateOne({ _id: userId }, { $set: { creditsUsed: 0 } });
        }

        console.log(`[Credits] 💰 Refunded ${amount} credits. Reason: ${reason}`);
        
        return { success: true };
    } catch (error) {
        console.error('[Credits] ❌ Refund failed:', error);
        return { success: false };
    }
}

/**
 * Get user's credit information
 */
export async function getUserCreditInfo(userId) {
    await connectDb();
    
    let user = await User.findById(userId).select(
        'aiCredits creditsUsed subscriptionPlan subscriptionStatus creditMonthResetDate'
    );

    if (!user) {
        throw new Error('User not found');
    }

    // Initialize credits if needed
    user = await initializeUserCredits(user);
    
    // Check monthly reset
    user = await checkAndResetMonthlyCredits(user);

    const plan = user.subscriptionPlan || 'Free';
    const isUnlimited = plan === 'Premium' || plan === 'Pro Max';
    const monthlyAllotment = MONTHLY_PLAN_CREDITS[plan] || 5;
    
    const available = isUnlimited ? 999999 : Math.max(0, (user.aiCredits || 0) - (user.creditsUsed || 0));

    return {
        creditsRemaining: available,
        total: user.aiCredits || 0,
        used: user.creditsUsed || 0,
        subscriptionPlan: plan,
        subscriptionStatus: user.subscriptionStatus,
        isUnlimited,
        monthlyAllotment,
        resetDate: user.creditMonthResetDate
    };
}

/**
 * Add credits to a user's balance (for purchases or manual grants)
 */
export async function addCredits(userId, amount, source = 'purchase', metadata = {}) {
    try {
        await connectDb();

        const incAmount = Number(amount) || 0;
        if (incAmount <= 0) {
            return { success: false, message: 'Amount must be greater than 0' };
        }

        const update = {
            $inc: { aiCredits: incAmount },
            $set: {
                lastCreditPurchaseDate: new Date(),
                lastCreditPurchaseAmount: incAmount,
                lastCreditPaymentId: metadata.paymentId || undefined,
            },
        };

        const user = await User.findByIdAndUpdate(userId, update, { new: true });

        if (!user) {
            return { success: false, message: 'User not found' };
        }

        const available = Math.max(0, (user.aiCredits || 0) - (user.creditsUsed || 0));

        return {
            success: true,
            added: incAmount,
            creditsRemaining: available,
            total: user.aiCredits || 0,
            used: user.creditsUsed || 0,
            source,
            metadata,
        };
    } catch (error) {
        console.error('[Credits] ❌ addCredits failed:', error);
        return { success: false, message: 'Failed to add credits' };
    }
}
