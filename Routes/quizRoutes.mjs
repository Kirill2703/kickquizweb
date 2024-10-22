import express from "express";
import Quiz from "../models/quiz.mjs";
import User from "../models/users.mjs";

const router = express.Router();


router.post("/create", async (req, res) => {
  try {
    const { title, complexity, quantityPoints, qantityQuestions, available, winPoints } =
      req.body;
    const newQuiz = await Quiz.create({
      title,
      complexity,
      quantityPoints,
      qantityQuestions,
      available,
      winPoints
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
