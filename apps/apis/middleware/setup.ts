import cors from "@elysiajs/cors";
import jwt from "@elysiajs/jwt";
import { AppConfig, CORSConfig } from "@config";
import { LoggerPlugin } from "@packages";
import type { Elysia } from "elysia";
import { rateLimit } from "elysia-rate-limit";
import { RateLimitError } from "../errors/to-many-request-error";
import { helmet } from "elysia-helmet";

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
		.use(cors(CORSConfig))
		.use(
			rateLimit({
				max: 100,
				duration: 60 * 1000,
				headers: true,
				errorResponse: new RateLimitError(),
			}),
		)
		.use(
			helmet({
				contentSecurityPolicy: {
					directives: {
						defaultSrc: ["'self'"],
						scriptSrc: ["'self'"],
						styleSrc: ["'self'", "'unsafe-inline'"],
						imgSrc: ["'self'", "data:", "https:"],
						connectSrc: ["'self'"],
						fontSrc: ["'self'"],
						objectSrc: ["'none'"],
						mediaSrc: ["'self'"],
						frameSrc: ["'none'"],
						baseUri: ["'self'"],
						formAction: ["'self'"],
					},
				},
				crossOriginEmbedderPolicy: true,
				crossOriginOpenerPolicy: true,
				crossOriginResourcePolicy: { policy: "cross-origin" },
				dnsPrefetchControl: true,
				frameguard: { action: "deny" },
				xContentTypeOptions: true,
				aot: true,
			}),
		);
