import { AppConfig } from "@packages_config/*";
import { DateToolkit, ResponseToolkit } from "@toolkit";
import { Context } from "elysia";

export const HomeHandler = {
	home: (ctx: Context) => {
		return ResponseToolkit.success(
			ctx,
			{
				app_name: AppConfig.APP_NAME,
				app_env: AppConfig.APP_ENV,
				date: DateToolkit.getDateInformative(DateToolkit.now()),
			},
			`Welcome to ${AppConfig.APP_NAME}`,
			200,
		);
	},

	health: (ctx: Context) => {
		return ResponseToolkit.success(ctx, null, "Ok", 200);
	},
};
