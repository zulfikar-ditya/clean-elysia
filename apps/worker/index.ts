import { log } from "@packages/*";

log.info({}, "Worker service is running...");

import "packages/event/worker/send-email.worker";
