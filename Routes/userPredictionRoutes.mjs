import express from "express";
import UserPrediction from "../models/userPrediction.mjs";

const router = express.Router();

// Создать предсказание пользователя
router.post("/create", async (req, res) => {
  try {
    const { userId, predictionId, selectedTeam } = req.body;
    if (existingPrediction) {
      return res
        .status(400)
        .json({ message: "Вы уже сделали прогноз на этот матч" });
    }

    // Создаем новый прогноз для пользователя
    const newUserPrediction = await UserPrediction.create({
      userId,
      predictionId,
      selectedTeam,
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
