import Elysia, { t } from "elysia";
import { authPlugin } from "packages/auth/auth.plugin";
import { ProfileService } from "./service";
import { Cache, UserInformationCacheKey } from "@cache/*";
import {
	UserInformation,
	UserInformationTypeBox,
} from "@app/apis/types/UserInformation";
import { ResponseToolkit } from "@toolkit/response";
import { UnauthorizedError } from "@app/apis/errors";

export const ProfileModule = new Elysia({
	prefix: "/profile",
})
	.use(authPlugin)
	.get(
		"/",
		({ store }) => {
			const userInformation = store.user as UserInformation;

			if (!userInformation) {
				throw new UnauthorizedError("Unauthorized");
			}

			return ResponseToolkit.success<UserInformation>(
				userInformation,
				"Profile fetched successfully",
				200,
			);
		},
		{
			response: {
				200: t.Object({
					status: t.Number(),
					success: t.Boolean(),
					message: t.String(),
					data: UserInformationTypeBox,
				}),
			},
			detail: {
				tags: ["Profile"],
			},
		},
	)
	.patch(
		"/",
		async ({ store, body }) => {
			const userInformation = store.user as UserInformation;

			if (!userInformation) {
				throw new UnauthorizedError("Unauthorized");
			}

			const updatedProfile = await ProfileService.updateProfile(
				userInformation.id,
				{
					name: body.name || userInformation.name,
					email: body.email,
				},
			);

			const cacheKey = UserInformationCacheKey(userInformation.id);
			await Cache.set(cacheKey, updatedProfile, 3600);

			return ResponseToolkit.success<UserInformation>(
				updatedProfile,
				"Profile updated successfully",
				200,
			);
		},
		{
			body: t.Object({
				name: t.String({
					minLength: 1,
					maxLength: 255,
				}),
				email: t.String({
					format: "email",
					maxLength: 255,
				}),
			}),
			response: {
				200: t.Object({
					status: t.Number(),
					success: t.Boolean(),
					message: t.String(),
					data: UserInformationTypeBox,
				}),
			},
			detail: {
				tags: ["Profile"],
			},
		},
	);
