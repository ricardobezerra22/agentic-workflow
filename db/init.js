import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";
import "dotenv/config";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || "postgres://localhost:5432/todo",
});

const dir = dirname(fileURLToPath(import.meta.url));
const sql = await readFile(join(dir, "schema.sql"), "utf8");
await pool.query(sql);
console.log("Schema applied.");
await pool.end();
