import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  name: String,
  username: {
    type: String,
    required: true,
    unique: true,
  },
  profilepic: String,
});

// Prevent model overwrite error in dev
export default mongoose.models.User || mongoose.model("User", UserSchema);
