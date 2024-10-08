import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import adminChatIds from "./config.mjs";
import dbConnect from "./db/dbconnect.mjs";
import Quiz from "./models/quiz.mjs";
import Prediction from "./models/prediction.mjs";
import Question from "./models/question.mjs";
import UserPrediction from "./models/userPrediction.mjs";
import UserQuizProgress from "./models/userQuizProgress.mjs";
import User from "./models/users.mjs";
import quizRoutes from "./Routes/quizRoutes.mjs"
import predictionRoutes from "./Routes/predictionRoutes.mjs";
import questionRoutes from "./Routes/questionRoutes.mjs";
import userPredictionRoutes from "./Routes/userPredictionRoutes.mjs";
import userQuizProgressRoutes from "./Routes/userQuizProgressRoutes.mjs";
import userRoutes from "./Routes/userRoutes.mjs";
import mongoose from "mongoose";
import express from "express";
import cors from "cors";



dotenv.config();

const app = express();

app.use(express.json());

const token = process.env.TOKEN_BOT;
const webAppUrl = "https://euphonious-pastelito-f54754.netlify.app";
const bot = new TelegramBot(token, { polling: true });
const dbUri = process.env.DATA_BASE;

if (!dbUri) {
  console.error("ERROR: DATABASE URI not provided.");
  process.exit(1);
}

dbConnect.on("error", () => {
  console.log("Connect Error DB");
});
dbConnect.on("connected", () => {
  console.log("Connected DB");
});

app.use(cors())

app.use('/api/quiz', quizRoutes)
app.use("/api/prediction", predictionRoutes);
app.use("/api/question", questionRoutes);
app.use("/api/user-prediction", userPredictionRoutes);
app.use("/api/user-quiz-progress", userQuizProgressRoutes);
app.use("/api/user", userRoutes);

app.listen(process.env.PORT || 4000, () => {
  console.log(`Server is running on port ${process.env.PORT || 5000}`);
});

// Проверка, является ли пользователь администратором
const checkIfAdmin = (chatId) => adminChatIds.includes(chatId.toString());

// Команда /start
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  console.log("Chat ID:", chatId);
  const text = msg.text;

  try {
    // Проверяем, есть ли пользователь в базе данных
    let user = await User.findOne({ chatId });

    // Если пользователь не найден, создаем нового пользователя
    if (!user) {
      user = new User({
        chatId: chatId,
        username: msg.from.username || "Unknown", // Телеграм-имя пользователя или "Unknown", если отсутствует
        points: 10, // Начальные очки
      });

      await user.save();
      bot.sendMessage(chatId, `Привет, ${user.username}`);
    }

    // Обработка команды /start
    if (text === "/start") {
      await bot.sendMessage(chatId, `Welcome, ${user.username} Please choose an option:`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Choose form!", web_app: { url: webAppUrl } }],
          ],
        },
      });
    }
  } catch (error) {
    console.error("Error handling /start command:", error);
    bot.sendMessage(chatId, "Произошла ошибка при обработке вашей команды.");
  }
});

// Команда /createquiz
bot.onText(/\/createquiz/, async (msg) => {
  const chatId = msg.chat.id;

  if (!checkIfAdmin(chatId)) {
    return bot.sendMessage(chatId, "You are not authorized to create quizzes.");
  }

  bot.sendMessage(chatId, "Enter the quiz title:");

  bot.once("message", async (msg) => {
    const title = msg.text;

    bot.sendMessage(chatId, "Enter the quiz start date (YYYY-MM-DD):");

    bot.once("message", async (msg) => {
      const startDate = msg.text;

      bot.sendMessage(chatId, "Enter the duration of the quiz in days:");

      bot.once("message", async (msg) => {
        const durationDays = parseInt(msg.text, 10);

        try {
          const quiz = await Quiz.create({ title, startDate, durationDays });
          bot.sendMessage(
            chatId,
            `Quiz '${quiz.title}' created successfully! Use /addquestion to add questions.`
          );
        } catch (error) {
          console.error("Error creating quiz:", error);
          bot.sendMessage(chatId, "Error creating quiz. Please try again.");
        }
      });
    });
  });
});

// Команда /addquestion
bot.onText(/\/addquestion/, async (msg) => {
  const chatId = msg.chat.id;

  if (!checkIfAdmin(chatId)) {
    return bot.sendMessage(chatId, "You are not authorized to add questions.");
  }

  bot.sendMessage(chatId, "Enter the quiz ID to add questions:");

  bot.once("message", async (msg) => {
    const quizId = new mongoose.Types.ObjectId(msg.text);

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return bot.sendMessage(
        chatId,
        "Quiz not found. Please check the ID and try again."
      );
    }

    bot.sendMessage(chatId, "Enter the day of the quiz:");

    bot.once("message", async (msg) => {
      const day = parseInt(msg.text, 10);

      bot.sendMessage(chatId, `Enter the question for day ${day}:`);

      bot.once("message", async (msg) => {
        const questionText = msg.text;

        bot.sendMessage(chatId, "Enter the answer options (comma-separated):");

        bot.once("message", async (msg) => {
          const options = msg.text.split(",").map((opt) => opt.trim());

          bot.sendMessage(chatId, "Enter the correct answer:");

          bot.once("message", async (msg) => {
            const correctAnswer = msg.text.trim();

            try {
              await Question.create({
                quizId,
                day,
                questionText,
                options,
                correctAnswer,
              });
              bot.sendMessage(
                chatId,
                `Question for day ${day} added successfully!`
              );
            } catch (error) {
              console.error("Error adding question:", error);
              bot.sendMessage(
                chatId,
                "Error adding question. Please try again."
              );
            }
          });
        });
      });
    });
  });
});

// Функция для начала квиза для пользователя
const startQuizForUser = async (chatId, quizId) => {
  const user = await User.findOne({ chatId });
  const quiz = await Quiz.findById(quizId);

  if (!user || !quiz) {
    return bot.sendMessage(chatId, "Quiz or user not found.");
  }

  const today = new Date();
  const quizStart = new Date(quiz.startDate);
  const dayOfQuiz = Math.floor((today - quizStart) / (1000 * 60 * 60 * 24)) + 1;

  if (dayOfQuiz > quiz.durationDays) {
    return bot.sendMessage(chatId, "This quiz is over.");
  }

  const progress = await UserQuizProgress.findOne({
    userId: user._id,
    quizId,
    day: dayOfQuiz,
  });

  if (progress && progress.questionsAnswered >= 3) {
    return bot.sendMessage(chatId, "You have already completed today's quiz.");
  }

  const questions = await Question.find({ quizId, day: dayOfQuiz });

  for (const question of questions) {
    await askQuestion(chatId, question, user._id, quizId, dayOfQuiz);
  }
};

// Функция для обработки вопросов квиза
const askQuestion = async (chatId, question, userId, quizId, day) => {
  const options = question.options.map((opt) => ({
    text: opt,
    callback_data: opt,
  }));

  bot.sendMessage(chatId, question.questionText, {
    reply_markup: {
      inline_keyboard: [options],
    },
  });

  bot.once("callback_query", async (answer) => {
    if (answer.data === question.correctAnswer) {
      bot.sendMessage(chatId, "Correct!");
      await User.updateOne({ _id: userId }, { $inc: { points: 10 } });
    } else {
      bot.sendMessage(chatId, "Wrong answer.");
    }

    await UserQuizProgress.updateOne(
      { userId, quizId, day },
      { $inc: { questionsAnswered: 1 } },
      { upsert: true }
    );
  });
};



// Команда /createprediction
bot.onText(/\/createprediction/, async (msg) => {
  const chatId = msg.chat.id;

  if (!checkIfAdmin(chatId)) {
    return bot.sendMessage(
      chatId,
      "You are not authorized to create predictions."
    );
  }

  bot.sendMessage(chatId, "Enter the first team:");

  bot.once("message", async (msg) => {
    const team1 = msg.text;

    bot.sendMessage(
      chatId,
      "Enter the draw (optional, leave blank if not applicable):"
    );

    bot.once("message", async (msg) => {
      const draw = msg.text || null;

      bot.sendMessage(chatId, "Enter the second team:");

      bot.once("message", async (msg) => {
        const team2 = msg.text;

        bot.sendMessage(chatId, "Input the country of match");

        bot.once("message", async (msg) => {
          const country = msg.text;

          bot.sendMessage(chatId, "Enter the match date (YYYY-MM-DD):");

          bot.once("message", async (msg) => {
            const date = new Date(msg.text);

            try {
              await Prediction.create({ team1, draw, team2, date, country });
              bot.sendMessage(
                chatId,
                `Prediction for ${team1} vs ${team2} created! Country: ${country}`
              );
            } catch (error) {
              console.error("Error creating prediction:", error);
              bot.sendMessage(
                chatId,
                "Error creating prediction. Please try again."
              );
            }
          });
        });
      });
    });
  });
});

// Команда /bet
// Команда /bet
bot.onText(/\/bet/, async (msg) => {
  const chatId = msg.chat.id;
  const user = await User.findOne({ chatId });

  if (!user || user.points <= 0) {
    return bot.sendMessage(
      chatId,
      "You don't have enough points to place a bet."  
    );
  }

  // Получаем все доступные матчи из базы данных
  const predictions = await Prediction.find({ date: { $gte: new Date() } });

  if (predictions.length === 0) {
    return bot.sendMessage(chatId, "There are no available matches to bet on.");
  }

  // Формируем кнопки с матчами
  const matchOptions = predictions.map((prediction) => ({
    text: `${prediction.team1} vs ${prediction.team2}`,
    callback_data: prediction._id.toString(),
  }));

  // Отправляем пользователю кнопки с доступными матчами
  bot.sendMessage(chatId, "Choose a match to bet on:", {
    reply_markup: {
      inline_keyboard: matchOptions.map((match) => [match]), // каждая кнопка на новой строке
    },
  });

  // Обработка нажатия на кнопку с матчем
  bot.once("callback_query", async (callbackQuery) => {
    const predictionId = callbackQuery.data;
    const prediction = await Prediction.findById(predictionId);

    if (!prediction) {
      return bot.sendMessage(chatId, "No such match found.");
    }

    // Предложение выбрать команду для ставки
    const teamOptions = [
      [{ text: prediction.team1, callback_data: `team1:${predictionId}` }],
      [{ text: prediction.team2, callback_data: `team2:${predictionId}` }],
    ];

    bot.sendMessage(chatId, "Choose a team to bet on:", {
      reply_markup: {
        inline_keyboard: teamOptions,
      },
    });

    // Обработка выбора команды
    bot.once("callback_query", async (callbackQuery) => {
      const [team, selectedMatchId] = callbackQuery.data.split(":");

      // Спрашиваем пользователя, сколько очков он хочет поставить
      bot.sendMessage(
        chatId,
        `Enter the number of points to bet (you have ${user.points} points):`
      );

      bot.once("message", async (msg) => {
        const betPoints = parseInt(msg.text, 10);

        if (betPoints > user.points) {
          return bot.sendMessage(chatId, "You don't have enough points.");
        }

        await UserPrediction.create({
          userId: user._id,
          predictionId: selectedMatchId,
          betPoints,
          guessedWinner: team, // Сохраняем выбранную команду
          status: "pending",
        });
        await User.updateOne(
          { _id: user._id },
          { $inc: { points: -betPoints } }
        );

        bot.sendMessage(
          chatId,
          `Bet of ${betPoints} points placed on ${
            team === "team1" ? prediction.team1 : prediction.team2
          }.`
        );
      });
    });
  });
});

const notifyUsersAboutResult = async (match, result) => {
  const users = await User.find(); // Получаем всех пользователей
  for (const user of users) {
    await bot.sendMessage(
      user.chatId,
      `Результат матча ${match} обновлен на ${result}.`
    );
  }
};

bot.onText(/\/updateresult/, async (msg) => {
  const chatId = msg.chat.id;

  // Получаем все матчи
  const predictions = await Prediction.find();
  if (!predictions || predictions.length === 0) {
    return bot.sendMessage(chatId, "Матчи не найдены.");
  }

  const options = predictions.map((pred) => ({
    text: `${pred.team1} vs ${pred.team2}`,
    callback_data: pred._id.toString(),
  }));

  bot.sendMessage(chatId, "Выберите матч для обновления результата:", {
    reply_markup: {
      inline_keyboard: [options],
    },
  });

  bot.once("callback_query", async (callbackQuery) => {
    const matchId = callbackQuery.data;
    const match = await Prediction.findById(matchId);

    if (!match) {
      return bot.sendMessage(chatId, "Матч не найден.");
    }

    bot.sendMessage(
      chatId,
      `Введите результат для ${match.team1} vs ${match.team2} (например, 2-1):`
    );

    bot.once("message", async (msg) => {
      const result = msg.text; // Результат матча
      const [team1Score, team2Score] = result.split("-").map(Number);

      if (isNaN(team1Score) || isNaN(team2Score)) {
        return bot.sendMessage(
          chatId,
          "Введите результат в правильном формате (например, 2-1)."
        );
      }

      try {
        // Обновляем результат и статус матча
        const updateResult = await Prediction.updateOne(
          { _id: matchId },
          { result, status: "завершен" }
        );

        if (updateResult.nModified === 0) {
          throw new Error("Не удалось обновить матч.");
        }

        // Начисление очков пользователям
        const predictionsForMatch = await UserPrediction.find({
          predictionId: matchId,
        });

        if (!predictionsForMatch || predictionsForMatch.length === 0) {
          console.log(`Прогнозы на матч ${matchId} не найдены.`);
          return bot.sendMessage(chatId, "Прогнозы для матча не найдены.");
        }

        console.log(
          `Найдено ${predictionsForMatch.length} прогнозов для матча.`
        ); // Лог

        for (const userPrediction of predictionsForMatch) {
          const user = await User.findById(userPrediction.userId);
          if (!user || !user.chatId) {
            console.log(
              `Пользователь не найден или у пользователя нет chatId: ${userPrediction.userId}`
            ); // Лог
            continue;
          }

          console.log(`Проверка прогноза для пользователя: ${user.chatId}`);

          if (team1Score === team2Score) {
            // Ничья
            await User.updateOne(
              { _id: user._id },
              { $inc: { points: userPrediction.betPoints } }
            );
            await UserPrediction.updateOne(
              { _id: userPrediction._id },
              { status: "returned" } // Обновление статуса
            );
            await bot.sendMessage(
              user.chatId,
              `Ваш прогноз на матч ${match.team1} vs ${match.team2} завершился ничьей. Вам начислено ${userPrediction.betPoints} очко.`
            );
          } else {
            const correctTeam = team1Score > team2Score ? "team1" : "team2"; // Определение победившей команды

            if (userPrediction.guessedWinner === correctTeam) {
              // Если пользователь угадал победителя
              const rewardPoints = userPrediction.betPoints * 2;
              await User.updateOne(
                { _id: user._id },
                { $inc: { points: rewardPoints } }
              );
              await UserPrediction.updateOne(
                { _id: userPrediction._id },
                { status: "won" } // Обновление статуса
              );
              await bot.sendMessage(
                user.chatId,
                `Ваш прогноз на матч ${match.team1} vs ${match.team2} оказался верным. Вам начислено ${rewardPoints} очка.`
              );
            } else {
              // Если пользователь не угадал победителя
              await UserPrediction.updateOne(
                { _id: userPrediction._id },
                { status: "lost" } // Обновление статуса
              );
              await bot.sendMessage(
                user.chatId,
                `Ваш прогноз на матч ${match.team1} vs ${match.team2} оказался неверным. Ваши ${userPrediction.betPoints} очков сгорели.`
              );
            }
          }
        }

        bot.sendMessage(
          chatId,
          `Результат матча ${match.team1} vs ${match.team2} обновлен на ${result}.`
        );

        // Уведомление всех пользователей
        notifyUsersAboutResult(`${match.team1} vs ${match.team2}`, result);
      } catch (error) {
        console.error("Ошибка при обновлении матча:", error);
        bot.sendMessage(
          chatId,
          "Ошибка при обновлении матча. Пожалуйста, попробуйте снова."
        );
      }
    });
  });
});
