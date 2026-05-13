# Rule: BullMQ queues and workers (`src/bull/`)

Background work goes through BullMQ on Redis. Layout:

```
src/bull/
├── index.ts                   # re-exports + side-effect imports workers
├── queue/
│   ├── index.ts               # re-exports all queues
│   └── <feature>-queue.ts     # one Queue per file
└── worker/
    ├── index.ts               # re-exports all workers
    └── <feature>-worker.ts    # one Worker per file
```

`src/bull/index.ts` imports `./worker/index` for its side effects — that's what boots every worker process. Anything that touches `@bull` boots the worker tree. Don't try to defer worker registration.

## Queue file

- One queue per file. Filename: `<job>-queue.ts`. Export name: `<job>Queue` (camelCase).
- Connection comes from `RedisClient.getQueueRedisClient()` (`@database`) — never `new IORedis(...)` directly. Queues and workers share that singleton so they hit the same Redis DB BullMQ expects.
- Queue name is a kebab-case string (`"send-email"`) and must match between the queue and its worker.
- Type the queue payload: `new Queue<EmailOptions>("send-email", { ... })`.
- Set sane `defaultJobOptions` if retries matter:
  ```ts
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
  }
  ```

## Worker file

- One worker per queue, in `src/bull/worker/`. Filename matches: `<job>-worker.ts`.
- Same queue name and same payload type as the queue:
  ```ts
  const worker = new Worker<EmailOptions>("send-email", async (job) => { ... }, {
    connection: queueRedis,
  });
  ```
- The processor function **must** wrap its work in try/catch, log both success and failure with structured `log` from `@utils`, and **re-throw** on failure so BullMQ retries:
  ```ts
  async (job) => {
  	try {
  		await EmailService.sendEmail(job.data);
  		log.info({}, `Email job processed for ${job.data.to}`);
  	} catch (error) {
  		log.error(error, `Failed to process email job for ${job.data.to}`);
  		throw error;
  	}
  };
  ```
- Attach a `.on("failed", (job, err) => log.error(...))` handler — that's the catch-all if all attempts fail.
- Workers do not call repositories directly when the same logic lives in a service. They delegate to `<Feature>Service` / `EmailService` so business rules stay in one place.

## Producing jobs

Services produce, never route handlers:

```ts
import { sendEmailQueue } from "@bull";

await sendEmailQueue.add("welcome", { to: user.email, subject: "Welcome", ... });
```

The first arg is the job name (free-form, used for filtering in dashboards); the second is the typed payload. Always `await` `.add(...)` — `no-floating-promises` is an error.

## Wiring up a new queue

1. Add `src/bull/queue/<job>-queue.ts`, export from `src/bull/queue/index.ts`.
2. Add `src/bull/worker/<job>-worker.ts`, export from `src/bull/worker/index.ts`.
3. Define the payload type under `src/libs/types/` (e.g. `EmailOptions`) — never inline `Record<string, any>` job payloads.
4. Producer-side: import the queue from `@bull` and `.add(...)` from inside a service.

## Don't

- Don't open a new Redis client inside a queue or worker file. Reuse `RedisClient.getQueueRedisClient()`.
- Don't swallow errors inside the worker processor — re-throw so retries happen.
- Don't run blocking, multi-minute jobs without setting an explicit `lockDuration` — the default lease will expire and BullMQ will redeliver the job.
- Don't import a worker from outside `@bull`. The only allowed entry point is the side-effect `import "@bull"` at app startup (it happens transitively when anything imports `@bull`).
