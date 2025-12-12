import { UnauthorizedError } from "@apis/errors";
import { UserRepository } from "@apis/repositories";
import { AppContext } from "@apis/types/elysia";
import { Cache } from "@cache/index";

import { UserInformation } from "../types/UserInformation";

export const authMiddleware = async (ctx: AppContext) => {
	try {
		const token = getTokenFromHeader(ctx);
		// eslint-disable-next-line
		const payload: { id: string } | null = await ctx.jwt.verify(token);
		if (!payload) {
			throw new UnauthorizedError();
		}

		const cacheKey = `user:${payload.id}`;
		const cachedUser = await Cache.get<UserInformation | null>(cacheKey);
		if (cachedUser) {
			ctx.user = cachedUser;
			return;
		}

		const userInformation = await UserRepository().UserInformation(payload.id);
		if (!userInformation) {
			throw new UnauthorizedError("User not found");
		}

		await Cache.set(cacheKey, userInformation, 60 * 60);

		ctx.user = userInformation;
	} catch {
		throw new UnauthorizedError();
	}
};

function getTokenFromHeader(ctx: AppContext): string | null {
	const authHeader = ctx.request.headers.get("Authorization");
	if (authHeader && authHeader.startsWith("Bearer ")) {
		return authHeader.split(" ")[1];
	}

	return null;
}
