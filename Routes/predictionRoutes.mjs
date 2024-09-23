import express from "express";
import Prediction from "../models/prediction.mjs";

const router = express.Router();

// Создать предсказание
router.post("/create", async (req, res) => {
  try {
    const { quizId, prediction } = req.body;
    const newPrediction = await Prediction.create({ quizId, prediction });
    res.status(201).json(newPrediction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить все предсказания
router.get("/", async (req, res) => {
  try {
    const predictions = await Prediction.find();
    res.status(200).json(predictions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
