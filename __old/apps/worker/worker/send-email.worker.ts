import { EmailOptions, EmailService } from "@packages/mail/mail.service";
import { Worker } from "bullmq";
import { RedisClient } from "infra/redis/redis-client";
import { log } from "packages/logger/logger";

const queueRedis = RedisClient.getQueueRedisClient();

const worker = new Worker<EmailOptions>(
	"send-email",
	async (job) => {
		try {
			await EmailService.sendEmail(job.data);
			log.info({}, `Email job processed for ${job.data.to}`);
		} catch (error) {
			log.error(error, `Failed to process email job for ${job.data.to}`);
			throw error;
		}
	},
	{
		connection: queueRedis,
	},
);

worker.on("failed", (job, err) => {
	log.error(err, `Job ${job ? job.id : "unknown"} failed`);
});

export { worker };
