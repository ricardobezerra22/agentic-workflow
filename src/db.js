import pg from "pg";
import "dotenv/config";

// OID 1082 = DATE — return raw YYYY-MM-DD string to avoid timezone shifts
pg.types.setTypeParser(1082, (v) => v);

const isTest = process.env.NODE_ENV === "test" || process.env.VITEST;

const url = isTest ? process.env.TEST_DATABASE_URL : process.env.DATABASE_URL;
if (!url) throw new Error(`${isTest ? "TEST_DATABASE_URL" : "DATABASE_URL"} is not set`);

export const pool = new pg.Pool({ connectionString: url });
