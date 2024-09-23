import express from "express";
import UserQuizProgress from "../models/userQuizProgress.mjs";

const router = express.Router();

// Создать прогресс пользователя по квизу
router.post("/create", async (req, res) => {
  try {
    const { userId, quizId, progress } = req.body;
    const newUserQuizProgress = await UserQuizProgress.create({
      userId,
      quizId,
      progress,
    });
    res.status(201).json(newUserQuizProgress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить весь прогресс пользователей
router.get("/", async (req, res) => {
  try {
    const progress = await UserQuizProgress.find();
    res.status(200).json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
