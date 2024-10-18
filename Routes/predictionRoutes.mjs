import express from "express";
import Prediction from "../models/prediction.mjs";
import User from "../models/users.mjs";
import UserPrediction from "../models/userPrediction.mjs";

const router = express.Router();

// Создать предсказание
router.post("/create", async (req, res) => {
  try {
    const { quizId, prediction } = req.body;
    const newPrediction = await Prediction.create({ quizId, prediction });
    res.status(201).json(newPrediction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить все предсказания
router.get("/", async (req, res) => {
  try {
    const predictions = await Prediction.find();
    res.status(200).json(predictions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/updateresult", async (req, res) => {
  try {
    const { predictionId, result } = req.body; // `result` в формате "2-1"

    if (
      !predictionId ||
      !result ||
      typeof result !== "string" ||
      !result.match(/^\d+-\d+$/)
    ) {
      return res.status(400).json({ message: "Неверный формат данных." });
    }

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

    res.status(200).json({
      message: "Результат матча обновлен.",
      updatedPredictionsCount: userPredictions.length, // Количество обновленных прогнозов
      updatedPrediction: prediction,
    });
  } catch (error) {
    console.error("Ошибка при обновлении результата:");
    res.status(500).json({ error: error.message });
  }
});

router.get("/history/:username", async (req, res) => {
  const username = req.params.username;

  try {
    const userPrediction = await UserPrediction.find({ usernameString: username });

    if (!userPrediction.length) {
      return res.status(404).json({ message: "История прогнозов пуста." });
    }

    const predictions = await Promise.all(
      userPrediction.map(async (userPrediction) => {
        const prediction = await Prediction.findById(
          userPrediction.predictionId
        );
        return {
          ...userPrediction._doc,
          match: `${prediction.team1} vs ${prediction.team2}`,
          result: prediction.result,
          outcome: getOutcome,
        };
      })
    );
    res.status(200).json(predictions);
  } catch (error) {
    console.error("Ошибка при получении истории прогнозов:", error.message);
    res.status(500).json({ error: error.message });
  }
});

function getOutcome(prediction, userPrediction) {
  const [team1Goals, team2Goals] = prediction.result.split("-").map(Number);
  const userSelectedTeam = userPrediction.selectedTeam;

  if (userSelectedTeam === prediction.team1) {
    if (team1Goals > team2Goals) return "Win";
    if (team1Goals === team2Goals) return "draw";
    return "Lose";
  }

  if (userSelectedTeam === prediction.team2) {
    if (team2Goals > team1Goals) return "Win";
    if (team1Goals === team2Goals) return "draw";
    return "Lose";
  }

  return "Lose";
}

export default router;
