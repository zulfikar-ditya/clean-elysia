import { ResponseToolkit } from "@toolkit/response";
import vine from "@vinejs/vine";
import { StrongPassword } from "@default/strong-password";
import { AppContext } from "@apis/types/elysia";
import { UserInformation } from "../types/UserInformation";
import { ProfileService } from "../services";

const ProfileSchema = {
	UpdateProfileSchema: vine.object({
		name: vine.string().maxLength(255),
		email: vine.string().email().maxLength(255),
	}),
	UpdatePassword: vine.object({
		current_password: vine.string(),
		new_password: vine.string().confirmed().regex(StrongPassword),
	}),
};

export const ProfileHandler = {
	profile: (ctx: AppContext) => {
		if (ctx.user === undefined) {
			return ResponseToolkit.unauthorized(ctx);
		}

		const user = ctx.user as UserInformation;

		return ResponseToolkit.success(ctx, user, "User profile retrieved", 200);
	},

	updateProfile: async (ctx: AppContext) => {
		const validation = await vine.validate({
			schema: ProfileSchema.UpdateProfileSchema,
			data: ctx.body as {
				name: string;
				email: string;
			},
		});

		if (ctx.user === undefined) {
			return ResponseToolkit.unauthorized(ctx);
		}

		const user = ctx.user as UserInformation;
		const updatedUser = await ProfileService.updateProfile(user.id, {
			name: validation.name,
			email: validation.email,
		});

		return ResponseToolkit.success<{
			user_information: UserInformation;
		}>(
			ctx,
			{
				user_information: updatedUser,
			},
			"Profile updated successfully",
			200,
		);
	},

	updatePassword: async (ctx: AppContext) => {
		const payload = await vine.validate({
			schema: ProfileSchema.UpdatePassword,
			data: ctx.body as {
				currentPassword: string;
				newPassword: string;
			},
		});

		if (ctx.user === undefined) {
			return ResponseToolkit.unauthorized(ctx);
		}

		const user = ctx.user as UserInformation;
		await ProfileService.updatePassword(user.id, payload);

		return ResponseToolkit.success(
			ctx,
			null,
			"Password updated successfully",
			200,
		);
	},
};
