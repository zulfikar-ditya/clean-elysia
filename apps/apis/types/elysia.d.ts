import { JWT } from "@elysiajs/jwt";
import type { Context } from "elysia";

import { UserInformation } from "./user";

export type AppContext = Context & {
	jwt: JWT;
	user?: UserInformation;
};
