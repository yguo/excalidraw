import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Only load .env.local if POSTGRES_URL is not already set in the environment
if (!process.env.POSTGRES_URL) {
    dotenv.config({ path: process.env.DOTENV_CONFIG_PATH || ".env.local" });
}

export default defineConfig({
    schema: "./src/db/schema.ts",
    out: "./drizzle",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.POSTGRES_URL!,
    },
});
