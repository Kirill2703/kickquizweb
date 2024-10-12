import express from "express";
import UserPrediction from "../models/userPrediction.mjs";
import User from "../models/users.mjs";

const router = express.Router();

router.post("/create", async (req, res) => {
  try {
    const { username, predictionId, selectedTeam } = req.body;

    // Логируем входящие данные
    console.log("Полученные данные для создания прогноза:", {
      username,
      predictionId,
      selectedTeam,
    });

    if (!username || !predictionId || !selectedTeam) {
      console.warn("Ошибка: Пропущены обязательные поля.");
      return res
        .status(400)
        .json({ message: "Все поля должны быть заполнены." });
    }

    // Найдите пользователя по имени
    console.log("Поиск пользователя с именем:", username);
    const user = await User.findOne({ username });

    if (!user) {
      console.warn(`Пользователь с именем "${username}" не найден.`);
      return res.status(404).json({ message: "Пользователь не найден." });
    }

    // Логируем найденного пользователя
    console.log("Найден пользователь:", user);

    // Проверка, существует ли прогноз для этого пользователя
    const existingPrediction = await UserPrediction.findOne({
      username: user._id,
      predictionId,
    });

    if (existingPrediction) {
      console.warn(
        "Прогноз уже существует для этого пользователя на этот матч."
      );
      return res
        .status(400)
        .json({ message: "Вы уже сделали прогноз на этот матч" });
    }

    // Создаем новый прогноз для пользователя
    const newUserPrediction = await UserPrediction.create({
      username: user._id, // Храним ObjectId пользователя
      predictionId,
      selectedTeam,
      usernameString: user.username, // Храним строковое имя пользователя
    });

    // Логируем успешно созданный прогноз
    console.log("Новый прогноз успешно создан:", newUserPrediction);

    res.status(201).json(newUserPrediction);
  } catch (error) {
    console.error("Ошибка при создании прогноза:", error.message);
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
