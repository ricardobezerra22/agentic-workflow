import express from "express";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFileSync } from "node:fs";
import tasksRouter from "./routes/tasks.js";

const __dir = dirname(fileURLToPath(import.meta.url));

// Load Vite manifest for SSR (empty if dist not built yet)
let manifest = {};
try {
  const manifestPath = join(__dir, "../dist/.vite/manifest.json");
  manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
} catch {
  // dist/ not built yet (dev/test mode) — SSR will use public/index.html fallback
}

function renderHTML() {
  const entry = manifest["index.html"];
  if (!entry) {
    // Fallback: serve public/index.html if dist not built
    try {
      return readFileSync(join(__dir, "../public/index.html"), "utf8");
    } catch {
      return "<!DOCTYPE html><html><body>App not built</body></html>";
    }
  }

  const scriptSrc = entry.file;
  const cssFiles = entry.css ? entry.css.map((f) => `<link rel="stylesheet" href="/${f}">`).join("\n") : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Agentic Sandbox</title>
  ${cssFiles}
</head>
<body>
  <main id="app"></main>
  <p id="farewell"></p>
  <script type="module" src="/${scriptSrc}"></script>
</body>
</html>`;
}

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

// Serve static files: built frontend assets (dist/) + legacy public/
app.use(express.static(join(__dir, "../dist")));
app.use(express.static(join(__dir, "../public")));

// SSR: dynamically render HTML for SPA routes
app.get("/", (req, res) => {
  res.type("text/html").send(renderHTML());
});

// Fallback: 404 for API, or serve generated HTML for other routes
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) {
    res.status(404).json({ error: "API endpoint not found" });
  } else {
    res.type("text/html").send(renderHTML());
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
