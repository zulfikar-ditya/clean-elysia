# Clean Architecture Elysia

A production-ready Clean Architecture implementation using Elysia.js with Bun runtime, featuring background job processing, caching, and robust database operations.

## Tech Stack

- Elysia.js - Fast and ergonomic web framework for Bun
- Bun - JavaScript runtime and toolkit
- BullMQ - Redis-based queue for handling distributed jobs
- Redis - In-memory data store for caching and queue backend
- Drizzle ORM - TypeScript ORM with full type safety
- PostgreSQL - Primary relational database
- TypeScript - Type-safe development

## Project Structure

```
src/
├── base.ts                    # Base Elysia app with core plugins
├── index.ts                   # Application entry point
├── bull/                      # Background job processing
│   ├── queue/                 # Queue definitions
│   └── worker/                # Worker implementations
├── libs/                      # Shared libraries and utilities
│   ├── config/                # Configuration files
│   ├── database/              # Database clients (PostgreSQL, Redis, ClickHouse)
│   ├── errors/                # Custom error classes
│   ├── guards/                # Authorization guards
│   ├── mailer/                # Email service
│   ├── plugins/               # Elysia plugins
│   ├── repositories/          # Data access layer
│   ├── types/                 # TypeScript type definitions
│   └── utils/                 # Utility functions
└── modules/                   # Feature modules
    ├── auth/                  # Authentication module
    ├── profile/               # User profile module
    └── settings/              # Settings module
```

## Prerequisites

- Bun v1.0.0 or higher
- PostgreSQL 14 or higher
- Redis 6 or higher
- Docker and Docker Compose (optional)

## Installation

Install dependencies:

```bash
bun install
```

## Configuration

Create a `.env` file in the root directory:

```env
# Application
APP_PORT=3000
APP_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database
DB_USER=your_user
DB_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# Mail
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=your_email
MAIL_PASSWORD=your_password
MAIL_FROM=noreply@example.com
```

## Database Setup

Run database migrations:

```bash
bun run drizzle-kit generate
bun run drizzle-kit migrate
```

Seed the database (optional):

```bash
bun run db:postgres:seed
```

## Development

Start the API server in development mode:

```bash
bun run dev:server
```

Start the worker in development mode:

```bash
bun run dev:worker
```

Start both server and worker concurrently:

```bash
bun run dev:all
```

The API server will be available at http://localhost:3000

## Production

Build the application:

```bash
bun run build:all
```

Start in production mode:

```bash
bun run start:all
```

## Docker

Start all services using Docker Compose:

```bash
docker-compose up -d
```

Stop all services:

```bash
docker-compose down
```

## Available Scripts

### Server

- `bun run dev:server` - Start API server in development mode with hot reload
- `bun run start:server` - Start API server in production mode
- `bun run build:server` - Build API server for production

### Worker

- `bun run dev:worker` - Start background worker in development mode
- `bun run start:worker` - Start background worker in production mode
- `bun run build:worker` - Build worker for production

### Combined

- `bun run dev:all` - Start both server and worker in development mode
- `bun run start:all` - Start both server and worker in production mode
- `bun run build:all` - Build both server and worker for production

### Code Quality

- `bun run lint` - Run ESLint
- `bun run lint:fix` - Run ESLint with auto-fix
- `bun run format` - Format code with Prettier

### Database

- `bun run db:postgres:seed` - Seed PostgreSQL database

## API Documentation

Interactive API documentation is available at:

- Development: http://localhost:3000/docs
- Swagger UI with complete API specifications

## Architecture

This project follows Clean Architecture principles:

### Layers

1. **Modules** - Feature-based modules containing routes and business logic
2. **Repositories** - Data access layer with database operations
3. **Services** - Business logic and orchestration
4. **Plugins** - Cross-cutting concerns (logging, error handling, security)
5. **Utils** - Helper functions and utilities

### Key Patterns

- **Repository Pattern** - Factory functions returning database access methods
- **Service Pattern** - Object exports with business logic methods
- **Plugin Pattern** - Reusable Elysia plugins for middleware
- **Error Handling** - Custom error classes with consistent API responses
- **Validation** - TypeBox schemas for runtime validation

### Background Jobs

BullMQ is used for handling asynchronous tasks:

- Email sending
- Data processing
- Scheduled tasks
- Long-running operations

Jobs are defined in `src/bull/queue/` and processed by workers in `src/bull/worker/`.

### Caching Strategy

Redis is used for:

- Application-level caching
- Session management
- Queue backend for BullMQ
- Rate limiting

### Security Features

- Helmet.js for security headers
- Rate limiting
- JWT authentication
- CORS configuration
- Input validation
- Password hashing with bcrypt

## Code Conventions

- Use kebab-case for file names
- Use absolute imports with path aliases (@libs, @modules, @base)
- Minimal comments - only for complex logic
- Repository functions return factory pattern
- Services export objects, not classes
- Structured logging with pino
- TypeScript strict mode enabled

## Testing

Write tests focusing on behavior:

```typescript
describe("AuthService", () => {
	it("should authenticate user with valid credentials", async () => {
		const result = await AuthService.singIn("user@example.com", "password");
		expect(result).toHaveProperty("id");
		expect(result).toHaveProperty("accessToken");
	});
});
```

## Performance

- Database connection pooling
- Redis caching for expensive queries
- Pagination for list endpoints
- Background job processing for async operations
- Bun's native performance optimizations

## Contributing

1. Follow the code conventions in `.github/copilot-instructions.md`
2. Write clean, focused functions
3. Add validation schemas for all inputs
4. Handle errors explicitly
5. Use structured logging
6. Write tests for new features

## License

Private - All rights reserved by Aolus Software
