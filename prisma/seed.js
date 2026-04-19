const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const seedQuizzes = [
  {
    question: "testq1",
    answer: "testa1",
    date: new Date("2026-03-20"),
    keywords: ["http", "web"],
  },
  {
    question: "testq2",
    answer: "testa2",
    date: new Date("2026-03-20"),
    keywords: ["http", "web"],
  },
  {
    question: "testq3",
    answer: "testa3",
    date: new Date("2026-03-20"),
    keywords: ["http", "web"],
  },
  {
    question: "testq4",
    answer: "testa4",
    date: new Date("2026-03-20"),
    keywords: ["http", "web"],
  },
];

async function main() {
  await prisma.quiz.deleteMany();
  await prisma.keyword.deleteMany();

  for (const quiz of seedQuizzes) {
    await prisma.quiz.create({
      data: {
        question: quiz.question,
        answer: quiz.answer,
        date: quiz.date,
        keywords: {
          connectOrCreate: quiz.keywords.map((kw) => ({
            where: { name: kw },
            create: { name: kw },
          })),
        },
      },
    });
  }

  console.log("Seed data inserted successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());