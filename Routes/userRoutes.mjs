import express from "express";
import User from "../models/users.mjs";
import Quiz from "../models/quiz.mjs";

const router = express.Router();

// Создать пользователя
router.post("/create", async (req, res) => {
  try {
    const { username, telegramId } = req.body;
    const newUser = await User.create({ username, telegramId });
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить всех пользователей
router.get("/", async (req, res) => {
  try {
    const users = await User.find().sort({ points: -1 });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить имя пользователя по chatId
router.get("/:chatId", async (req, res) => {
  try {
    const { chatId } = req.params; // Измените на chatId
    console.log("Поиск пользователя с chatId:", chatId); // Логируем chatId
    const user = await User.findOne({ chatId }); // Ищем по chatId

    if (user) {
      res.status(200).json({ user }); // Возвращаем username
    } else {
      console.log("Пользователь не найден"); // Логируем, если пользователь не найден
      res.status(404).json({ message: 'Пользователь не найден' });
    }
  } catch (error) {
    console.error("Ошибка при поиске пользователя:", error.message); // Логируем ошибку
    res.status(500).json({ error: error.message });
  }
});

router.post("/updatepointsquiz/:chatId", async (req, res) => {
  try {
    const { correctAnswers, quizId } = req.body; // Извлекаем chatId из параметров, correctAnswers и quizId из тела запроса
    const { chatId } = req.params;

    console.log("Обновление очков для пользователя:", {
      chatId,
      correctAnswers,
      quizId,
    }); // Логируем входящие данные

    // Находим пользователя по chatId
    const user = await User.findOne({ chatId });
    if (!user) {
      console.log("Пользователь не найден");
      return res.status(404).json({ error: "User not found" });
    }

    // Проверяем, проходил ли пользователь этот квиз ранее
    if (user.completedQuizzes.includes(quizId)) {
      console.log("Квиз уже завершен");
      return res.status(400).json({ error: "Вы уже завершили этот квиз." });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      console.log("Квиз не найден"); // Логируем, если квиз не найден
      return res.status(404).json({ error: "Quiz not found" });
    }

    let pointsToAdd = 0;
    const quantityPoints = quiz.quantityPoints;

    // Логика начисления очков
    if (correctAnswers === 4) {
      pointsToAdd = quantityPoints;
    } else if (correctAnswers === 3) {
      pointsToAdd = Math.floor((quantityPoints * 75) / 100);
    } else if (correctAnswers === 2) {
      pointsToAdd = Math.floor((quantityPoints * 50) / 100);
    } else if (correctAnswers === 1) {
      pointsToAdd = Math.floor((quantityPoints * 25) / 100);
    }

    // Обновляем очки пользователя
    if (user) {
      user.points += pointsToAdd;
      user.completedQuizzes.push(quizId);
      await user.save();
      console.log("Очки пользователя обновлены:", user.points); // Логируем обновленные очки
      return res.status(200).json({ points: user.points });
    }

    console.log("Пользователь не найден"); // Логируем, если пользователь не найден
    return res.status(404).json({ error: "User not found" });
  } catch (error) {
    console.error("Ошибка при обновлении очков:", error.message); // Логируем ошибку
    res.status(500).json({ error: error.message });
  }
});


export default router;
