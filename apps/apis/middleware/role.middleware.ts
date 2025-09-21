import { AppContext } from "@apis/types/elysia";
import { UserInformation } from "@apis/types/UserInformation";
import { UnauthorizedError } from "@apis/errors";
import { RoleGuard } from "@packages/*";

export const roleMiddleware = (ctx: AppContext, roleNames: string[]) => {
	const userInformation: UserInformation = ctx.user;
	if (!userInformation) {
		throw new UnauthorizedError();
	}

	RoleGuard.validate(userInformation, roleNames);
};
