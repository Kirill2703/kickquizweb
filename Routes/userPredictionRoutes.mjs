import express from "express";
import UserPrediction from "../models/userPrediction.mjs";
import Prediction from "../models/prediction.mjs";
import User from "../models/users.mjs";

const router = express.Router();

router.post("/create", async (req, res) => {
  try {
    const { username, predictionId, selectedTeam, betPoints } = req.body;

    if (!betPoints) {
      return res
        .status(400)
        .json({ message: "Количество очков для ставки не указано" });
    }

    const user = await User.findOne({ username });

    if (!user) {
      console.warn(`Пользователь с именем "${username}" не найден.`);
      return res.status(404).json({ message: "Пользователь не найден." });
    }
    

    if (user.points < betPoints) {
      return res.status(400).json({ message: "Недостаточно очков для ставки" });
    }

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
      betPoints,
    });

    // Логируем успешно созданный прогноз
    console.log("Новый прогноз успешно создан:", newUserPrediction);

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $inc: { points: -betPoints } }, // Списываем очки
      { new: true } // Возвращаем обновленного пользователя
    );

    console.log(
      `Очки пользователя "${user.username}" обновлены. Осталось очков: ${updatedUser.points}`
    );

    res.status(201).json({ newUserPrediction, updatedUser });
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
