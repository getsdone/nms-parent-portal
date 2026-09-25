import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";

const { Client } = pg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Order matches FK dependency order (children after parents), which is
// also a fine order to report counts in.
const TABLES = [
  "families",
  "parents",
  "stars",
  "todos",
  "program_history",
  "budgets",
  "budget_transactions",
  "events",
  "rsvps",
  "documents",
];

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set (expected in repo root .env)");
  }

  const schema = readFileSync(path.resolve(__dirname, "schema.sql"), "utf8");
  const seed = readFileSync(path.resolve(__dirname, "seed.sql"), "utf8");

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    await client.query("BEGIN");
    await client.query(schema);
    await client.query(seed);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  }

  for (const table of TABLES) {
    const { rows } = await client.query<{ count: number }>(
      `SELECT COUNT(*)::int AS count FROM ${table}`,
    );
    console.log(`${table}: ${rows[0].count}`);
  }

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
