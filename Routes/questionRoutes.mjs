import express from "express";
import Question from "../models/question.mjs";

const router = express.Router();

router.post("/create", async (req, res) => {
  try {
    const { quizId, questionText, options, correctAnswer, points } = req.body;
    const newQuestion = await Question.create({
      quizId,
      questionText,
      options,
      correctAnswer,
      points,
    });
    res.status(201).json(newQuestion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.get("/:quizId", async (req, res) => {
  try {
    const { quizId } = req.params;
    const questions = await Question.find({ quizId });
    res.status(200).json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
