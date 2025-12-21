import { t } from "elysia";

export interface UserInformation {
	id: string;
	name: string;
	email: string;
	roles: string[];
	permissions: {
		name: string;
		permissions: string[];
	}[];
}

export const UserInformationTypeBox = t.Object({
	id: t.String(),
	name: t.String(),
	email: t.String({
		format: "email",
	}),
	roles: t.Array(t.String()),
	permissions: t.Array(
		t.Object({
			name: t.String(),
			permissions: t.Array(t.String()),
		}),
	),
});
