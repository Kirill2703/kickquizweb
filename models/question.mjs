import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
  day: { type: Number, required: true },
  questionText: {
    type: String,
    required: true,
  },
  options: {
    type: [String], // Массив строк для вариантов ответа
    required: true,
  },
  correctAnswer: {
    type: String,
    required: true,
  },
});

const Question = mongoose.model("Question", questionSchema);

export default Question;
