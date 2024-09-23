import mongoose from "mongoose";

const userQuizProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quiz",
    required: true,
  },
  day: {
    type: Number,
    required: true,
  },
  questionsAnswered: {
    type: Number,
    default: 0,
  },
});

const UserQuizProgress = mongoose.model(
  "UserQuizProgress",
  userQuizProgressSchema
);

export default UserQuizProgress;
