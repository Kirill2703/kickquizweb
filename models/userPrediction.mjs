import mongoose from "mongoose";

const userPredictionSchema = new mongoose.Schema({
  username: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  predictionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Prediction",
    required: true,
  },
  betPoints: {
    type: Number,
    required: true,
  },
  selectedTeam: {
    type: String,
    required: true, // Хранит команду, которую пользователь выбрал
  },
  usernameString: {
    type: String,
    required: true,
  },
});

const UserPrediction = mongoose.model("UserPrediction", userPredictionSchema);

export default UserPrediction;
