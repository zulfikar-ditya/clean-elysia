import { UserInformation } from "@apis/types/UserInformation";
import { PermissionGuard } from "@packages/*";

import { ForbiddenError, UnauthorizedError } from "../errors";
import { AppContext } from "../types/elysia";

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
