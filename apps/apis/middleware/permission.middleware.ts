import { UserInformation } from "@apis/types/UserInformation";
import { ForbiddenError, UnauthorizedError } from "../errors";
import { AppContext } from "../types/elysia";
import { PermissionGuard } from "@packages/*";

export const permissionMiddleware = (
	ctx: AppContext,
	permissions: string[],
) => {
	const userInformation: UserInformation = ctx.user;
	if (!userInformation) {
		throw new UnauthorizedError();
	}

	const isAllowed = PermissionGuard.can(userInformation, permissions);
	if (!isAllowed) {
		throw new ForbiddenError();
	}
};
