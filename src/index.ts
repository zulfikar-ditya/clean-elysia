import { AppConfig, DocsPlugin } from "@libs";
import { bootstraps } from "@modules";
import { Elysia } from "elysia";

const app = new Elysia()
	.use(DocsPlugin)
	.use(bootstraps)
	.listen(AppConfig.APP_PORT);

export default app.fetch;

// eslint-disable-next-line no-console
console.log("Api server started on port: ", AppConfig.APP_PORT);
