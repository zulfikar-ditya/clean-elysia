import cors from "@elysiajs/cors";
import jwt from "@elysiajs/jwt";
import { AppConfig, CORSConfig, LoggerPlugin } from "@packages";
import type { Elysia } from "elysia";

export const setupMiddlewares = (app: Elysia) =>
	app
		.derive(() => ({
			requestId:
				globalThis.crypto?.randomUUID?.() ??
				Math.random().toString(36).slice(2),
			startedAt: Date.now(),
		}))
		.use(LoggerPlugin)
		.use(
			jwt({
				name: "jwt",
				alg: "HS256",
				secret: AppConfig.APP_JWT_SECRET,
			}),
		)
		.use(cors(CORSConfig));
