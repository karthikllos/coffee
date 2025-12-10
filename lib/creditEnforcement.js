// lib/creditEnforcement.js
import { connectDb } from "./connectDb";
import User from "../models/user";

export const CREDIT_COSTS = {
    AI_NOTES: 1,
    AI_QUIZ: 2,
    FOCUS_PREDICTION: 1,
    REFLECTION: 0,
};

// Monthly credit allotments for subscription plans
const MONTHLY_PLAN_CREDITS = {
    'Pro': 50,
    'Starter': 10,
    'Free': 5,
    'Premium': 1000, // Unlimited for most practical purposes
    'Pro Max': 500   // High limit for Pro Max users
};

/**
 * Check and reset monthly credits if needed
 */
async function checkAndResetMonthlyCredits(user) {
    const plan = user.subscriptionPlan;
    const monthlyAllotment = MONTHLY_PLAN_CREDITS[plan] || 0;

    // Unlimited plans don't need reset
    if (!monthlyAllotment || plan === "Premium") {
        return user;
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    // Check if we need to reset (no reset date OR last reset was before this month)
    if (!user.creditMonthResetDate || new Date(user.creditMonthResetDate) < monthStart) {
        console.log(`[Credits] 🔄 Monthly reset for ${plan} user ${user._id}`);
        
        // Set credits to monthly allotment, but don't reduce if user has more
        const newCredits = Math.max(user.aiCredits || 0, monthlyAllotment);
        
        await User.updateOne(
            { _id: user._id },
            {
                $set: {
                    aiCredits: newCredits,
                    creditMonthResetDate: monthStart,
                }
            }
        );
        
        user.aiCredits = newCredits;
        user.creditMonthResetDate = monthStart;
    }

    return user;
}

/**
 * Enforce credit check and deduction atomically
 */
export async function enforceCredits(userId, feature) {
    const session = await User.startSession();
    session.startTransaction();

    try {
        await connectDb();
        const cost = CREDIT_COSTS[feature] || 0;
        
        // Get user with session for transaction
        const user = await User.findById(userId).session(session);
        if (!user) {
            throw new Error('User not found');
        }

        // Handle premium users
        if (user.subscriptionPlan === 'Premium' || user.subscriptionPlan === 'Pro Max') {
            await session.commitTransaction();
            return { success: true, creditsRemaining: 999999, isUnlimited: true };
        }

        // Check and reset monthly credits if needed
        await checkAndResetMonthlyCredits(user);

        // Check if user has enough credits
        if ((user.aiCredits || 0) < cost) {
            throw new Error('Insufficient credits');
        }

        // Deduct credits
        user.aiCredits = (user.aiCredits || 0) - cost;
        await user.save({ session });
        
        await session.commitTransaction();
        
        return {
            success: true,
            creditsDeducted: cost,
            creditsRemaining: user.aiCredits,
            isUnlimited: false
        };
    } catch (error) {
        await session.abortTransaction();
        console.error('Credit enforcement failed:', error);
        throw error;
    } finally {
        session.endSession();
    }
}

/**
 * Add credits to user account
 */
export async function addCredits(userId, amount, source = 'purchase') {
    if (amount <= 0) {
        throw new Error('Invalid credit amount');
    }

    const session = await User.startSession();
    session.startTransaction();

    try {
        await connectDb();
        
        const user = await User.findById(userId).session(session);
        if (!user) {
            throw new Error('User not found');
        }

        const previousCredits = user.aiCredits || 0;
        user.aiCredits = previousCredits + amount;
        
        // Add to payment history
        user.paymentHistory = user.paymentHistory || [];
        user.paymentHistory.push({
            date: new Date(),
            amount,
            source,
            previousBalance: previousCredits,
            newBalance: user.aiCredits
        });

        await user.save({ session });
        await session.commitTransaction();

        return {
            success: true,
            previousCredits,
            newCredits: user.aiCredits,
            added: amount
        };
    } catch (error) {
        await session.abortTransaction();
        console.error('Failed to add credits:', error);
        throw error;
    } finally {
        session.endSession();
    }
}

/**
 * Get user's credit information
 */
export async function getUserCreditInfo(userId) {
    await connectDb();
    
    const user = await User.findById(userId).select(
        'aiCredits subscriptionPlan subscriptionStatus creditMonthResetDate'
    );

    if (!user) {
        throw new Error('User not found');
    }

    // Handle monthly reset if needed
    await checkAndResetMonthlyCredits(user);

    const monthlyAllotment = MONTHLY_PLAN_CREDITS[user.subscriptionPlan] || 0;
    const isUnlimited = user.subscriptionPlan === 'Premium';

    return {
        creditsRemaining: user.aiCredits || 0,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionStatus: user.subscriptionStatus,
        isUnlimited,
        monthlyAllotment,
        resetDate: user.creditMonthResetDate
    };
}