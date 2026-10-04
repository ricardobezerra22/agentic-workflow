import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";
import "dotenv/config";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

const pool = new pg.Pool({ connectionString: url });

const dir = dirname(fileURLToPath(import.meta.url));
const sql = await readFile(join(dir, "schema.sql"), "utf8");
await pool.query(sql);
console.log("Schema applied.");
await pool.end();
