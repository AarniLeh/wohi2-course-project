const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();

async function main() {
  await prisma.quiz.deleteMany();
  await prisma.keyword.deleteMany();
  await prisma.user.deleteMany(); //not needed ??

  // Create a default user
  const hashedPassword = await bcrypt.hash("1234", 10);
  const user = await prisma.user.create({
    data: {
      email: "admin@example.com",
      password: hashedPassword,
      name: "Admin User",
    },
  });
  console.log("Created user:", user.email);

  for (const quiz of seedQuizzes) {
    await prisma.quiz.create({
      data: {
        question: quiz.question,
        answer: quiz.answer,
        date: quiz.date,
        userId: user.id,
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

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());