import { Router } from "express";
import { pool } from "../db.js";
import { validateTask, validatePatchTask, validateListParams } from "../validation.js";

const router = Router();

function toTask(row) {
  return {
    id: Number(row.id),
    title: row.title,
    description: row.description,
    priority: row.priority,
    dueDate: row.due_date,
    completed: row.completed,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function validationError(res, errors) {
  return res.status(400).json({
    error: {
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      details: errors,
    },
  });
}

function notFound(res) {
  return res.status(404).json({
    error: { code: "NOT_FOUND", message: "Task not found", details: [] },
  });
}

function parseId(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({
      error: { code: "INVALID_ID", message: "id must be a positive integer", details: [] },
    });
    return null;
  }
  return id;
}

// GET /api/tasks
router.get("/", async (req, res, next) => {
  try {
    const { valid, errors } = validateListParams(req.query);
    if (!valid) return validationError(res, errors);

    const { status, priority, q } = req.query;
    const conditions = [];
    const params = [];

    if (status === "open") {
      conditions.push("completed = false");
    } else if (status === "done") {
      conditions.push("completed = true");
    }

    if (priority) {
      params.push(priority);
      conditions.push(`priority = $${params.length}`);
    }

    if (q) {
      const escaped = q.replace(/[%_\\]/g, "\\$&");
      params.push(`%${escaped}%`);
      conditions.push(
        `(title ILIKE $${params.length} OR description ILIKE $${params.length})`
      );
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const sql = `
      SELECT * FROM tasks
      ${where}
      ORDER BY
        completed ASC,
        due_date ASC NULLS LAST,
        created_at DESC
      LIMIT 500
    `;
    const { rows } = await pool.query(sql, params);
    res.json(rows.map(toTask));
  } catch (err) {
    next(err);
  }
});

// POST /api/tasks
router.post("/", async (req, res, next) => {
  try {
    const { valid, errors } = validateTask(req.body);
    if (!valid) return validationError(res, errors);

    const {
      title,
      description = null,
      priority = "medium",
      dueDate = null,
    } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO tasks (title, description, priority, due_date)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [title.trim(), description, priority, dueDate]
    );
    res.status(201).json(toTask(rows[0]));
  } catch (err) {
    next(err);
  }
});

// GET /api/tasks/:id
router.get("/:id", async (req, res, next) => {
  try {
    const id = parseId(req, res);
    if (id === null) return;
    const { rows } = await pool.query("SELECT * FROM tasks WHERE id = $1", [id]);
    if (!rows.length) return notFound(res);
    res.json(toTask(rows[0]));
  } catch (err) {
    next(err);
  }
});

// PATCH /api/tasks/:id
router.patch("/:id", async (req, res, next) => {
  try {
    const id = parseId(req, res);
    if (id === null) return;

    const { valid, errors } = validatePatchTask(req.body);
    if (!valid) return validationError(res, errors);

    const { title, description, priority, dueDate, completed } = req.body;
    const sets = [];
    const params = [];

    if (title !== undefined) {
      params.push(title.trim());
      sets.push(`title = $${params.length}`);
    }
    if ("description" in req.body) {
      params.push(description);
      sets.push(`description = $${params.length}`);
    }
    if (priority !== undefined) {
      params.push(priority);
      sets.push(`priority = $${params.length}`);
    }
    if ("dueDate" in req.body) {
      params.push(dueDate);
      sets.push(`due_date = $${params.length}`);
    }
    if (completed !== undefined) {
      params.push(completed);
      sets.push(`completed = $${params.length}`);
      if (completed) {
        sets.push(`completed_at = COALESCE(completed_at, now())`);
      } else {
        sets.push(`completed_at = NULL`);
      }
    }

    sets.push("updated_at = now()");
    params.push(id);

    const { rows } = await pool.query(
      `UPDATE tasks SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING *`,
      params
    );
    if (!rows.length) return notFound(res);
    res.json(toTask(rows[0]));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tasks/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const id = parseId(req, res);
    if (id === null) return;
    const { rowCount } = await pool.query("DELETE FROM tasks WHERE id = $1", [id]);
    if (!rowCount) return notFound(res);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
