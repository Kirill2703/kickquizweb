import express from "express";
import Quiz from "../models/quiz.mjs";

const router = express.Router();

// Создать новый квиз
router.post("/create", async (req, res) => {
  try {
    const { title, complexity, quantityPoints, qantityQuestions, available } =
      req.body;
    const newQuiz = await Quiz.create({
      title,
      complexity,
      quantityPoints,
      qantityQuestions,
      available,
    });
    res.status(201).json(newQuiz);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить все квизы
router.get("/", async (req, res) => {
  try {
    const quizzes = await Quiz.find();
    res.status(200).json(quizzes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить квиз по ID
router.get("/:id", async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
    res.status(200).json(quiz);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
