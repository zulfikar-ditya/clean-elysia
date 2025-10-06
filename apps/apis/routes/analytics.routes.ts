import { Elysia, t } from "elysia";
import { AuthEventsRepository } from "packages/db/clickhouse/repositories/auth-events.repository";
import { UserActivitiesRepository } from "packages/db/clickhouse/repositories/user-activities.repository";
import { authMiddleware } from "../middleware";
import { AppContext } from "../types/elysia";

const userActivitiesRepo = new UserActivitiesRepository();
const authEventsRepo = new AuthEventsRepository();

export const analyticsRoutes = new Elysia({ prefix: "/analytics" })
	.derive(async (ctx) => {
		await authMiddleware(ctx as AppContext);
		return {};
	})
	// User Activities
	.get(
		"/activities/recent",
		async ({ query }) => {
			const limit = Number(query.limit) || 100;
			return await userActivitiesRepo.getRecentActivities(limit);
		},
		{
			query: t.Object({
				limit: t.Optional(t.String()),
			}),
		},
	)

	.get(
		"/activities/user/:userId",
		async ({ params, query }) => {
			const limit = Number(query.limit) || 50;
			return await userActivitiesRepo.getActivitiesByUser(params.userId, limit);
		},
		{
			params: t.Object({
				userId: t.String(),
			}),
			query: t.Object({
				limit: t.Optional(t.String()),
			}),
		},
	)

	.get(
		"/activities/stats/daily",
		async ({ query }) => {
			const days = Number(query.days) || 30;
			return await userActivitiesRepo.getDailyStats(days);
		},
		{
			query: t.Object({
				days: t.Optional(t.String()),
			}),
		},
	)

	.get(
		"/activities/stats/top-actions",
		async ({ query }) => {
			const days = Number(query.days) || 7;
			return await userActivitiesRepo.getTopActions(days);
		},
		{
			query: t.Object({
				days: t.Optional(t.String()),
			}),
		},
	)

	// Auth Events
	.get(
		"/auth/recent",
		async ({ query }) => {
			const limit = Number(query.limit) || 100;
			return await authEventsRepo.getRecentEvents(limit);
		},
		{
			query: t.Object({
				limit: t.Optional(t.String()),
			}),
		},
	)

	.get(
		"/auth/failed-logins",
		async ({ query }) => {
			const hours = Number(query.hours) || 24;
			return await authEventsRepo.getFailedLogins(hours);
		},
		{
			query: t.Object({
				hours: t.Optional(t.String()),
			}),
		},
	)

	.get(
		"/auth/stats/hourly",
		async ({ query }) => {
			const days = Number(query.days) || 7;
			return await authEventsRepo.getHourlyStats(days);
		},
		{
			query: t.Object({
				days: t.Optional(t.String()),
			}),
		},
	)

	.get(
		"/auth/security/suspicious-ips",
		async ({ query }) => {
			const threshold = Number(query.threshold) || 5;
			return await authEventsRepo.getSuspiciousIPs(threshold);
		},
		{
			query: t.Object({
				threshold: t.Optional(t.String()),
			}),
		},
	)

	// Dashboard Summary
	.get("/dashboard", async () => {
		const [recentActivities, topActions, failedLogins, suspiciousIPs] =
			await Promise.all([
				userActivitiesRepo.getRecentActivities(10),
				userActivitiesRepo.getTopActions(7),
				authEventsRepo.getFailedLogins(24),
				authEventsRepo.getSuspiciousIPs(3),
			]);

		return {
			summary: {
				recent_activities_count: recentActivities.length,
				failed_logins_count: failedLogins.length,
				suspicious_ips_count: suspiciousIPs.length,
			},
			recent_activities: recentActivities,
			top_actions: topActions,
			failed_logins: failedLogins.slice(0, 5),
			suspicious_ips: suspiciousIPs,
		};
	});
