import express from "express";
import User from "../models/users.mjs";

const router = express.Router();

// Создать пользователя
router.post("/create", async (req, res) => {
  try {
    const { name, telegramId } = req.body;
    const newUser = await User.create({ name, telegramId });
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить всех пользователей
router.get("/", async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить имя пользователя по telegramId
router.get("/:telegramId", async (req, res) => {
  try {
    const { telegramId } = req.params;
    const user = await User.findOne({ telegramId });

    if (user) {
      res.status(200).json({ name: user.name });
    } else {
      res.status(404).json({ message: 'Пользователь не найден' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
