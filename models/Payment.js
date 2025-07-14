import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const PaymentSchema = new Schema(
  {
    name: { type: String, required: true },
    to_user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    oid: { type: String, required: true },  // Changed from ObjectId to String
    message: { type: String },
    amount: { type: Number, required: true },
    done: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Export the Payment model
export default models.Payment || model("Payment", PaymentSchema);
