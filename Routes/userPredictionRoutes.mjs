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

router.post("/updateresult", async (req, res) => {
  try {
    const { predictionId, result } = req.body; // `result` в формате "2-1"

    // Находим предсказание
    const prediction = await Prediction.findById(predictionId);
    if (!prediction) {
      return res.status(404).json({ message: "Прогноз не найден." });
    }

    // Получаем всех пользователей с прогнозами на этот матч
    const userPredictions = await UserPrediction.find({ predictionId });

    // Преобразуем результат в количество голов
    const [team1Goals, team2Goals] = result.split("-").map(Number);

    for (const userPrediction of userPredictions) {
      const userSelectedTeam = userPrediction.selectedTeam; // Команда, которую выбрал пользователь
      const betPoints = userPrediction.betPoints; // Получаем ставку пользователя

      // Логика определения выигрышных/проигрышных прогнозов
      if (userSelectedTeam === prediction.team1) {
        // Если пользователь выбрал team1
        if (team1Goals > team2Goals) {
          // Победа team1
          await User.findByIdAndUpdate(userPrediction.username, {
            $inc: { points: betPoints * 2 },
          }); // Умножаем на 2 за правильный прогноз
        } else if (team1Goals === team2Goals) {
          // Ничья
          await User.findByIdAndUpdate(userPrediction.username, {
            $inc: { points: betPoints },
          }); // Возвращаем ставку
        }
        // В противном случае ничего не делаем, если team1 проиграла
      } else if (userSelectedTeam === prediction.team2) {
        // Если пользователь выбрал team2
        if (team2Goals > team1Goals) {
          // Победа team2
          await User.findByIdAndUpdate(userPrediction.username, {
            $inc: { points: betPoints * 2 },
          }); // Умножаем на 2 за правильный прогноз
        } else if (team1Goals === team2Goals) {
          // Ничья
          await User.findByIdAndUpdate(userPrediction.username, {
            $inc: { points: betPoints },
          }); // Возвращаем ставку
        }
        // В противном случае ничего не делаем, если team2 проиграла
      }
    }

    // Обновляем результат в модели предсказания
    prediction.result = result;
    await prediction.save();

    res.status(200).json({ message: "Результат матча обновлен." });
  } catch (error) {
    console.error("Ошибка при обновлении результата:", error.message);
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
