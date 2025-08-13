// import { AppController, AuthController } from "@app/controllers";
// import { authMiddleware } from "@app/middlewares";
import Elysia from "elysia";

const routes = new Elysia();

routes.get("/", () => {
	return {
		status: 200,
		success: true,
		message: "Welcome to the ElysiaJS API",
		data: null,
	};
});

export default routes;
