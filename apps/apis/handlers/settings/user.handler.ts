import { AppContext } from "@app/apis/types/elysia";
import { StrongPassword } from "@default/strong-password";
import { db, user_rolesTable, usersTable } from "@postgres/index";
import { ResponseToolkit } from "@toolkit/response";
import vine from "@vinejs/vine";
import { and, eq, isNull, not } from "drizzle-orm";
import { UserRepository } from "@apis/repositories/user.repository";
import { DatatableToolkit } from "@toolkit/datatable";
import { Hash } from "@security/hash";

const UserSchema = {
	CreateUserSchema: vine.object({
		name: vine.string().minLength(2).maxLength(100),
		email: vine.string().email().maxLength(255),
		status: vine
			.enum(["active", "inactive", "suspended", "blocked"])
			.optional(),
		remark: vine.string().maxLength(255).optional(),
		password: vine.string().regex(StrongPassword).confirmed(),
		role_ids: vine.array(vine.string().uuid()).optional(),
	}),
	UpdateUserSchema: vine.object({
		name: vine.string().minLength(2).maxLength(100),
		email: vine.string().email().maxLength(255),
		status: vine
			.enum(["active", "inactive", "suspended", "blocked"])
			.optional(),
		remark: vine.string().maxLength(255).optional(),
		role_ids: vine.array(vine.string().uuid()).optional(),
	}),
	ResetPasswordSchema: vine.object({
		password: vine.string().regex(StrongPassword).confirmed(),
	}),
	ResendVerificationEmailSchema: vine.object({
		email: vine.string().email().maxLength(255),
	}),
	ResendResetPasswordEmailSchema: vine.object({
		email: vine.string().email().maxLength(255),
	}),
};

export const UserHandler = {
	list: async (ctx: AppContext) => {
		const datatable = DatatableToolkit.parseFilter(ctx);
		const result = await UserRepository().findAll(datatable);

		return ResponseToolkit.success(
			ctx,
			{
				data: result.data,
				meta: {
					totalCount: result.meta.totalCount,
					page: result.meta.page,
					perPage: result.meta.limit,
				},
			},
			"Success get user list",
			200,
		);
	},

	create: async (ctx: AppContext) => {
		const payload = ctx.body;
		const validate = await vine.validate({
			schema: UserSchema.CreateUserSchema,
			data: payload,
		});

		await UserRepository().create({
			name: validate.name,
			email: validate.email,
			password: validate.password,
			status: validate.status || "active",
			remark: validate.remark || undefined,
			role_ids: validate.role_ids || [],
		});

		return ResponseToolkit.success(ctx, {}, "User created successfully", 201);
	},

	detail: async (ctx: AppContext) => {
		const userId = ctx.params.id;
		const user = await UserRepository().getDetail(userId);

		return ResponseToolkit.success(ctx, user, "Success get user detail", 200);
	},

	update: async (ctx: AppContext) => {
		const userId = ctx.params.id;
		const payload = ctx.body;

		const validate = await vine.validate({
			schema: UserSchema.UpdateUserSchema,
			data: payload,
		});

		const user = await db.query.users.findFirst({
			where: eq(usersTable.id, userId),
		});

		if (!user) {
			return ResponseToolkit.notFound(ctx, "User not found");
		}

		// validate the email, cant be duplicate, make sure the email only for this user
		const isEmailExist = await db
			.select()
			.from(usersTable)
			.where(
				and(
					eq(usersTable.email, validate.email),
					isNull(usersTable.deleted_at),
					not(eq(usersTable.id, userId)),
				),
			)
			.limit(1);

		if (isEmailExist.length > 0) {
			return ResponseToolkit.validationError(ctx, [
				{
					field: "email",
					message: "Email already exists",
				},
			]);
		}

		await db.transaction(async (trx) => {
			const updatedUser = await trx
				.update(usersTable)
				.set({
					name: validate.name,
					email: validate.email,
					...(validate.status && { status: validate.status }),
					...(validate.remark && { remark: validate.remark }),
				})
				.where(eq(usersTable.id, userId))
				.returning();

			// remove all role or adding new role
			if (validate.role_ids && validate.role_ids.length > 0) {
				if (updatedUser.length > 0) {
					await trx
						.delete(user_rolesTable)
						.where(eq(user_rolesTable.userId, userId));
					const userRoles: {
						userId: string;
						roleId: string;
					}[] = validate.role_ids.map((roleId) => ({
						userId,
						roleId,
					}));
					await trx.insert(user_rolesTable).values(userRoles);
				}
			} else {
				if (updatedUser.length > 0) {
					await trx
						.delete(user_rolesTable)
						.where(eq(user_rolesTable.userId, userId));
				}
			}
		});

		return ResponseToolkit.success(ctx, {}, "User updated successfully", 200);
	},

	delete: async (ctx: AppContext) => {
		const userId = ctx.params.id;

		await UserRepository().delete(userId);

		return ResponseToolkit.success(ctx, {}, "User deleted successfully", 200);
	},

	resetPassword: async (ctx: AppContext) => {
		const userId = ctx.params.id;
		const payload = ctx.body;

		const validate = await vine.validate({
			schema: UserSchema.ResetPasswordSchema,
			data: payload,
		});

		const user = await UserRepository().getDetail(userId);
		const hashedPassword = await Hash.generateHash(validate.password);

		await db
			.update(usersTable)
			.set({
				password: hashedPassword,
			})
			.where(eq(usersTable.id, user.id));

		return ResponseToolkit.success(
			ctx,
			{},
			"User password reset successfully",
			200,
		);
	},
};
