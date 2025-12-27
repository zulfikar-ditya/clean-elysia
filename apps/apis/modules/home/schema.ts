import { t } from "elysia";

export const AppInfoSchema = t.Object({
	app_name: t.String(),
	app_env: t.String(),
	date: t.String(),
});

export const HealthCheckSchema = t.Object({
	status: t.String(),
	timestamp: t.String(),
	services: t.Object({
		database: t.String(),
		redis: t.String(),
	}),
});

export const HealthCheckSchema503 = t.Object({
	status: t.Literal(503),
	success: t.Literal(false),
	message: t.String(),
	data: t.Null(),
});
