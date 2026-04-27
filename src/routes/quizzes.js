const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const authenticate = require("../middleware/auth");
const isOwner = require("../middleware/isOwner");

function formatQuiz(quiz) {
  return {
    ...quiz,
    date: quiz.date.toISOString().split("T")[0],
    keywords: quiz.keywords.map((k) => k.name),
  };
}

router.use(authenticate);

// GET /quizzes 
// List all quizzes
router.get("/", async (req, res) => {
  const { keyword } = req.query;

  const where = keyword
    ? { keywords: { some: { name: keyword } } }
    : {};

  const quizzes = await prisma.quiz.findMany({
    where,
    include: { keywords: true },
    orderBy: { id: "asc" },
  });

  res.json(quizzes.map(formatQuiz));
});


// GET /quizzes/:quizId
// Show a specific quiz
router.get("/:quizId", async (req, res) => {
  const quizId = Number(req.params.quizId);
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { keywords: true },
  });

  if (!quiz) {
    return res.status(404).json({ 
		message: "Quiz not found" 
    });
  }

  res.json(formatQuiz(quiz));
});


// POST /quizzes
// Create a new quiz
router.post("/", async (req, res) => {
  const { question, answer, date, keywords } = req.body;

  if (!question || !answer || !date) {
    return res.status(400).json({ msg: 
	"question, answer and date are mandatory" });
  }

  const keywordsArray = Array.isArray(keywords) ? keywords : [];

  const newQuiz = await prisma.quiz.create({
    data: {
      question, answer, date: new Date(date),
      userId: req.user.userId,
      keywords: {
        connectOrCreate: keywordsArray.map((kw) => ({
          where: { name: kw }, create: { name: kw },
        })), },
    },
    include: { keywords: true },
  });

  res.status(201).json(formatQuiz(newQuiz));
});

// PUT /quizzez/:quizId
// Edit a quiz
router.put("/:quizId", isOwner, async (req, res) => {
  const quizId = Number(req.params.quizId);
  const { question, answer, date, keywords } = req.body;
  const existingQuiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  if (!existingQuiz) {
    return res.status(404).json({ message: "Quiz not found" });
  }

  if (!question || !answer || !date) {
    return res.status(400).json({ msg: "question, answer and date are mandatory" });
  }

  const keywordsArray = Array.isArray(keywords) ? keywords : [];
  const updatedQuiz = await prisma.quiz.update({
    where: { id: quizId },
    data: {
      question, answer, date: new Date(date),
      keywords: {
        set: [],
        connectOrCreate: keywordsArray.map((kw) => ({
          where: { name: kw },
          create: { name: kw },
        })),
      },
    },
    include: { keywords: true },
  });
  res.json(formatQuiz(updatedQuiz));
});

// DELETE /quizzes/:quizId
// Delete a quiz
router.delete("/:quizId", isOwner, async (req, res) => {
  const quizId = Number(req.params.quizId);

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { keywords: true },
  });

  if (!quiz) {
    return res.status(404).json({ message: "Quiz not found" });
  }

  await prisma.quiz.delete({ where: { id: quizId } });

  res.json({
    message: "Quiz deleted successfully",
    post: formatQuiz(quiz),
  });
});

module.exports = router;