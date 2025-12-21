import { ForbiddenError, UnauthorizedError } from "@app/apis/errors";
import { UserInformation } from "@app/apis/types/UserInformation";

export class RoleGuard {
	static validate(userInformation: UserInformation, roleNames: string[]) {
		if (!userInformation) {
			throw new UnauthorizedError();
		}

		if (!this.can(userInformation, roleNames)) {
			throw new ForbiddenError();
		}
	}

	static can(userInformation: UserInformation, roleNames: string[]): boolean {
		if (userInformation.roles.includes("superuser")) {
			return true;
		}

		return roleNames.every((role) => userInformation.roles.includes(role));
	}
}

export const roleGuard =
	(roles: string[]) =>
	({ user }: { user?: any }) => {
		if (!user) {
			throw new UnauthorizedError();
		}

		RoleGuard.validate(user, roles);
	};
