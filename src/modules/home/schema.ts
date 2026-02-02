import { t } from "elysia";

export const AppInfoSchema = t.Object({
	app_name: t.String(),
	app_env: t.String(),
	date: t.String(),
});

export const HealthCheckDataSchema = t.Object({
	status: t.String(),
	timestamp: t.String(),
	services: t.Object({
		database: t.String(),
		redis: t.String(),
	}),
});

export const HealthCheckSuccessSchema = t.Object({
	status: t.Literal(200),
	message: t.String(),
	data: HealthCheckDataSchema,
	success: t.Literal(true),
});

export const HealthCheckErrorSchema = t.Object({
	status: t.Literal(503),
	message: t.String(),
	data: t.Null(),
	success: t.Literal(false),
});
