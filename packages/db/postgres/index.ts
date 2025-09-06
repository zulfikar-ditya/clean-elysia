// Drizzle
export * from "./email_verification";
export * from "./password_reset_token";
export * from "./rbac";
export * from "./user";

import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Import all tables
import {
	emailVerificationTable,
	emailVerificationRelations,
} from "./email_verification";
import {
	passwordResetPasswordTable,
	passwordResetTokenRelations,
} from "./password_reset_token";
import {
	roleTable,
	permissionTable,
	rolePermissionTable,
	userRolesTable,
	roleRelations,
	permissionRelations,
	rolePermissionRelations,
	userRolesRelations,
} from "./rbac";
import { usersTable, usersRelations } from "./user";

const schema = {
	// Tables
	users: usersTable,
	roles: roleTable,
	permissions: permissionTable,
	role_permissions: rolePermissionTable,
	user_roles: userRolesTable,
	email_verifications: emailVerificationTable,
	password_reset_tokens: passwordResetPasswordTable,

	// Relations
	usersRelations,
	roleRelations,
	permissionRelations,
	rolePermissionRelations,
	userRolesRelations,
	emailVerificationRelations,
	passwordResetTokenRelations,
};

const connectionString = process.env.DATABASE_URL!;
const client = new Pool({ connectionString });

const db = drizzle(client, { schema });

export {
	db,
	usersTable,
	roleTable,
	permissionTable,
	rolePermissionTable,
	userRolesTable,
	emailVerificationTable,
	passwordResetPasswordTable,
};

// Export type for the database instance
export type Database = typeof db;
