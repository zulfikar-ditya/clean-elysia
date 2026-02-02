import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { schema } from "./schema";
import { DatabaseConfig } from "@libs";

export * from "./schema/password-reset-token";
export * from "./schema/rbac";
export * from "./schema/user";

const connectionString = DatabaseConfig.url;
const client = new Pool({ connectionString });

const db = drizzle(client, { schema });

export { db, schema };
