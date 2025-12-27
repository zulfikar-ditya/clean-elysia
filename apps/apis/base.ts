import { Elysia } from "elysia";
import {
	ErrorHandlerPlugin,
	LoggerPlugin,
	RequestPlugin,
	SecurityPlugin,
} from "@packages";

export const baseApp = new Elysia({ name: "base-app" })
	.use(RequestPlugin)
	.use(SecurityPlugin)
	.use(LoggerPlugin)
	.use(ErrorHandlerPlugin);
