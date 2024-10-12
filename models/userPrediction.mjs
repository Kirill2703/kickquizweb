import mongoose from "mongoose";

const userPredictionSchema = new mongoose.Schema({
  userId: {
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
    type: String, // Хранит команду, которую пользователь выбрал
  },
  // status: {
  //   type: String, // Например, "win" или "lose"
  // },
});

const UserPrediction = mongoose.model("UserPrediction", userPredictionSchema);

export default UserPrediction;
