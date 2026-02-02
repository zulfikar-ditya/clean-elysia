import "dotenv/config";

import { defineConfig } from "drizzle-kit";

export default defineConfig({
	out: "./src/libs/database/migrations",
	schema: "./src/libs/database/schema/index.ts",
	dialect: "postgresql",
	dbCredentials: {
		url: process.env.DATABASE_URL!,
	},
});
