import { DatatableToolkit } from "@toolkit/datatable";
import { ResponseToolkit } from "@toolkit/response";
import Elysia, { t } from "elysia";
import { authPlugin } from "packages/auth/auth.plugin";
import { PermissionService } from "./service";
import { DatatableQueryParams } from "../../../types/datatable";
import { roleGuard } from "@packages/*";

export const PermissionModule = new Elysia({
	prefix: "/permissions",
})
	.use(authPlugin)
	.guard({
		beforeHandle: ({ user, set }) => {
			if (!user) {
				set.status = 401;
				return false;
			}

			return true;
		},
	})
	.get(
		"/",
		async (ctx) => {
			const queryParam = DatatableToolkit.parseFilter(ctx);
			const result = await PermissionService.findAll(queryParam);

			return ResponseToolkit.success(
				ctx,
				result,
				"Permission list retrieved successfully",
				200,
			);
		},
		{
			query: DatatableQueryParams,
			beforeHandle: roleGuard(["superuser"]),
		},
	)
	.post(
		"create",
		async (ctx) => {
			await PermissionService.create(ctx.body);

			return ResponseToolkit.success(
				ctx,
				{},
				"Create permission endpoint works!",
				200,
			);
		},
		{
			body: t.Object({
				name: t.Array(t.String()),
				group: t.String(),
			}),
		},
	)
	.get("/:id", async (ctx) => {
		const { id } = ctx.params;
		const result = await PermissionService.detail(id);
		return ResponseToolkit.success(
			ctx,
			result,
			"Permission detail retrieved successfully",
			200,
		);
	})
	.patch(
		"/:id",
		async (ctx) => {
			const { id } = ctx.params;
			await PermissionService.update(id, ctx.body);
			return ResponseToolkit.success(
				ctx,
				{},
				"Permission updated successfully",
				200,
			);
		},
		{
			body: t.Object({
				name: t.String(),
				group: t.String(),
			}),
		},
	)
	.delete("/:id", async (ctx) => {
		const { id } = ctx.params;
		await PermissionService.delete(id);
		return ResponseToolkit.success(
			ctx,
			{},
			"Permission deleted successfully",
			200,
		);
	});
