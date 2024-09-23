import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  chatId: {
    type: String,
    unique: true,
    required: true,
  },
  username: {
    type: String,
    unique: true, 
    sparse: true, 
  },
  points: {
    type: Number,
    default: 10,
  },
});

const User = mongoose.model("User", userSchema);

export default User;