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
		singleLine: true,
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
			return {
				...obj,
			};
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
