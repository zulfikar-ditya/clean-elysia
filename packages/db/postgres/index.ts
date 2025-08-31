// Drizle
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
} from "./rbac";
import { usersTable, usersRelations } from "./user";
import {
	roleRelations,
	permissionRelations,
	rolePermissionRelations,
	userRolesRelations,
} from "./rbac";

const schema = {
	email_verifications: emailVerificationTable,
	password_reset_tokens: passwordResetPasswordTable,
	roles: roleTable,
	permissions: permissionTable,
	role_permissions: rolePermissionTable,
	user_roles: userRolesTable,
	users: usersTable,

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

	//
};
