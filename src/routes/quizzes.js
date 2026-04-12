const express = require("express");
const router = express.Router();

const quizzes = require("../data/quizzes");

// GET /quizzes 
// List all quizzes
router.get("/", (req, res) => {
  const { keyword } = req.query;

  if (!keyword) {
    return res.json(quizzes);
  }

  const filteredQuizzes = quizzes.filter(quiz =>
    quiz.keywords.includes(keyword.toLowerCase())
  );

  res.json(filteredQuizzes);
});

// GET /quizzes/:quizId
// Show a specific quiz
router.get("/:quizId", (req, res) => {
  const quizId = Number(req.params.quizId);

  const quiz = quizzes.find((q) => q.id === quizId);

  if (!quiz) {
    return res.status(404).json({ message: "Question not found" });
  }

  res.json(quiz);
});

// POST /quizzes
// Create a new quiz
router.post("/", (req, res) => {
  const { question, answer } = req.body;

  if (!question || !answer) {
    return res.status(400).json({
      message: "question, answer are required"
    });
  }
  const maxId = Math.max(...quizzes.map(p => p.id), 0);

  const newQuiz = {
    id: quizzes.length ? maxId + 1 : 1,
    question, answer,
  };
  quizzes.push(newQuiz);
  res.status(201).json(newQuiz);
});

// PUT /quizzez/:quizId
// Edit a quiz
router.put("/:quizId", (req, res) => {
  const quizId = Number(req.params.quizId);
  const { question, answer } = req.body;

  const quiz = quizzes.find((q) => q.id === quizId);

  if (!quiz) {
    return res.status(404).json({ message: "Quiz not found" });
  }

  if (!question || !answer) {
    return res.json({
      message: "question, answer are required"
    });
  }

  quiz.question = question;
  quiz.answer = answer;

  res.json(quiz);
});

// DELETE /quizzes/:quizId
// Delete a quiz
router.delete("/:quizId", (req, res) => {
  const quizId = Number(req.params.quizId);

  const quizIndex = quizzes.findIndex((q) => q.id === quizId);

  if (quizIndex === -1) {
    return res.status(404).json({ message: "quiz not found" });
  }

  const deletedQuiz = quizzes.splice(quizIndex, 1);

  res.json({
    message: "quiz deleted successfully",
    quiz: deletedQuiz[0]
  });
});

module.exports = router;