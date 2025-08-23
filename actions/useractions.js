'use server';

import connectDb from "../lib/connectDb";
import Payment from "../models/Payment";
import User from "../models/user";

// Create a payment entry
export const initiateInteraction = async ({ amount, to_username, paymentform, orderId }) => {
  await connectDb();

  try {
    const receiver = await User.findOne({ username: to_username });
    if (!receiver) throw new Error("Recipient user not found");
    if (!orderId) throw new Error("Order ID is required");

    const payment = await Payment.create({
      name: paymentform.name || "Anonymous",
      to_user: receiver._id,
      oid: orderId,
      message: paymentform.message || "",
      amount,
      done: false,
    });

    console.log("✅ Payment interaction stored:", payment._id);
    return { success: true, payment };
  } catch (err) {
    console.error("❌ Error during payment interaction:", err.message);
    return { success: false, error: err.message };
  }
};

// Fetch user by username
export const fetchUser = async (username) => {
    await connectDb();
    const userDoc = await User.findOne({ username }).lean(); // lean converts to plain JS object
    if (!userDoc) return null;
  
    return {
      ...userDoc,
      _id: userDoc._id.toString(),
    };
  };
  

// Fetch payments for a user by username
export const fetchPayments = async (username) => {
    await connectDb();
    const receiver = await User.findOne({ username });
    if (!receiver) return [];
  
    const payments = await Payment.find({ to_user: receiver._id }).lean();
    return payments.map(p => ({
      ...p,
      _id: p._id.toString(),
      to_user: p.to_user.toString(),
    }));
  };
  
