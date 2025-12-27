// apps/apis/modules/profile/index.ts - METHOD 3: Using onBeforeHandle
import Elysia, { t } from "elysia";
import { authPlugin } from "packages/plugins/auth.plugin";
import { ProfileService } from "./service";
import { Cache, UserInformationCacheKey } from "@cache/*";
import { UserInformationTypeBox } from "@app/apis/types/UserInformation";
import {
	ResponseToolkit,
	SuccessResponseSchema,
	CommonResponseSchemas,
} from "@toolkit/response";
import { UnauthorizedError } from "packages/errors";

export const ProfileModule = new Elysia({
	prefix: "/profile",
	detail: { tags: ["Profile"] },
})
	.use(authPlugin)

	// Add authentication check for all routes in this module
	.onBeforeHandle(({ user, set }) => {
		if (!user) {
			set.status = 401;
			throw new UnauthorizedError("Authentication required");
		}
	})

	// ============================================
	// GET PROFILE
	// ============================================
	.get(
		"/",
		({ user }) => {
			return ResponseToolkit.success(user!, "Profile retrieved successfully");
		},
		{
			isAuthenticated: true,
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
			const updatedProfile = await ProfileService.updateProfile(user!.id, {
				name: body.name,
				email: body.email,
			});

			// Update cache
			const cacheKey = UserInformationCacheKey(user!.id);
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
