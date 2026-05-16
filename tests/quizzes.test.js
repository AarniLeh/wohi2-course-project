const { resetDb, registerAndLogin, request, app, prisma } = require("./helpers");
beforeEach(resetDb);
describe("quiz tests", () => {
it("returns 401 without a token", async () => {
  const res = await request(app).get("/api/quizzes");
  expect(res.status).toBe(401);
});

it("returns 404 for unknown quiz", async () => {
  const token = await registerAndLogin();
  const res = await request(app).get("/api/quizzes/99999")
    .set("Authorization", `Bearer ${token}`);
  expect(res.status).toBe(404);
  expect(res.body.message).toBe("Quiz not found");
});

it("returns 400 for invalid quiz body", async () => {
  const token = await registerAndLogin();
  const res = await request(app).post("/api/quizzes")
    .set("Authorization", `Bearer ${token}`)
    .send({ title: "" });
  expect(res.status).toBe(400);
});

it("returns 403 when editing someone else's post", async () => {
  const aliceToken = await registerAndLogin("alice@test.io", "Alice");
  const post = await createPost(aliceToken, { title: "Alice's post" });

  const bobToken = await registerAndLogin("bob@test.io", "Bob");
  const res = await request(app).put(`/api/posts/${post.id}`)
    .set("Authorization", `Bearer ${bobToken}`)
    .send({ title: "hijacked", date: "2026-01-01", content: "x" });

  expect(res.status).toBe(403);

  const after = await prisma.post.findUnique({ where: { id: post.id } });
  expect(after.title).toBe("Alice's post");  // unchanged
});
});