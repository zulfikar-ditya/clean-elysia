import { AppContext } from "@app/apis/types/elysia";
import { ResponseToolkit } from "@toolkit/response";
import vine from "@vinejs/vine";
import { DatatableToolkit } from "@toolkit/datatable";
import { PermissionRepository } from "@app/apis/repositories";

const PermissionSchema = {
	CreatePermissionSchema: vine.object({
		name: vine.array(vine.string().minLength(2).maxLength(100)),
		group: vine.string().minLength(2).maxLength(100),
	}),
	UpdatePermissionSchema: vine.object({
		name: vine.string().minLength(2).maxLength(100),
		group: vine.string().minLength(2).maxLength(100),
	}),
};

export const PermissionHandler = {
	list: async (ctx: AppContext) => {
		const queryParam = DatatableToolkit.parseFilter(ctx);
		const datatable = await PermissionRepository().findAll(queryParam);

		return ResponseToolkit.success(
			ctx,
			{
				data: datatable.data,
				meta: datatable.meta,
			},
			"Permission list retrieved successfully",
			200,
		);
	},

	create: async (ctx: AppContext) => {
		const payload = ctx.body as {
			name: string[];
			group: string;
		};

		const validate = await vine.validate({
			schema: PermissionSchema.CreatePermissionSchema,
			data: payload,
		});

		await PermissionRepository().create({
			name: validate.name,
			group: validate.group,
		});

		return ResponseToolkit.success(
			ctx,
			{},
			`Success create permission group ${validate.group}`,
			201,
		);
	},

	detail: async (ctx: AppContext) => {
		const permissionId = ctx.params.id;
		const permission = await PermissionRepository().getDetail(permissionId);

		return ResponseToolkit.success(
			ctx,
			{ ...permission },
			"Permission retrieved successfully",
			200,
		);
	},

	update: async (ctx: AppContext) => {
		const permissionId = ctx.params.id;

		const payload = ctx.body as {
			name: string[];
			group: string;
		};

		const validate = await vine.validate({
			schema: PermissionSchema.UpdatePermissionSchema,
			data: payload,
		});

		await PermissionRepository().update(permissionId, {
			name: validate.name,
			group: validate.group,
		});

		return ResponseToolkit.success(
			ctx,
			{},
			`Success update permission ${validate.name}`,
			200,
		);
	},

	delete: async (ctx: AppContext) => {
		const permissionId = ctx.params.id;
		await PermissionRepository().delete(permissionId);

		return ResponseToolkit.success(ctx, {}, `Success delete permission`, 200);
	},
};
