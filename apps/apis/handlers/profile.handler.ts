import { db, usersTable } from "@postgres";
import { ResponseToolkit } from "@toolkit/response";
import vine from "@vinejs/vine";
import { and, eq, ne } from "drizzle-orm";
import { StrongPassword } from "@default/strong-password";
import { Hash } from "@security/hash";
import { AppContext } from "@apis/types/elysia";
import { UserInformation } from "../types/UserInformation";

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

		// validate the email is used by another user
		const isEmailExist = await db
			.select()
			.from(usersTable)
			.where(
				and(eq(usersTable.email, validation.email), ne(usersTable.id, user.id)),
			)
			.limit(1);

		if (isEmailExist.length > 0) {
			return ResponseToolkit.error(ctx, "Email already in use.", 409);
		}

		// update the user data
		const [updatedUser] = await db.transaction(async (tx) => {
			return await tx
				.update(usersTable)
				.set({
					name: validation.name,
					email: validation.email,
				})
				.where(eq(usersTable.id, user.id))
				.returning();
		});

		return ResponseToolkit.success(
			ctx,
			{
				id: updatedUser.id,
				name: updatedUser.name,
				email: updatedUser.email,
				created_at: updatedUser.created_at,
				updated_at: updatedUser.updated_at,
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

		// Check if the current password is correct
		const currentUser = await db
			.select()
			.from(usersTable)
			.where(eq(usersTable.id, user.id))
			.limit(1);

		if (currentUser.length === 0) {
			return ResponseToolkit.unauthorized(ctx);
		}

		// compare password
		const isPasswordValid = await Hash.compareHash(
			payload.current_password,
			currentUser[0].password,
		);
		if (!isPasswordValid) {
			return ResponseToolkit.validationError(ctx, [
				{
					field: "current_password",
					message: "Current password is incorrect",
				},
			]);
		}

		// Update the user's password
		await db.transaction(async (tx) => {
			await tx
				.update(usersTable)
				.set({
					password: await Hash.generateHash(payload.new_password),
				})
				.where(eq(usersTable.id, user.id));
		});

		return ResponseToolkit.success(
			ctx,
			null,
			"Password updated successfully",
			200,
		);
	},
};
