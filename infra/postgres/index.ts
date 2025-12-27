// Drizzle
import { DatabaseConfig } from "config/database.config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Import all tables
import { email_verificationsTable } from "./email_verification";
import { password_reset_tokensTable } from "./password_reset_token";
import {
	permissionsTable,
	role_permissionsTable,
	rolesTable,
	user_rolesTable,
} from "./rbac";
import { schema } from "./schema";
import { usersTable } from "./user";

export * from "./email_verification";
export * from "./password_reset_token";
export * from "./rbac";
export * from "./user";

const connectionString = DatabaseConfig.url;
const client = new Pool({ connectionString });

const db = drizzle(client, { schema });

export {
	db,
	email_verificationsTable,
	password_reset_tokensTable,
	permissionsTable,
	role_permissionsTable,
	rolesTable,
	user_rolesTable,
	usersTable,
};

export * from "./repositories/index";
