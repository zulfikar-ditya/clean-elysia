import { DatatableType } from "@app/apis/types/datatable";
import { PaginationResponse } from "@app/apis/types/pagination";
import { AuthMailService } from "@packages/*";
import { db } from "@postgres/index";
import { UserList, UserRepository } from "@postgres/repositories";
import { users, UserStatusEnum } from "@postgres/schema";
import { Hash } from "@security/hash";
import { eq } from "drizzle-orm";

export const UserService = {
	findAll: async (
		queryParam: DatatableType,
	): Promise<PaginationResponse<UserList>> => {
		return await UserRepository().findAll(queryParam);
	},

	create: async (data: {
		name: string;
		email: string;
		password: string;
		status: UserStatusEnum;
		remarks?: string;
		role_ids: string[];
	}) => {
		await UserRepository().create(data);
	},

	findOne: async (id: string) => {
		return await UserRepository().getDetail(id);
	},

	update: async (
		id: string,
		data: {
			name: string;
			email: string;
			status: UserStatusEnum;
			remarks?: string;
			role_ids: string[];
		},
	) => {
		return await UserRepository().update(id, data);
	},

	resetPassword: async (id: string, newPassword: string) => {
		const user = await UserRepository().getDetail(id);

		const hashPassword = await Hash.generateHash(newPassword);
		await db.transaction(async (tx) => {
			await tx
				.update(users)
				.set({ password: hashPassword })
				.where(eq(users.id, user.id));
		});
	},

	sendEmailVerification: async (id: string) => {
		const user = await UserRepository().getDetail(id);
		const authMailService = new AuthMailService();
		await authMailService.sendVerificationEmail(user.id);
	},

	sendResetPasswordEmail: async (id: string) => {
		const user = await UserRepository().getDetail(id);
		const authMailService = new AuthMailService();
		await authMailService.sendResetPasswordEmail(user.id);
	},

	delete: async (id: string) => {
		return await UserRepository().delete(id);
	},
};
