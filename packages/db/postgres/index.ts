// Drizle
export * from "./email_verification";
export * from "./password_reset_token";
export * from "./user";

import { DatabaseConfig } from "@packages_config/*";
import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";

const db = drizzle(DatabaseConfig.url);

export { db };
