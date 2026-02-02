import { UserInformation } from "./UserInformation";

declare module "elysia" {
	interface Store {
		user?: UserInformation;
	}
}

export {};
