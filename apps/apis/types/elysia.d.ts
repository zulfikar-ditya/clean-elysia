import { JWT } from "@elysiajs/jwt";
import { UserInformation } from "./user";
import type { Context } from "elysia";

export type AppContext = Context & {
	jwt: JWT;
	user?: UserInformation;
};
