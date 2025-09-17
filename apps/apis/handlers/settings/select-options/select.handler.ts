import { AppContext } from "@app/apis/types/elysia";
import { db, roleTable } from "@postgres/index";
import { ResponseToolkit } from "@toolkit/response";
import { ne } from "drizzle-orm";

export const SettingSelectHandler = {
	permissions: async (ctx: AppContext) => {
		const permissions = await db.query.permissions.findMany({
			columns: {
				id: true,
				name: true,
				group: true,
			},
		});

		// Group permissions by 'group' property
		const groupedPermissions = permissions.reduce(
			(acc: Record<string, any[]>, permission: any) => {
				const group = permission.group || "Ungrouped";
				if (!acc[group]) acc[group] = [];
				acc[group].push(permission);
				return acc;
			},
			{},
		);

		return ResponseToolkit.success(
			ctx,
			groupedPermissions,
			"Success get permissions grouped by group",
			200,
		);
	},

	roles: async (ctx: AppContext) => {
		const roles = await db.query.roles.findMany({
			where: ne(roleTable.name, "superuser"),
			columns: {
				id: true,
				name: true,
			},
		});

		return ResponseToolkit.success<{ id: string; name: string }[]>(
			ctx,
			roles,
			"Success get roles grouped by group",
			200,
		);
	},
};
