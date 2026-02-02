import bearer from "@elysiajs/bearer";
import jwt from "@elysiajs/jwt";
import {
	JWT_CONFIG,
	UnauthorizedError,
	UserInformation,
	UserRepository,
} from "@libs";
import Elysia from "elysia";

export const AuthPlugin = new Elysia({ name: "auth" })
	.use(jwt(JWT_CONFIG))
	.use(bearer())
	// eslint-disable-next-line no-shadow
	.derive({ as: "scoped" }, async ({ bearer, jwt }) => {
		if (!bearer) {
			throw new UnauthorizedError("Authentication required");
		}

		let user: UserInformation | null;
		try {
			const payload = await jwt.verify(bearer);
			if (!payload || typeof payload === "boolean" || !payload.id) {
				throw new UnauthorizedError("Invalid authentication token");
			}

			// Ensure payload.id is a string or number before using it
			const userId =
				typeof payload.id === "string" || typeof payload.id === "number"
					? String(payload.id)
					: null;

			if (!userId) {
				throw new UnauthorizedError("Invalid user ID in token");
			}

			user = await UserRepository().UserInformation(userId);
			if (!user) {
				throw new UnauthorizedError("User not found");
			}

			// user = await Cache.get<UserInformation>(UserInformationCacheKey(userId));			// if (!user) {
			// 	user = await UserRepository().UserInformation(userId);
			// 	if (user) {
			// 		await Cache.set(UserInformationCacheKey(userId), user, 3600);
			// 	}
			// }
		} catch {
			throw new UnauthorizedError("Invalid authentication token");
		}

		if (!user) {
			throw new UnauthorizedError("User not found");
		}

		return { user };
	});
