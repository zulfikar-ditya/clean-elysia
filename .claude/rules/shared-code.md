# Rule: Shared code lives in `src/libs/`

If a piece of code is used by **more than one module** — or could plausibly be reused — it does **not** live inside `src/modules/`. It lives in `src/libs/<bucket>/`, behind one of the dedicated path aliases.

`src/modules/<name>/` is for code that is **specific to that one feature**. Routes, that feature's TypeBox schemas, that feature's service object — nothing else. The moment a helper, plugin, error class, type, or repository is referenced from a second place, move it to `libs/`.

## The buckets (and what belongs in each)

| Bucket               | Alias           | Belongs here                                                                                          |
| -------------------- | --------------- | ----------------------------------------------------------------------------------------------------- |
| `libs/cache/`        | `@cache`        | Cache wrapper (`Cache.get/set/del`) and cache-key builders (`UserInformationCacheKey`, …)             |
| `libs/config/`       | `@config`       | Env-derived config objects (`AppConfig`, `DatabaseConfig`, `JWT_CONFIG`, `MailConfig`, …)             |
| `libs/database/`     | `@database`     | `db` instance, Drizzle `schema`, table exports, `DbTransaction`, `RedisClient`, ClickHouse client     |
| `libs/default/`      | `@default`      | Stable cross-feature constants (`StrongPassword`, `paginationLength`, `defaultSort`, token lifetimes) |
| `libs/errors/`       | `@errors`       | Custom error classes (`BadRequestError`, `NotFoundError`, …)                                          |
| `libs/guards/`       | `@guards`       | Authorization guards (`PermissionGuard`, `RoleGuard`)                                                 |
| `libs/mailer/`       | `@mailer`       | Mail transport, templates, and service classes (`AuthMailService`, `EmailService`)                    |
| `libs/plugins/`      | `@plugins`      | Reusable Elysia plugins (`AuthPlugin`, `SecurityPlugin`, …) and the DI `container`                    |
| `libs/repositories/` | `@repositories` | Data-access factories (see `rules/repositories.md`)                                                   |
| `libs/types/`        | `@types`        | Shared TypeScript types (DTOs, query-param types, enums-as-types)                                     |
| `libs/utils/`        | `@utils`        | Pure helpers (`Hash`, `log`, `ResponseToolkit`, `DatatableToolkit`, date/number/string utilities)     |

The Elysia app skeleton itself (`@base` → `src/base.ts`) and the BullMQ tree (`@bull` → `src/bull/`) sit beside `libs/` but follow the same "no module-local imports" principle.

## Hard rules

1. **No relative imports across modules.** A file in `src/modules/auth/` may not `import "../../profile/..."`. If two modules need the same thing, lift it to `libs/`.
2. **No module-internal helpers leaking out.** Files in `src/modules/<name>/` may only be imported by other files in the **same** module folder. The exception is the module's exported Elysia instance (`AuthModule`, `ProfileModule`, …), which is consumed by `src/modules/index.ts`.
3. **Every shared thing imports through its alias**, never via relative path: `import { UserRepository } from "@repositories"`, not `import { UserRepository } from "../../libs/repositories/user.repository"`. Aliases are defined in `tsconfig.json` `paths`.
4. **Every `libs/<bucket>/` folder has an `index.ts` barrel** that re-exports everything in the bucket. New files must be added to the barrel — otherwise the alias won't resolve them.

## Decision flow when adding a new file

1. Will exactly **one** module use it, ever? → put it in that module's folder.
2. Will two or more modules use it, **or** is it a cross-cutting concern (auth, logging, errors, cache, mail, persistence)? → put it in the appropriate `libs/<bucket>/` and re-export from that bucket's `index.ts`.
3. Doesn't fit any existing bucket but is genuinely shared? → think twice before adding a new bucket. A new bucket means a new `tsconfig.json` path entry, a new top-level `index.ts`, and a new mental category for everyone reading the code. Prefer fitting it into `utils/` or `default/` unless it's a clear cross-cutting concern (like a new infrastructure client).

## Within `libs/utils/`

`@utils` is the catch-all for **pure** helpers. Anything stateful or I/O-bound belongs elsewhere:

- Cache → `@cache`
- Database / Redis client → `@database`
- Plugin / middleware → `@plugins`
- Mail → `@mailer`

The current sub-structure:

```
libs/utils/
├── date.ts                 # dayjs wrappers
├── number.ts
├── string.ts
├── security/
│   ├── hash.ts             # Hash (bcrypt wrapper)
│   └── encrypt.ts          # Encrypt/Decrypt (crypto-js wrapper)
├── elysia/
│   ├── datatable.ts        # DatatableToolkit
│   ├── logger.ts           # pino `log`
│   └── response.ts         # ResponseToolkit, commonResponse, commonPaginatedResponse
└── toolkit/                # same files re-exported for older import paths
```

When adding a new util, find the closest existing file (`date.ts`, `string.ts`, …) before creating a new one. If you create a new file, add it to `libs/utils/index.ts`.

## Examples — where to put it

- A regex for validating phone numbers, used by user + profile schemas → `libs/default/phone.ts` (sibling to `strong-password.ts`).
- A function that turns a UUID into a short slug, used in 3 modules → `libs/utils/string.ts` (extend existing file) or a new `libs/utils/slug.ts`.
- An Elysia plugin that adds an `X-Request-Region` header → `libs/plugins/region.plugin.ts`, re-exported from `libs/plugins/index.ts`.
- A "users with active subscription" SQL helper → `libs/repositories/user.repository.ts` (extend, don't create a new repo per query).
- A `WelcomeEmailPayload` type used by the mailer and the auth service → `libs/types/libs/mailer.ts` or `libs/types/repositories/...`, re-exported by `libs/types/index.ts`.
- A constant for "max allowed login attempts" used by the auth plugin and the auth module → `libs/default/login-attempts.ts`.

## Don't

- Don't `import` from another module via relative path. If you're typing `../../modules/...`, stop — the thing belongs in `libs/`.
- Don't duplicate a helper across modules "for now". Lift it on the first reuse, not the third.
- Don't import directly from a bucket's file (`@utils/elysia/response`) when the barrel re-exports it — always import from the bucket root (`@utils`). The only time deep imports are acceptable is when the barrel intentionally omits the symbol.
- Don't add a new top-level `src/` folder for shared code. The choices are `src/libs/<bucket>/`, `src/bull/`, or `src/base.ts` — that's it.
