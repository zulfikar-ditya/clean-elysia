import Elysia from "elysia";
import jwt from "@elysiajs/jwt";
import { UnauthorizedError } from "@app/apis/errors";
import { UserRepository } from "@app/apis/repositories";
import { Cache, UserInformationCacheKey } from "@cache/*";
import type { UserInformation } from "@app/apis/types/UserInformation";
import { JWT_CONFIG } from "config/jwt.config";
import bearer from "@elysiajs/bearer";

export const authPlugin = new Elysia({ name: "auth" })
	.use(jwt(JWT_CONFIG))
	.use(bearer())
	.derive(async ({ bearer, jwt, set }) => {
		if (!bearer) {
			return { user: null as UserInformation | null };
		}

		try {
			const payload = await jwt.verify(bearer);
			if (!payload || typeof payload === "boolean" || !payload.id) {
				return { user: null as UserInformation | null };
			}

			const userId = String(payload.id);
			const cacheKey = UserInformationCacheKey(userId);

			// Try to get user from cache first
			let user = await Cache.get<UserInformation>(cacheKey);
			if (!user) {
				user = await UserRepository().UserInformation(userId);

				if (!user) {
					return { user: null as UserInformation | null };
				}
				await Cache.set(cacheKey, user, 3600);
			}

			return { user };
		} catch (error) {
			return { user: null as UserInformation | null };
		}
	})
	.macro(({ onBeforeHandle }) => ({
		// Macro for protecting routes
		isAuthenticated(enabled: boolean) {
			if (!enabled) return;
			onBeforeHandle(({ user, set }) => {
				if (!user) {
					set.status = 401;
					throw new UnauthorizedError("Authentication required");
				}
			});
		},
		// Optional: Macro for role-based access
		requireRole(roles: string | string[]) {
			const roleArray = Array.isArray(roles) ? roles : [roles];

			onBeforeHandle(({ user, set }) => {
				if (!user) {
					set.status = 401;
					throw new UnauthorizedError("Authentication required");
				}

				if (!roleArray.includes((user as any).role)) {
					set.status = 403;
					throw new UnauthorizedError("Insufficient permissions");
				}
			});
		},
	}));
