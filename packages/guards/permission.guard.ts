import { ForbiddenError, UnauthorizedError } from "packages/errors";
import { UserInformation } from "@app/apis/types/UserInformation";

export class PermissionGuard {
	static validate(
		userInformation: UserInformation,
		requiredPermissions: string[],
	) {
		if (!userInformation) {
			throw new UnauthorizedError();
		}
		if (!this.can(userInformation, requiredPermissions)) {
			throw new ForbiddenError();
		}
	}

	static can(
		userInformation: UserInformation,
		requiredPermissions: string[],
	): boolean {
		if (userInformation.roles.includes("superuser")) {
			return true;
		}

		return requiredPermissions.every((permission) =>
			userInformation.permissions.some((perm) =>
				perm.permissions.includes(permission),
			),
		);
	}

	static cannot(
		userInformation: UserInformation,
		requiredPermissions: string[],
	): boolean {
		return !this.can(userInformation, requiredPermissions);
	}
}
