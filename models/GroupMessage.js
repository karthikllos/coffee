// models/GroupMessage.js
import mongoose from "mongoose";

const GroupMessageSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudyGroup",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: [true, "Message content is required"],
      trim: true,
      maxlength: [2000, "Message cannot exceed 2000 characters"],
    },
    attachmentUrl: {
      type: String,
      default: null,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
GroupMessageSchema.index({ group: 1, createdAt: -1 });
GroupMessageSchema.index({ sender: 1, createdAt: -1 });

export default mongoose.models.GroupMessage ||
  mongoose.model("GroupMessage", GroupMessageSchema);