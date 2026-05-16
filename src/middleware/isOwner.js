const prisma = require("../lib/prisma");

async function isOwner (req, res, next) {
    const id = Number(req.params.quizId);
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: { keywords: true },
    });

const { NotFoundError, ForbiddenError } = require("../lib/errors");

if (!post) throw new NotFoundError("Quiz not found");
if (post.userId !== req.user.userId)
  throw new ForbiddenError("You can only modify your own quizzes");

    // Attach the record to the request so the route handler can reuse it
    req.quiz = quiz;
    next();
}

module.exports = isOwner;