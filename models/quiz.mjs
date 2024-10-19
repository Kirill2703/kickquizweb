import mongoose from "mongoose";

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  complexity: {
    type: String,
    required: true,
  },
  quantityPoints: {
    type: Number,
    required: true,
  },
  qantityQuestions: {
    type: Number,
    required: true,
  },
  available: {
    type: Date,
    required: true
  }
});

const Quiz = mongoose.model("Quiz", quizSchema);

export default Quiz;
