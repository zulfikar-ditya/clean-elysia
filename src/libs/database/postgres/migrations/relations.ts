import { relations } from "drizzle-orm/relations";

import {
	passwordReset,
	permission,
	role,
	rolePermission,
	user,
	userEmailVerification,
	userRole,
} from "./schema";

export const userEmailVerificationRelations = relations(
	userEmailVerification,
	({ one }) => ({
		user: one(user, {
			fields: [userEmailVerification.userId],
			references: [user.id],
		}),
	}),
);

export const userRelations = relations(user, ({ many }) => ({
	userEmailVerifications: many(userEmailVerification),
	passwordResets: many(passwordReset),
	userRoles: many(userRole),
}));

export const passwordResetRelations = relations(passwordReset, ({ one }) => ({
	user: one(user, {
		fields: [passwordReset.userId],
		references: [user.id],
	}),
}));

export const userRoleRelations = relations(userRole, ({ one }) => ({
	user: one(user, {
		fields: [userRole.userId],
		references: [user.id],
	}),
	role: one(role, {
		fields: [userRole.roleId],
		references: [role.id],
	}),
}));

export const roleRelations = relations(role, ({ many }) => ({
	userRoles: many(userRole),
	rolePermissions: many(rolePermission),
}));

export const rolePermissionRelations = relations(rolePermission, ({ one }) => ({
	role: one(role, {
		fields: [rolePermission.roleId],
		references: [role.id],
	}),
	permission: one(permission, {
		fields: [rolePermission.permissionId],
		references: [permission.id],
	}),
}));

export const permissionRelations = relations(permission, ({ many }) => ({
	rolePermissions: many(rolePermission),
}));
