// scripts/migrate-clickhouse.ts
import { createClient } from "@clickhouse/client";
import { clickhouseConfig } from "@packages_config/*";
import { readdir, readFile } from "fs/promises";
import { join } from "path";

interface MigrationRecord {
	version: string;
	name: string;
	executed_at: string;
}

class ClickHouseMigrator {
	private client;
	private migrationsDir = join(process.cwd(), "infra/clickhouse/migrations");

	constructor() {
		this.client = createClient({
			url: clickhouseConfig.host,
			username: clickhouseConfig.user,
			password: clickhouseConfig.password,
			database: clickhouseConfig.database,
		});
	}

	async initialize() {
		// Create migrations tracking table
		await this.client.query({
			query: `
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version String,
          name String,
          executed_at DateTime64(3) DEFAULT now64()
        ) ENGINE = MergeTree()
        ORDER BY version
      `,
		});
	}

	async getExecutedMigrations(): Promise<string[]> {
		const rs = await this.client.query({
			query: `SELECT version FROM schema_migrations ORDER BY version`,
			format: "JSONEachRow",
		});

		const rows = await rs.json<{ version: string }>();
		return rows.map((r) => r.version);
	}

	async getMigrationFiles(): Promise<
		Array<{ version: string; name: string; path: string }>
	> {
		const files = await readdir(this.migrationsDir);
		const migrations = files
			.filter((f) => f.endsWith(".sql"))
			.map((f) => {
				const [version, ...nameParts] = f.replace(".sql", "").split("_");
				return {
					version,
					name: nameParts.join("_"),
					path: join(this.migrationsDir, f),
				};
			})
			.sort((a, b) => a.version.localeCompare(b.version));

		return migrations;
	}

	async executeMigration(migration: {
		version: string;
		name: string;
		path: string;
	}) {
		console.log(`Executing migration ${migration.version}_${migration.name}`);

		const sql = await readFile(migration.path, "utf-8");

		// Split by semicolon and execute each statement
		const statements = sql
			.split(";")
			.map((s) => s.trim())
			.filter((s) => s.length > 0);

		for (const statement of statements) {
			await this.client.query({ query: statement });
		}

		// Record migration as executed
		await this.client.query({
			query: `
        INSERT INTO schema_migrations (version, name)
        VALUES ({version:String}, {name:String})
      `,
			query_params: {
				version: migration.version,
				name: migration.name,
			},
		});

		console.log(`✓ Migration ${migration.version}_${migration.name} completed`);
	}

	async migrate() {
		await this.initialize();

		const executedMigrations = await this.getExecutedMigrations();
		const allMigrations = await this.getMigrationFiles();

		const pendingMigrations = allMigrations.filter(
			(m) => !executedMigrations.includes(m.version),
		);

		if (pendingMigrations.length === 0) {
			console.log("No pending migrations");
			return;
		}

		console.log(`Found ${pendingMigrations.length} pending migrations`);

		for (const migration of pendingMigrations) {
			await this.executeMigration(migration);
		}

		console.log("All migrations completed successfully");
	}

	async rollback(targetVersion?: string) {
		// Implement rollback logic if needed
		// ClickHouse doesn't support transactions, so this would need careful handling
		throw new Error(
			"Rollback not implemented - ClickHouse migrations should be carefully planned",
		);
	}
}

// CLI runner
async function main() {
	const migrator = new ClickHouseMigrator();

	const command = process.argv[2];

	switch (command) {
		case "migrate":
			await migrator.migrate();
			break;
		case "status":
			await migrator.initialize();
			const executed = await migrator.getExecutedMigrations();
			const all = await migrator.getMigrationFiles();
			const pending = all.filter((m) => !executed.includes(m.version));

			console.log(`Executed: ${executed.length}`);
			console.log(`Pending: ${pending.length}`);

			if (pending.length > 0) {
				console.log("Pending migrations:");
				pending.forEach((m) => console.log(`  - ${m.version}_${m.name}`));
			}
			break;
		default:
			console.log("Usage: npm run migrate:clickhouse [migrate|status]");
	}

	process.exit(0);
}

if (require.main === module) {
	main().catch(console.error);
}

export { ClickHouseMigrator };
