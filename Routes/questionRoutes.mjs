import express from "express";
import Question from "../models/question.mjs";

const router = express.Router();

// Создать новый вопрос
router.post("/create", async (req, res) => {
  try {
    const { quizId, text, options, correctOption } = req.body;
    const newQuestion = await Question.create({
      quizId,
      text,
      options,
      correctOption,
    });
    res.status(201).json(newQuestion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить все вопросы
router.get("/", async (req, res) => {
  try {
    const questions = await Question.find();
    res.status(200).json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
