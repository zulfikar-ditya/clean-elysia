import { AppConfig } from "@config";
import { DateToolkit, ResponseToolkit } from "@toolkit";
import { Context } from "elysia";

export const HomeHandler = {
	home: (ctx: Context) => {
		return ResponseToolkit.success<{
			app_name: string;
			app_env: string;
			date: string;
		}>(
			ctx,
			{
				app_name: AppConfig.APP_NAME,
				app_env: AppConfig.APP_ENV,
				date: DateToolkit.getDateTimeInformativeWithTimezone(DateToolkit.now()),
			},
			`Welcome to ${AppConfig.APP_NAME}`,
			200,
		);
	},

	health: (ctx: Context) => {
		return ResponseToolkit.success(ctx, null, "Ok", 200);
	},
};
