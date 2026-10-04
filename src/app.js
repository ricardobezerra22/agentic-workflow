import express from "express";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import tasksRouter from "./routes/tasks.js";

const __dir = dirname(fileURLToPath(import.meta.url));

export const app = express();

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () =>
    console.log(`${req.method} ${req.path} ${res.statusCode} ${Date.now() - start}ms`)
  );
  next();
});

app.use(
  express.json({
    limit: "100kb",
    strict: true,
  })
);

// Catch JSON parse errors
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      error: { code: "INVALID_JSON", message: "Malformed JSON body", details: [] },
    });
  }
  next(err);
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/tasks", tasksRouter);

// Serve static files: built frontend (dist/) + legacy public/
app.use(express.static(join(__dir, "../dist")));
app.use(express.static(join(__dir, "../public")));

// SPA fallback: serve index.html for non-API routes not matching static files
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) {
    res.status(404).json({ error: "API endpoint not found" });
  } else {
    res.sendFile(join(__dir, "../dist/index.html"));
  }
});

// Global error handler
// ponytail: eslint no-unused-vars requires the 4-arg signature for Express error handlers
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      error: { code: "INVALID_JSON", message: "Malformed JSON body", details: [] },
    });
  }
  console.error(err.stack);
  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred", details: [] },
  });
});
