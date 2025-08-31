// src/logger.ts
import { pino, Logger, destination } from "pino";
import { wrap } from "@bogeychan/elysia-logger";
import { AppConfig } from "@packages_config/*";
import { LoggerOptions } from "@bogeychan/elysia-logger/types";

const isProd = AppConfig.APP_ENV !== "development";
const logFile = destination({
	append: true,
	write: true,
	writable: true,
	dest: isProd ? "storage/logs/app.log" : "storage/logs/app-dev.log",
});

const transport = {
	target: "pino-pretty",
	options: {
		singleLine: false,
		translateTime: "SYS:standard",
		include: "time",
	},
};

const options: LoggerOptions = {
	level: AppConfig.LOG_LEVEL,
	base: null,
	timestamp: () =>
		`<${new Date().toLocaleString("en-US", {
			weekday: "long",
			day: "numeric",
			month: "short",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			timeZone: AppConfig.APP_TIMEZONE,
		})}>`,
	transport: isProd ? undefined : transport,
	formatters: {
		level(label) {
			return { level: label };
		},
		log(obj) {
			// Create a copy to avoid mutating the original object
			const sanitized = { ...obj };

			// Remove sensitive fields
			delete sanitized.password;
			delete sanitized.token;
			delete sanitized.authorization;
			delete sanitized.bearer;
			// delete sanitized.user;
			// delete sanitized.req;
			// delete sanitized.res;

			// Remove any field containing 'password', 'token', 'auth', 'bearer' (case insensitive)
			Object.keys(sanitized).forEach((key) => {
				if (/password|token|auth|bearer|secret|key|credential/i.test(key)) {
					delete sanitized[key];
				}
			});

			// Remove sensitive data from nested objects (like request body)
			if (sanitized.body && typeof sanitized.body === "object") {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const sanitizedBody = { ...sanitized.body } as Record<string, any>;
				Object.keys(sanitizedBody).forEach((key) => {
					if (/password|token|auth|bearer|secret|key|credential/i.test(key)) {
						delete sanitizedBody[key];
					}
				});
				sanitized.body = sanitizedBody;
			}

			return sanitized;
		},
	},

	file: logFile,
};

// SINGLE logger instance for the whole app
export const log: Logger = pino(options, logFile);

/**
 * Elysia plugin: exposes ctx.log, auto-logs requests,
 * and enriches each line with request-scoped props.
 */
export const LoggerPlugin = wrap(log, {
	autoLogging: true,
	customProps(ctx) {
		const url = new URL(ctx.request.url);
		return {
			// eslint-disable-next-line
			requestId: (ctx as any).requestId,
			method: ctx.request.method,
			path: url.pathname,
			route: ctx.route,
		};
	},
});

/**
 * Create a child logger with bindings for a module or domain.
 * Example: const userLog = child({ module: "user" })
 */
export function child(bindings: Record<string, unknown>) {
	return log.child(bindings);
}
