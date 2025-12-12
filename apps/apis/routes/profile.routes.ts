import { ProfileHandler } from "@apis/handlers/profile.handler";
import { authMiddleware } from "@apis/middleware";
import Elysia from "elysia";

import { AppContext } from "../types/elysia";

export const profileRoutes = new Elysia({ prefix: "/profile" })
	.derive(async (ctx) => {
		await authMiddleware(ctx as AppContext);
		return {};
	})
	.get("/", ProfileHandler.profile)
	.patch("/", ProfileHandler.updateProfile)
	.patch("/password", ProfileHandler.updatePassword);
