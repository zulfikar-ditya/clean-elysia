import { UnauthorizedError } from "@apis/errors";
import { UserInformation } from "@apis/types/UserInformation";
import { RoleGuard } from "@packages/*";
import Elysia from "elysia";

export const roleMiddleware = (ctx: Elysia, roleNames: string[]) => {
	const userInformation: UserInformation = ctx.store.user;
	if (!userInformation) {
		throw new UnauthorizedError();
	}

	RoleGuard.validate(userInformation, roleNames);
};
