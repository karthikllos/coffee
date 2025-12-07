import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: String,
    password: {
      type: String,
      select: false,
    },
    profilepic: String,

    // Subscription Details
    subscriptionPlan: {
      type: String,
      enum: ["Free", "Starter", "Pro", "Pro Max", "Premium"],
      default: "Free",
    },
    subscriptionStatus: {
      type: String,
      enum: ["inactive", "active", "cancelled", "expired"],
      default: "inactive",
    },
    subscriptionStartDate: Date,
    subscriptionRenewalDate: Date,

    // Credits system based on tier
    credits: {
      type: Number,
      default: 0,
    },
    creditsUsed: {
      type: Number,
      default: 0,
    },

    // Payment history
    paymentHistory: [
      {
        razorpayPaymentId: String,
        razorpayOrderId: String,
        plan: String,
        amount: Number,
        status: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
