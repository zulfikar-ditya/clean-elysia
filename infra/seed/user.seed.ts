import { db, roleTable, userRolesTable, usersTable } from "@postgres/index";
import { Hash } from "@security/hash";
import { eq } from "drizzle-orm";

export const UserSeeder = async () => {
	await db.transaction(async (tx) => {
		await tx.insert(usersTable).values({
			name: "superuser",
			email: "superuser@example.com",
			password: await Hash.generateHash("password"),
		});

		await tx.insert(usersTable).values({
			name: "admin",
			email: "admin@example.com",
			password: await Hash.generateHash("password"),
		});

		// get created user
		const superUser = await tx
			.select()
			.from(usersTable)
			.where(eq(usersTable.name, "superuser"))
			.limit(1);
		const admin = await tx
			.select()
			.from(usersTable)
			.where(eq(usersTable.name, "admin"))
			.limit(1);

		// assign role
		const superUserRole = await tx
			.select()
			.from(roleTable)
			.where(eq(roleTable.name, "superuser"))
			.limit(1);
		const adminRole = await tx
			.select()
			.from(roleTable)
			.where(eq(roleTable.name, "admin"))
			.limit(1);

		if (superUserRole.at(0) && superUser.at(0)) {
			await tx.insert(userRolesTable).values({
				userId: superUser.at(0)!.id,
				roleId: superUserRole.at(0)!.id,
			});
		}

		if (adminRole.at(0) && admin.at(0)) {
			await tx.insert(userRolesTable).values({
				userId: admin.at(0)!.id,
				roleId: adminRole.at(0)!.id,
			});
		}
	});
};
