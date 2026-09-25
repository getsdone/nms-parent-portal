import { Pool } from "pg";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Loaded here (not in index.ts) so the pool always sees DATABASE_URL
// regardless of ESM import-execution order: a module that imports db.ts
// before index.ts's own top-level code runs would otherwise see an
// undefined connection string.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
