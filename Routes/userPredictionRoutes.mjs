import express from "express";
import UserPrediction from "../models/userPrediction.mjs";

const router = express.Router();

// Создать предсказание пользователя
router.post("/create", async (req, res) => {
  try {
    const { userId, quizId, prediction } = req.body;
    const newUserPrediction = await UserPrediction.create({
      userId,
      quizId,
      prediction,
    });
    res.status(201).json(newUserPrediction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить все предсказания пользователей
router.get("/", async (req, res) => {
  try {
    const userPredictions = await UserPrediction.find();
    res.status(200).json(userPredictions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
