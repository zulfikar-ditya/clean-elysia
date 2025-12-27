// Drizzle
import { DatabaseConfig } from "config/database.config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Import all tables
import {
	email_verificationsRelations,
	email_verificationsTable,
} from "./email_verification";
import {
	password_reset_tokensRelations,
	password_reset_tokensTable,
} from "./password_reset_token";
import {
	permissionsRelations,
	permissionsTable,
	role_permissionsRelations,
	role_permissionsTable,
	rolesRelations,
	rolesTable,
	user_rolesRelations,
	user_rolesTable,
} from "./rbac";
import { usersRelations, usersTable } from "./user";

export * from "./email_verification";
export * from "./password_reset_token";
export * from "./rbac";
export * from "./user";

export const schema = {
	// Tables
	users: usersTable,
	roles: rolesTable,
	permissions: permissionsTable,
	role_permissions: role_permissionsTable,
	user_roles: user_rolesTable,
	email_verifications: email_verificationsTable,
	password_reset_tokens: password_reset_tokensTable,

	// Relations
	usersRelations,
	rolesRelations,
	permissionsRelations,
	role_permissionsRelations,
	user_rolesRelations,
	email_verificationsRelations,
	password_reset_tokensRelations,
};

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
