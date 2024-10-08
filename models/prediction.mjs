import mongoose from "mongoose";

const predictionSchema = new mongoose.Schema({
  team1: {
    type: String,
    required: true,
  },
  draw: {
    type: String,
  },
  team2: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  result: {
    type: String, // Результат матча
  },
  status: {
    type: String,
    enum: ["pending", "завершен"], // Добавляем статусы для удобства
    default: "pending", // Устанавливаем статус по умолчанию
  },
});

const Prediction = mongoose.model("Prediction", predictionSchema);

export default Prediction;
