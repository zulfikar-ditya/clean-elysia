import { RoleRepository } from "@app/apis/repositories/role.repository";
import { AppContext } from "@app/apis/types/elysia";
import { DatatableToolkit } from "@toolkit/datatable";
import { ResponseToolkit } from "@toolkit/response";
import vine from "@vinejs/vine";

const RoleSchema = {
	CreatePermissionSchema: vine.object({
		name: vine.string().minLength(2).maxLength(255),
		permission_ids: vine.array(vine.string().minLength(1).uuid()),
	}),
	UpdatePermissionSchema: vine.object({
		name: vine.string().minLength(2).maxLength(255),
		permission_ids: vine.array(vine.string().minLength(1).uuid()),
	}),
};

export const RoleHandler = {
	list: async (ctx: AppContext) => {
		const queryParam = DatatableToolkit.parseFilter(ctx);
		const datatable = await RoleRepository().findAll(queryParam);

		return ResponseToolkit.success(
			ctx,
			{
				data: datatable.data,
				meta: datatable.meta,
			},
			"Success get role list",
			200,
		);
	},

	create: async (ctx: AppContext) => {
		const payload = ctx.body as {
			name: string;
			permission_ids: string[];
		};

		const validate = await vine.validate({
			schema: RoleSchema.CreatePermissionSchema,
			data: payload,
		});

		await RoleRepository().create(validate);

		return ResponseToolkit.success(ctx, {}, "Success create new role", 200);
	},

	detail: async (ctx: AppContext) => {
		const roleId = ctx.params.id;
		const role = await RoleRepository().getDetail(roleId);

		return ResponseToolkit.success(ctx, role, "Success get role detail", 200);
	},

	update: async (ctx: AppContext) => {
		const roleId = ctx.params.id;
		const payload = ctx.body as {
			name: string;
			permission_ids: string[];
		};

		const validate = await vine.validate({
			schema: RoleSchema.UpdatePermissionSchema,
			data: payload,
		});

		await RoleRepository().update(roleId, validate);

		return ResponseToolkit.success(ctx, {}, "Success update role", 200);
	},

	delete: async (ctx: AppContext) => {
		const roleId = ctx.params.id;
		await RoleRepository().delete(roleId);

		return ResponseToolkit.success(ctx, {}, "Success delete role", 200);
	},
};
