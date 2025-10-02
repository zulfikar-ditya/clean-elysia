import { log } from "@packages/*";

log.info({}, "Worker service is running...");

import "@app/worker/worker/send-email.worker";
