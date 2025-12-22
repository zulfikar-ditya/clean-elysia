import Elysia from "elysia";
import jwt from "@elysiajs/jwt";
import bearer from "@elysiajs/bearer";
import { UnauthorizedError, ForbiddenError } from "@app/apis/errors";
import { UserRepository } from "@app/apis/repositories";
import { Cache, UserInformationCacheKey } from "@cache/*";
import type { UserInformation } from "@app/apis/types/UserInformation";
import { JWT_CONFIG } from "config/jwt.config";

export const authPlugin = new Elysia({ name: "auth" })
	.use(jwt(JWT_CONFIG))
	.use(bearer())
	.derive(async ({ bearer, jwt, set, log }) => {
		if (!bearer) {
			return { user: null as UserInformation | null };
		}

		try {
			const payload = await jwt.verify(bearer);

			// Better payload validation
			if (!payload || typeof payload === "boolean" || !payload.id) {
				if (log) log.warn("Invalid JWT payload");
				return { user: null as UserInformation | null };
			}

			const userId = String(payload.id);
			const cacheKey = UserInformationCacheKey(userId);

			// Try to get user from cache first
			let user = await Cache.get<UserInformation>(cacheKey);

			if (!user) {
				user = await UserRepository().UserInformation(userId);

				if (!user) {
					if (log) log.warn({ userId }, "User not found for valid JWT");
					return { user: null as UserInformation | null };
				}

				// Cache for 1 hour
				await Cache.set(cacheKey, user, 3600);
			}

			return { user };
		} catch (error) {
			if (log) log.error({ error }, "Error verifying JWT token");
			return { user: null as UserInformation | null };
		}
	})
	.macro(({ onBeforeHandle }) => ({
		// Macro for requiring authentication
		isAuthenticated(enabled: boolean) {
			if (!enabled) return;

			onBeforeHandle(({ user, set, log }) => {
				if (!user) {
					if (log) log.warn("Authentication required but user not found");
					set.status = 401;
					throw new UnauthorizedError("Authentication required");
				}
			});
		},

		// Macro for role-based access control
		requireRole(roles: string | string[]) {
			const roleArray = Array.isArray(roles) ? roles : [roles];

			onBeforeHandle(({ user, set, log }) => {
				if (!user) {
					if (log) log.warn("Authentication required for role check");
					set.status = 401;
					throw new UnauthorizedError("Authentication required");
				}

				// Check if user has any of the required roles
				const hasRole = roleArray.some((role) => user.roles.includes(role));

				if (!hasRole) {
					if (log)
						log.warn(
							{
								userId: user.id,
								requiredRoles: roleArray,
								userRoles: user.roles,
							},
							"Insufficient permissions",
						);
					set.status = 403;
					throw new ForbiddenError("Insufficient permissions");
				}
			});
		},

		// Macro for permission-based access control
		requirePermission(permissions: string | string[]) {
			const permissionArray = Array.isArray(permissions)
				? permissions
				: [permissions];

			onBeforeHandle(({ user, set, log }) => {
				if (!user) {
					if (log) log.warn("Authentication required for permission check");
					set.status = 401;
					throw new UnauthorizedError("Authentication required");
				}

				// Superuser bypasses permission checks
				if (user.roles.includes("superuser")) {
					return;
				}

				// Check if user has all required permissions
				const userPermissions = user.permissions.flatMap((p) => p.permissions);
				const hasAllPermissions = permissionArray.every((perm) =>
					userPermissions.includes(perm),
				);

				if (!hasAllPermissions) {
					if (log)
						log.warn(
							{
								userId: user.id,
								requiredPermissions: permissionArray,
								userPermissions,
							},
							"Missing required permissions",
						);
					set.status = 403;
					throw new ForbiddenError("Insufficient permissions");
				}
			});
		},
	}));

// Helper function to invalidate user cache (use when user data changes)
export async function invalidateUserCache(userId: string): Promise<void> {
	const cacheKey = UserInformationCacheKey(userId);
	await Cache.delete(cacheKey);
}
