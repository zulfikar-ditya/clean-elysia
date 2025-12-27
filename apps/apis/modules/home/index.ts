// apps/apis/modules/home/index.ts
import { baseApp } from "@app/apis/base";
import { db, RedisClient } from "@infra/*";
import { DateToolkit } from "@toolkit/date";
import {
	CommonResponseSchemas,
	ResponseToolkit,
	SuccessResponseSchema,
} from "@toolkit/response";
import { AppConfig } from "config/app.config";
import { Elysia, t } from "elysia";

import {
	AppInfoSchema,
	HealthCheckSchema,
	HealthCheckSchema503,
} from "./schema";

export const HomeModule = new Elysia({
	detail: { tags: ["General"], security: [] },
})
	.use(baseApp)
	// ============================================
	// ROOT ENDPOINT
	// ============================================
	.get(
		"/",
		() => {
			return ResponseToolkit.success(
				{
					app_name: AppConfig.APP_NAME,
					app_env: AppConfig.APP_ENV,
					date: DateToolkit.getDateTimeInformativeWithTimezone(
						DateToolkit.now(),
					),
				},
				`Welcome to ${AppConfig.APP_NAME}`,
			);
		},
		{
			response: {
				200: SuccessResponseSchema(AppInfoSchema),
			},
			detail: {
				summary: "API root endpoint",
				description: "Returns basic information about the API",
			},
		},
	)

	// ============================================
	// HEALTH CHECK
	// ============================================
	.get(
		"/health",
		async ({ set }) => {
			const healthStatus = {
				status: "healthy",
				timestamp: DateToolkit.getDateTimeInformativeWithTimezone(
					DateToolkit.now(),
				),
				services: {
					database: "healthy",
					redis: "healthy",
				},
			};

			// Check Redis
			try {
				const redis = RedisClient.getRedisClient();
				await redis.ping();
				healthStatus.services.redis = "healthy";
			} catch {
				healthStatus.services.redis = "unhealthy";
				healthStatus.status = "degraded";
			}

			// Check Database
			try {
				await db.execute(`SELECT 1`);
				healthStatus.services.database = "healthy";
			} catch {
				healthStatus.services.database = "unhealthy";
				healthStatus.status = "degraded";
			}

			// Set appropriate status code
			if (healthStatus.status === "degraded") {
				set.status = 503;
				return ResponseToolkit.error("Service partially unavailable", 503);
			}

			return ResponseToolkit.success(healthStatus, "All systems operational");
		},
		{
			response: {
				200: SuccessResponseSchema(HealthCheckSchema),
				503: HealthCheckSchema503,
			},
			detail: {
				summary: "Health check",
				description: "Check the health status of all services",
			},
		},
	)

	// ============================================
	// READINESS CHECK
	// ============================================
	.get(
		"/ready",
		async ({ set }) => {
			try {
				// Check if database is ready
				await db.execute(`SELECT 1`);

				// Check if Redis is ready
				const redis = RedisClient.getRedisClient();
				await redis.ping();

				return ResponseToolkit.success({ ready: true }, "Service is ready");
			} catch {
				set.status = 503;
				return ResponseToolkit.error("Service not ready", 503);
			}
		},
		{
			response: {
				200: SuccessResponseSchema(t.Object({ ready: t.Boolean() })),
				503: CommonResponseSchemas[503] || CommonResponseSchemas[500],
			},
			detail: {
				summary: "Readiness check",
				description: "Check if the service is ready to accept traffic",
			},
		},
	)

	// ============================================
	// LIVENESS CHECK
	// ============================================
	.get(
		"/live",
		() => {
			// Simple check that the service is running
			return ResponseToolkit.success({ alive: true }, "Service is alive");
		},
		{
			response: {
				200: SuccessResponseSchema(t.Object({ alive: t.Boolean() })),
			},
			detail: {
				summary: "Liveness check",
				description: "Check if the service is alive",
			},
		},
	);
