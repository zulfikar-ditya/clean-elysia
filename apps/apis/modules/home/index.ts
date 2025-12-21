import { db, RedisClient } from "@infra/*";
import { DateToolkit } from "@toolkit/date";
import { ResponseToolkit } from "@toolkit/response";
import { AppConfig } from "config/app.config";
import { Elysia, t } from "elysia";

export const HomeModule = new Elysia()
	.get(
		"/",
		({ set }) => {
			set.status = 200;
			return ResponseToolkit.success<{
				app_name: string;
				app_env: string;
				date: string;
			}>(
				{
					app_name: AppConfig.APP_NAME,
					app_env: AppConfig.APP_ENV,
					date: DateToolkit.getDateTimeInformativeWithTimezone(
						DateToolkit.now(),
					),
				},
				`Welcome to ${AppConfig.APP_NAME}`,
				200,
			);
		},
		{
			response: {
				200: t.Object({
					status: t.Number({
						example: 200,
					}),
					success: t.Boolean({
						example: true,
					}),
					message: t.String({
						example: `Welcome to ${AppConfig.APP_NAME}`,
					}),
					data: t.Nullable(
						t.Object({
							app_name: t.String({
								example: AppConfig.APP_NAME,
							}),
							app_env: t.String({
								example: AppConfig.APP_ENV,
							}),
							date: t.String({
								example: DateToolkit.getDateTimeInformativeWithTimezone(
									DateToolkit.now(),
								),
							}),
						}),
					),
				}),
			},
			detail: {
				tags: ["Home"],
			},
		},
	)
	.get(
		"/health",
		async ({ set }) => {
			// Redis check
			try {
				const redis = RedisClient.getRedisClient();
				await redis.ping();
			} catch {
				set.status = 500;
				return ResponseToolkit.error("Error connecting to Redis", 500);
			}

			// Database check
			try {
				await db.execute(`SELECT 1`);
			} catch {
				set.status = 500;
				return ResponseToolkit.error("Error connecting to Database", 500);
			}

			set.status = 200;
			return ResponseToolkit.success<null>(null, "Ok", 200);
		},
		{
			response: {
				200: t.Object({
					status: t.Number({
						example: 200,
					}),
					success: t.Boolean({
						example: true,
					}),
					message: t.String({
						example: "Ok",
					}),
					data: t.Null(),
				}),
				500: t.Object({
					status: t.Number({
						example: 500,
					}),
					success: t.Boolean({
						example: false,
					}),
					message: t.String({
						example: "Error connecting to Database",
					}),
					data: t.Null({
						example: null,
					}),
				}),
			},
			detail: {
				tags: ["Home"],
			},
		},
	);
