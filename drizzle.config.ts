import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
	out: "./infra/migrations",
	schema: "./packages/db/postgres",
	dialect: "postgresql",
	dbCredentials: {
		url: process.env.DATABASE_URL!,
	},
});
