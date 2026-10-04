import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import pg from "pg";
import { app } from "./app.js";

const pool = new pg.Pool({
  connectionString:
    process.env.TEST_DATABASE_URL || "postgres://localhost:5432/todo_test",
});

beforeAll(async () => {
  // Apply schema to test DB
  const { readFile } = await import("node:fs/promises");
  const { fileURLToPath } = await import("node:url");
  const { dirname, join } = await import("node:path");
  const dir = dirname(fileURLToPath(import.meta.url));
  const sql = await readFile(join(dir, "../db/schema.sql"), "utf8");
  await pool.query(sql);
});

afterAll(async () => {
  await pool.end();
});

beforeEach(async () => {
  await pool.query("TRUNCATE TABLE tasks RESTART IDENTITY CASCADE");
});

// ---------------------------------------------------------------------------
// DB init
// ---------------------------------------------------------------------------
describe("DB init", () => {
  it("tasks table and indexes exist after schema apply", async () => {
    const res = await pool.query(
      "SELECT to_regclass('public.tasks')::text AS tbl"
    );
    expect(res.rows[0].tbl).toBe("tasks");
  });

  it("schema apply is idempotent", async () => {
    const { readFile } = await import("node:fs/promises");
    const { fileURLToPath } = await import("node:url");
    const { dirname, join } = await import("node:path");
    const dir = dirname(fileURLToPath(import.meta.url));
    const sql = await readFile(join(dir, "../db/schema.sql"), "utf8");
    await expect(pool.query(sql)).resolves.not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------
describe("GET /api/health", () => {
  it("returns 200", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// Validation helpers (unit tests via routes)
// ---------------------------------------------------------------------------
describe("POST /api/tasks — validation", () => {
  it("400 when title missing", async () => {
    const res = await request(app).post("/api/tasks").send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("400 when title is blank", async () => {
    const res = await request(app).post("/api/tasks").send({ title: "   " });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("400 when title exceeds 200 chars", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .send({ title: "x".repeat(201) });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("400 for invalid priority", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .send({ title: "T", priority: "urgent" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("400 for invalid dueDate format", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .send({ title: "T", dueDate: "10/05/2026" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("400 for impossible date 2026-02-30", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .send({ title: "T", dueDate: "2026-02-30" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("400 for malformed JSON", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .set("Content-Type", "application/json")
      .send("{bad json");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_JSON");
  });
});

// ---------------------------------------------------------------------------
// POST /api/tasks — happy path
// ---------------------------------------------------------------------------
describe("POST /api/tasks — create", () => {
  it("201 with all fields", async () => {
    const res = await request(app).post("/api/tasks").send({
      title: "Pagar a renda",
      description: "até dia 5",
      priority: "high",
      dueDate: "2026-10-05",
    });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      title: "Pagar a renda",
      description: "até dia 5",
      priority: "high",
      dueDate: "2026-10-05",
      completed: false,
      completedAt: null,
    });
    expect(typeof res.body.id).toBe("number");
    expect(res.body.createdAt).toBeTruthy();
  });

  it("201 with defaults when only title provided", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .send({ title: "Minimal task" });
    expect(res.status).toBe(201);
    expect(res.body.priority).toBe("medium");
    expect(res.body.description).toBeNull();
    expect(res.body.dueDate).toBeNull();
  });

  it("title is trimmed", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .send({ title: "  Trim me  " });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe("Trim me");
  });
});

// ---------------------------------------------------------------------------
// GET /api/tasks — listing and filters
// ---------------------------------------------------------------------------
describe("GET /api/tasks", () => {
  async function createTask(overrides = {}) {
    const res = await request(app)
      .post("/api/tasks")
      .send({ title: "Task", ...overrides });
    return res.body;
  }

  it("returns tasks ordered: open before done, due_date asc nulls last, created_at desc", async () => {
    const t1 = await createTask({ title: "No date open" });
    const t2 = await createTask({ title: "Early due", dueDate: "2026-01-01" });
    const t3 = await createTask({ title: "Late due", dueDate: "2026-12-31" });
    const t4 = await createTask({ title: "Done task" });
    // complete t4
    await request(app)
      .patch(`/api/tasks/${t4.id}`)
      .send({ completed: true });

    const res = await request(app).get("/api/tasks");
    expect(res.status).toBe(200);
    const ids = res.body.map((t) => t.id);
    const t2idx = ids.indexOf(t2.id);
    const t3idx = ids.indexOf(t3.id);
    const t1idx = ids.indexOf(t1.id);
    const t4idx = ids.indexOf(t4.id);
    // open before done
    expect(Math.max(t2idx, t3idx, t1idx)).toBeLessThan(t4idx);
    // within open: early due before late due
    expect(t2idx).toBeLessThan(t3idx);
    // null date open task is after dated open tasks
    expect(t1idx).toBeGreaterThan(t3idx);
  });

  it("status=open filters to incomplete tasks", async () => {
    const t = await createTask({ title: "Open" });
    const d = await createTask({ title: "Done" });
    await request(app).patch(`/api/tasks/${d.id}`).send({ completed: true });

    const res = await request(app).get("/api/tasks?status=open");
    const ids = res.body.map((r) => r.id);
    expect(ids).toContain(t.id);
    expect(ids).not.toContain(d.id);
  });

  it("status=done filters to completed tasks", async () => {
    const t = await createTask({ title: "Open" });
    const d = await createTask({ title: "Done" });
    await request(app).patch(`/api/tasks/${d.id}`).send({ completed: true });

    const res = await request(app).get("/api/tasks?status=done");
    const ids = res.body.map((r) => r.id);
    expect(ids).toContain(d.id);
    expect(ids).not.toContain(t.id);
  });

  it("priority filter", async () => {
    const h = await createTask({ title: "High", priority: "high" });
    const l = await createTask({ title: "Low", priority: "low" });
    const res = await request(app).get("/api/tasks?priority=high");
    const ids = res.body.map((r) => r.id);
    expect(ids).toContain(h.id);
    expect(ids).not.toContain(l.id);
  });

  it("q searches title and description", async () => {
    const match = await createTask({
      title: "Pagar renda",
      description: "aluguel",
    });
    const no = await createTask({ title: "Outro" });
    const res = await request(app).get("/api/tasks?q=renda");
    const ids = res.body.map((r) => r.id);
    expect(ids).toContain(match.id);
    expect(ids).not.toContain(no.id);
  });

  it("q with % is treated as literal", async () => {
    const match = await createTask({ title: "foo%bar" });
    await createTask({ title: "fooXbar" });
    const res = await request(app).get(
      "/api/tasks?q=" + encodeURIComponent("foo%bar")
    );
    const ids = res.body.map((r) => r.id);
    expect(ids).toContain(match.id);
  });

  it("q with _ is treated as literal", async () => {
    const match = await createTask({ title: "foo_bar" });
    await createTask({ title: "fooXbar" });
    const res = await request(app).get(
      "/api/tasks?q=" + encodeURIComponent("foo_bar")
    );
    const ids = res.body.map((r) => r.id);
    expect(ids).toContain(match.id);
  });

  it("combined filters", async () => {
    const match = await createTask({
      title: "High rent",
      priority: "high",
    });
    const wrongPri = await createTask({
      title: "Low rent",
      priority: "low",
    });
    const done = await createTask({
      title: "High rent done",
      priority: "high",
    });
    await request(app).patch(`/api/tasks/${done.id}`).send({ completed: true });

    const res = await request(app).get(
      "/api/tasks?status=open&priority=high&q=rent"
    );
    const ids = res.body.map((r) => r.id);
    expect(ids).toContain(match.id);
    expect(ids).not.toContain(wrongPri.id);
    expect(ids).not.toContain(done.id);
  });

  it("400 for invalid status", async () => {
    const res = await request(app).get("/api/tasks?status=unknown");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("400 for invalid priority", async () => {
    const res = await request(app).get("/api/tasks?priority=critical");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

// ---------------------------------------------------------------------------
// GET /api/tasks/:id
// ---------------------------------------------------------------------------
describe("GET /api/tasks/:id", () => {
  it("200 for existing task", async () => {
    const created = await request(app)
      .post("/api/tasks")
      .send({ title: "Get me" });
    const res = await request(app).get(`/api/tasks/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.body.id);
  });

  it("404 for non-existent id", async () => {
    const res = await request(app).get("/api/tasks/99999");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("400 for non-numeric id", async () => {
    const res = await request(app).get("/api/tasks/abc");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_ID");
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/tasks/:id
// ---------------------------------------------------------------------------
describe("PATCH /api/tasks/:id", () => {
  async function create(overrides = {}) {
    const res = await request(app)
      .post("/api/tasks")
      .send({ title: "Task", ...overrides });
    return res.body;
  }

  it("partial update changes only sent fields", async () => {
    const t = await create({ title: "Original", priority: "low" });
    const res = await request(app)
      .patch(`/api/tasks/${t.id}`)
      .send({ title: "Updated" });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Updated");
    expect(res.body.priority).toBe("low");
    expect(res.body.updatedAt).not.toBe(t.updatedAt);
  });

  it("completed: true sets completedAt", async () => {
    const t = await create();
    const res = await request(app)
      .patch(`/api/tasks/${t.id}`)
      .send({ completed: true });
    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(true);
    expect(res.body.completedAt).not.toBeNull();
  });

  it("completed: false clears completedAt", async () => {
    const t = await create();
    await request(app).patch(`/api/tasks/${t.id}`).send({ completed: true });
    const res = await request(app)
      .patch(`/api/tasks/${t.id}`)
      .send({ completed: false });
    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(false);
    expect(res.body.completedAt).toBeNull();
  });

  it("idempotent: second completed: true keeps original completedAt", async () => {
    const t = await create();
    const r1 = await request(app)
      .patch(`/api/tasks/${t.id}`)
      .send({ completed: true });
    const original = r1.body.completedAt;
    const r2 = await request(app)
      .patch(`/api/tasks/${t.id}`)
      .send({ completed: true });
    expect(r2.body.completedAt).toBe(original);
  });

  it("400 for empty body", async () => {
    const t = await create();
    const res = await request(app).patch(`/api/tasks/${t.id}`).send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("404 for non-existent task", async () => {
    const res = await request(app)
      .patch("/api/tasks/99999")
      .send({ title: "x" });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/tasks/:id
// ---------------------------------------------------------------------------
describe("DELETE /api/tasks/:id", () => {
  it("204 and task is gone", async () => {
    const t = await (
      await request(app).post("/api/tasks").send({ title: "Delete me" })
    ).body;
    const del = await request(app).delete(`/api/tasks/${t.id}`);
    expect(del.status).toBe(204);
    const get = await request(app).get(`/api/tasks/${t.id}`);
    expect(get.status).toBe(404);
  });

  it("404 for non-existent task", async () => {
    const res = await request(app).delete("/api/tasks/99999");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});

// ---------------------------------------------------------------------------
// dueDate round-trip (no timezone shift)
// ---------------------------------------------------------------------------
describe("dueDate round-trip", () => {
  it("returns dueDate as YYYY-MM-DD without shift", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .send({ title: "Date test", dueDate: "2026-10-05" });
    expect(res.status).toBe(201);
    expect(res.body.dueDate).toBe("2026-10-05");
    const get = await request(app).get(`/api/tasks/${res.body.id}`);
    expect(get.body.dueDate).toBe("2026-10-05");
  });
});

// ---------------------------------------------------------------------------
// Static: GET /
// ---------------------------------------------------------------------------
describe("GET /", () => {
  it("serves HTML with inline <style> and <script>", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/<style/);
    expect(res.text).toMatch(/<script/);
  });
});
