const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const authenticate = require("../middleware/auth");
const isOwner = require("../middleware/isOwner");

const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: path.join(__dirname, "..", "..", "public", "uploads"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

function formatQuiz(quiz) {
  return {
    ...quiz,
    date: quiz.date
      ? quiz.date.toISOString().split("T")[0]
      : null,
    keywords: quiz.keywords.map((k) => k.name),
    userName: quiz.user?.name || null,
    playCount: quiz._count?.attempts ?? 0,
    played: quiz.attempts ? quiz.attempts.length > 0 : false,
    user: undefined,
    attempts: undefined,
    _count: undefined,
  };
}

router.use(authenticate);

// GET /quizzes 
// List all quizzes
router.get("/", async (req, res) => {
  const {keyword} = req.query;    //change??

  const where = keyword
    ? { keywords: { some: { name: keyword } } }
    : {};

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 5));
  const skip = (page - 1) * limit;

  const [quizzes, total] = await Promise.all([
    prisma.quiz.findMany({
      include: {
        keywords: true,
        user: true,
        attempts: { where: { userId: req.user.userId }, take: 1 },
        _count: { select: { attempts: true } },
      },
    }),
    prisma.quiz.count({ where }),
]);

  res.json({
    data: quizzes.map(formatQuiz),
  
  page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    });
});


// GET /quizzes/:quizId
// Show a specific quiz
router.get("/:quizId", async (req, res) => {
  const quizId = Number(req.params.quizId);
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
        include: {
            keywords: true,
            user: true,
            attempts: { where: { userId: req.user.userId }, take: 1 },
            _count: { select: { attempts: true } },
        },
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
router.post("/", upload.single("image"), async (req, res) => {
  const { question, answer, date, keywords } = req.body;

  if (!question || !answer) {
    return res.status(400).json({ msg: 
	"question, answer and date are mandatory" });
  }
  
  const keywordsArray = Array.isArray(keywords) ? keywords : [];
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
  const newQuiz = await prisma.quiz.create({
    data: {
      question,
      answer,
      ...(date && {date: new Date(date) }),
      imageUrl,
      userId: req.user.userId,
      keywords: {
        connectOrCreate: keywordsArray.map((kw) => ({
          where: { name: kw }, create: { name: kw },
        })), },
    },
    include: { keywords: true, user: true},
  });

  res.status(201).json(formatQuiz(newQuiz));
});

// PUT /quizzez/:quizId
// Edit a quiz
router.put("/:quizId", upload.single("image"), isOwner, async (req, res) => {
  const quizId = Number(req.params.quizId);
  const { question, answer, date, keywords } = req.body;
  const existingQuiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  if (!existingQuiz) {
    return res.status(404).json({ message: "Quiz not found" });
  }

  if (!question || !answer) {
    return res.status(400).json({ msg: "question, answer and date are mandatory" });
  }
  
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  const keywordsArray = Array.isArray(keywords) ? keywords : [];
  const updatedQuiz = await prisma.quiz.update({
    where: { id: quizId },
    data: {
      question, answer, date: new Date(date), imageUrl,
      keywords: {
        set: [],
        connectOrCreate: keywordsArray.map((kw) => ({
          where: { name: kw },
          create: { name: kw },
        })),
      },
    },
    include: { keywords: true, user: true},
  });
  if (req.file) data.imageUrl = `/uploads/${req.file.filename}`;
  res.json(formatQuiz(updatedQuiz));
});


// DELETE /quizzes/:quizId
// Delete a quiz
router.delete("/:quizId", isOwner, async (req, res) => {
  const quizId = Number(req.params.quizId);

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { keywords: true, user: true},
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


router.post("/:quizId/play", async (req, res) => {
  const quizId = Number(req.params.quizId);
  const { answer } = req.body;

  if (!answer) {
    return res.status(400).json({
      message: "answer is required",
    });
  }
  
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
  });

  if (!quiz) {
    return res.status(404).json({
      message: "Quiz not found",
    });
  }

  const correct =
    answer.trim().toLowerCase() ===
    quiz.answer.trim().toLowerCase();

const play = await prisma.play.upsert({
  where: {
    userId_quizId: {
      userId: req.user.userId,
      quizId,
    },
  },

  update: {
    submittedAnswer: answer,
    correct,
  },

  create: {
    userId: req.user.userId,
    quizId,
    submittedAnswer: answer,
    correct,
  },
});

  res.status(201).json({
    id: play.id,
    correct,
    submittedAnswer: answer,
    correctAnswer: quiz.answer,
    createdAt: play.createdAt,
  });
});

router.delete("/:quizId/play", async (req, res) => {
    const quizId = Number(req.params.quizId);

    const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
    }

    await prisma.play.deleteMany({
        where: { userId: req.user.userId, quizId },
    });

    const playCount = await prisma.play.count({ where: { quizId } });

    res.json({ quizId, played: false, playCount });
});
module.exports = router;