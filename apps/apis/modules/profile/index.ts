import { UserInformationTypeBox } from "@app/apis/types/UserInformation";
import { Cache, UserInformationCacheKey } from "@cache/*";
import { AuthPlugin } from "@packages";
import {
	CommonResponseSchemas,
	ResponseToolkit,
	SuccessResponseSchema,
} from "@toolkit/response";
import Elysia, { t } from "elysia";

import { ProfileService } from "./service";

export const ProfileModule = new Elysia({
	prefix: "/profile",
	detail: { tags: ["Profile"] },
})
	.use(AuthPlugin)
	// ============================================
	// GET PROFILE
	// ============================================
	.get(
		"/",
		({ user }) => {
			return ResponseToolkit.success(user, "Profile retrieved successfully");
		},
		{
			response: {
				200: SuccessResponseSchema(UserInformationTypeBox),
				401: CommonResponseSchemas[401],
			},
			detail: {
				summary: "Get current user profile",
				description: "Retrieve the authenticated user's profile information",
			},
		},
	)

	// ============================================
	// UPDATE PROFILE
	// ============================================
	.patch(
		"/",
		async ({ user, body }) => {
			// user is guaranteed to exist here
			const updatedProfile = await ProfileService.updateProfile(user.id, {
				name: body.name,
				email: body.email,
			});

			// Update cache
			const cacheKey = UserInformationCacheKey(user.id);
			await Cache.set(cacheKey, updatedProfile, 3600);

			return ResponseToolkit.success(
				updatedProfile,
				"Profile updated successfully",
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
				200: SuccessResponseSchema(UserInformationTypeBox),
				401: CommonResponseSchemas[401],
				422: CommonResponseSchemas[422],
			},
			detail: {
				summary: "Update user profile",
				description: "Update the authenticated user's profile information",
			},
		},
	);
