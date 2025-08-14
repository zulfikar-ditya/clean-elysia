import { RBACSeeder } from "./rbac.seed";
import { UserSeeder } from "./user.seed";

const run = async () => {
	await RBACSeeder();
	await UserSeeder();
};

await run()
	.then(() => {
		// eslint-disable-next-line
		console.log("Seeding completed successfully");
	})
	.catch((error) => {
		// eslint-disable-next-line
		console.error("Error occurred during seeding:", error);
	});
