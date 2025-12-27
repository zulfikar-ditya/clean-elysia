import {
	ErrorHandlerPlugin,
	LoggerPlugin,
	RequestPlugin,
	SecurityPlugin,
} from "@packages";
import { Elysia } from "elysia";

export const baseApp = new Elysia({ name: "base-app" })
	.use(RequestPlugin)
	.use(SecurityPlugin)
	.use(LoggerPlugin)
	.use(ErrorHandlerPlugin);
