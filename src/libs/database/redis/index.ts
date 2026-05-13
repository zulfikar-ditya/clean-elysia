import { RedisConfig } from "@config";
import { RedisClient as BunRedisClient } from "bun";

const buildRedisUrl = (): string => {
	const auth = RedisConfig.REDIS_PASSWORD
		? `:${encodeURIComponent(RedisConfig.REDIS_PASSWORD)}@`
		: "";
	return `redis://${auth}${RedisConfig.REDIS_HOST}:${RedisConfig.REDIS_PORT}/${RedisConfig.REDIS_DB}`;
};

export interface BullConnectionOptions {
	host: string;
	port: number;
	password?: string;
	db: number;
	maxRetriesPerRequest: number | null;
}

export class RedisClient {
	private static redis: BunRedisClient | null = null;

	static getRedisClient(): BunRedisClient {
		if (!this.redis) {
			this.redis = new BunRedisClient(buildRedisUrl());
		}

		return this.redis;
	}

	static getQueueConnection(): BullConnectionOptions {
		return {
			host: RedisConfig.REDIS_HOST,
			port: RedisConfig.REDIS_PORT,
			password: RedisConfig.REDIS_PASSWORD || undefined,
			db: RedisConfig.REDIS_DB,
			maxRetriesPerRequest: null,
		};
	}
}
