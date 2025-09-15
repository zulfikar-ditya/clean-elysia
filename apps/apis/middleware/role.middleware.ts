import { AppContext } from "@apis/types/elysia";
import { UserInformation } from "@apis/types/UserInformation";
import { ForbiddenError, UnauthorizedError } from "@apis/errors";

export const roleMiddleware = async (ctx: AppContext, roleNames: string[]) => {
	try {
		const userInformation: UserInformation = ctx.user;
		if (!userInformation) {
			throw new UnauthorizedError("User not found");
		}

		if (userInformation.roles.includes("superuser")) {
			return;
		}

		if (userInformation.roles.some((role) => roleNames.includes(role))) {
			return;
		}

		throw new ForbiddenError("Access denied");
	} catch (error) {
		if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
			throw error;
		}

		throw new Error("Role middleware error");
	}
};
