# Clean ElysiaJS Starter Template

A clean, production-ready starter template for building modern web applications with [ElysiaJS](https://elysiajs.com/). This template provides a well-structured monorepo setup with TypeScript, multi-database support, Docker integration, and development best practices.

## Features

### Core Framework & Runtime

- **ElysiaJS Framework**: Fast and modern web framework for Bun
- **TypeScript**: Full TypeScript support with strict configuration
- **Bun Runtime**: Lightning-fast JavaScript runtime and package manager

### Architecture & Structure

- **Monorepo Structure**: Organized with `apps`, `packages`, `config`, and `infra` directories
- **Worker Support**: Background job processing with BullMQ
- **Clean Architecture**: Separation of concerns with modular design
- **Modular APIs**: Feature-based module organization (auth, profile, settings)

### Database & ORM

- **PostgreSQL**: Production-ready relational database with Drizzle ORM
- **ClickHouse**: High-performance analytics database with custom migration system
- **Drizzle ORM**: Type-safe database operations and migrations
- **Database Seeding**: Pre-configured seeding with drizzle-seed

### Cache & Queue

- **Redis Integration**: High-performance caching and session management (IORedis)
- **BullMQ**: Robust queue system for background jobs and task processing

### Authentication & Security

- **JWT Authentication**: Secure token-based authentication with @elysiajs/jwt
- **Password Hashing**: Bcrypt integration for secure password storage
- **Encryption**: Crypto-JS for data encryption and decryption
- **Rate Limiting**: Protection against abuse with elysia-rate-limit
- **Helmet**: Security headers with elysia-helmet

### API & Middleware

- **CORS Support**: Configurable cross-origin resource sharing
- **OpenAPI/Swagger**: Auto-generated API documentation with @elysiajs/openapi
- **Bearer Token**: Built-in bearer token support with @elysiajs/bearer
- **Structured Logging**: Logging with Pino and pino-pretty
- **Request ID**: Request tracking and tracing

### Email & Notifications

- **Email Support**: Nodemailer integration for sending emails
- **Template Ready**: Pre-configured email service layer with templates

### Development Tools

- **Docker Support**: Complete containerization with Docker and Docker Compose
- **Hot Reload**: Fast development with Bun's watch mode
- **Code Quality**: ESLint, Prettier, and Husky for consistent code formatting
- **Lint-Staged**: Pre-commit hooks for code quality enforcement
- **Date Handling**: DayJS for modern date/time operations
- **Concurrency**: Run multiple services simultaneously with concurrently

### Environment & Configuration

- **Environment Variables**: Dotenv for configuration management
- **Centralized Config**: Organized configuration in `config/` directory
- **Timezone Support**: Configurable timezone settings

## Prerequisites

- [Bun](https://bun.sh/) (latest version)
- [PostgreSQL](https://www.postgresql.org/) (v18 or higher)
- [Redis](https://redis.io/) (v7 or higher)
- [ClickHouse](https://clickhouse.com/) (v23.12 or higher, optional)
- [Docker](https://www.docker.com/) (optional, for containerization)
- [Make](https://www.gnu.org/software/make/) (optional, for using Makefile commands)

## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/aolus-software/clean-elysia.git
   cd clean-elysia
   ```

2. **Install dependencies**

   ```bash
   bun install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   bun run dev:server
   ```

## Environment Variables

Configure your environment by editing `.env`:

```env
# Application
APP_NAME="Elysia APP"
APP_PORT=3000
APP_URL="http://localhost:3000"
APP_ENV="development"
APP_TIMEZONE="UTC"
APP_KEY="your-app-key"
APP_JWT_SECRET="your-jwt-secret"

# PostgreSQL Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/elysia_db"

# ClickHouse Database
CLICKHOUSE_HOST="http://localhost:8123"
CLICKHOUSE_USER="app"
CLICKHOUSE_PASSWORD="secret"
CLICKHOUSE_DATABASE="app"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD=password123
REDIS_DB=0

# Mail (SMTP)
MAIL_HOST=
MAIL_PORT=
MAIL_SECURE=
MAIL_USER=
MAIL_PASS=
MAIL_FROM=

# Logging & Security
LOG_LEVEL="info"
ALLOWED_HOST="*"
CLIENT_URL="http://localhost:3000"
```

## Quick Start

### Using Bun (Recommended)

```bash
# Install dependencies
bun install

# Start development server with hot reload
bun run dev:server

# Start development worker with hot reload
bun run dev:worker

# Start both server and worker
bun run dev:all

# Build for production
bun run build:all

# Start production server
bun run start:all
```

### Using Make Commands

```bash
# View all available commands
make help

# Development Commands
make dev-api          # Start API development server with hot reload
make dev-server       # Start SERVER development server with hot reload
make dev-worker       # Start WORKER development with hot reload
make dev-all          # Run server and worker in dev mode concurrently

# Build Commands
make build-api        # Build the API application
make build-server     # Build the SERVER application
make build-worker     # Build the WORKER application
make build-all        # Build server and worker concurrently

# Production Commands
make start-api        # Start the API production server
make start-server     # Start the SERVER production server
make start-worker     # Start the WORKER production service
make start-all        # Run server and worker in production concurrently

# Code Quality
make lint             # Run ESLint
make format           # Format code with Prettier

# Database Commands (PostgreSQL - Drizzle)
make db-generate      # Generate migration files
make db-migrate       # Run pending migrations
make db-push          # Push schema to database (dev only)
make db-pull          # Pull schema from database
make db-studio        # Open Drizzle Studio
make db-drop          # Drop all tables (dangerous!)
make db-seed          # Run database seeder

# Database Commands (ClickHouse)
make migrate-clickhouse        # Run ClickHouse migrations
make migrate-clickhouse-status # Check status of ClickHouse migrations

# Combined Workflows
make fresh            # Drop database, push schema, and seed
make reset            # Generate migrations, migrate, and seed
```

### Using Docker

```bash
# Build and run with Docker Compose (includes PostgreSQL, Redis, ClickHouse)
docker-compose up --build

# Run in detached mode
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop all services
docker-compose down
```

## Project Structure

```
clean-elysia/
├── apps/                        # Application modules
│   ├── apis/                    # API application
│   │   ├── modules/             # Feature modules
│   │   │   ├── auth/            # Authentication module
│   │   │   ├── home/            # Home/dashboard module
│   │   │   ├── profile/         # User profile module
│   │   │   └── settings/        # Settings module
│   │   ├── types/               # API-specific type definitions
│   │   ├── base.ts              # Base application setup
│   │   └── serve.ts             # Server entry point
│   └── worker/                  # Background job workers
│       ├── queue/               # Queue definitions
│       └── worker/              # Worker implementations
│
├── packages/                    # Shared packages and utilities
│   ├── cache/                   # Caching utilities
│   ├── default/                 # Default configurations
│   ├── errors/                  # Custom error classes
│   │   ├── bad-request-error.ts
│   │   ├── forbidden-error.ts
│   │   ├── not-found-error.ts
│   │   ├── unauthorized-error.ts
│   │   └── unprocessable-entity-error.ts
│   ├── guards/                  # Authentication guards
│   ├── logger/                  # Logging utilities
│   ├── mail/                    # Email service
│   │   └── templates/           # Email templates
│   ├── plugins/                 # Elysia plugins
│   │   ├── auth.plugin.ts       # JWT authentication plugin
│   │   ├── docs.plugin.ts       # OpenAPI documentation plugin
│   │   ├── error-handler.plugin.ts
│   │   ├── logger.plugin.ts
│   │   ├── request-id.plugin.ts
│   │   └── security.plugin.ts
│   ├── security/                # Security utilities
│   └── toolkit/                 # Common tools and helpers
│       ├── datatable.ts         # Datatable utilities
│       ├── date.ts              # Date utilities (DayJS)
│       ├── number.ts            # Number utilities
│       ├── response.ts          # Response utilities
│       └── string.ts            # String utilities
│
├── config/                      # Centralized configuration
│   ├── app.config.ts            # Application config
│   ├── clickhouse.config.ts     # ClickHouse config
│   ├── cors.config.ts           # CORS config
│   ├── database.config.ts       # PostgreSQL config
│   ├── jwt.config.ts            # JWT config
│   ├── mail.config.ts           # Mail config
│   └── redis.config.ts          # Redis config
│
├── infra/                       # Infrastructure and database
│   ├── clickhouse/              # ClickHouse integration
│   │   ├── client/              # ClickHouse client
│   │   ├── migrations/          # ClickHouse migrations
│   │   ├── repositories/        # ClickHouse repositories
│   │   ├── scripts/             # Migration scripts
│   │   └── services/            # ClickHouse services
│   ├── postgres/                # PostgreSQL integration
│   │   ├── migrations/          # Drizzle migrations
│   │   ├── repositories/        # Data access layer
│   │   └── schema/              # Drizzle schema definitions
│   ├── redis/                   # Redis integration
│   └── seed/                    # Database seeding scripts
│
├── storage/                     # File storage
│   └── logs/                    # Application logs
│
├── docs/                        # Documentation
│   └── images/                  # Documentation images
│
├── .github/                     # GitHub workflows and templates
│   ├── ISSUE_TEMPLATE/          # Issue templates
│   └── workflows/               # CI/CD workflows
│
├── .husky/                      # Git hooks
├── Dockerfile                   # Container configuration
├── docker-compose.yml           # Multi-service setup
├── drizzle.config.ts            # Drizzle ORM configuration
├── eslint.config.mjs            # ESLint configuration
├── Makefile                     # Build and deployment commands
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Project dependencies and scripts
```

## Database Setup

### PostgreSQL with Drizzle ORM

1. **Configure your database** in `.env`:

   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/elysia_db"
   ```

2. **Generate database migrations**:

   ```bash
   make db-generate
   # or
   bunx drizzle-kit generate
   ```

3. **Run migrations**:

   ```bash
   make db-migrate
   # or
   bunx drizzle-kit migrate
   ```

4. **Seed database**:

   ```bash
   make db-seed
   # or
   bun run db:postgres:seed
   ```

5. **Open Drizzle Studio** (database GUI):
   ```bash
   make db-studio
   # or
   bunx drizzle-kit studio
   ```

### ClickHouse

1. **Configure ClickHouse** in `.env`:

   ```env
   CLICKHOUSE_HOST="http://localhost:8123"
   CLICKHOUSE_USER="app"
   CLICKHOUSE_PASSWORD="secret"
   CLICKHOUSE_DATABASE="app"
   ```

2. **Run ClickHouse migrations**:

   ```bash
   make migrate-clickhouse
   # or
   bun run migrate:clickhouse
   ```

3. **Check migration status**:
   ```bash
   make migrate-clickhouse-status
   # or
   bun run migrate:clickhouse:status
   ```

## Docker Services

The `docker-compose.yml` includes the following services:

| Service      | Image                              | Port(s)      | Description             |
| ------------ | ---------------------------------- | ------------ | ----------------------- |
| `postgres`   | postgres:18.1                      | 5432         | PostgreSQL database     |
| `redis`      | redis:7-alpine                     | 6379         | Redis cache/queue       |
| `clickhouse` | clickhouse/clickhouse-server:23.12 | 8123, 9000   | ClickHouse analytics DB |
| `app`        | Custom (Dockerfile)                | 3000         | ElysiaJS application    |

### Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Remove volumes (reset data)
docker-compose down -v

# Rebuild application
docker-compose up --build app
```

## Development

### Code Quality

- **ESLint**: Configured for TypeScript with strict rules
- **Prettier**: Automatic code formatting
- **Husky**: Pre-commit hooks for code quality
- **Lint-Staged**: Runs ESLint and Prettier on staged files

### Available Scripts

```bash
# Server Commands
bun run dev:server      # Start development server with hot reload
bun run start:server    # Start production server
bun run build:server    # Build server for production

# Worker Commands
bun run dev:worker      # Start development worker with hot reload
bun run start:worker    # Start production worker
bun run build:worker    # Build worker for production

# API Commands (alias for server)
bun run dev:api         # Start development API with hot reload
bun run start:api       # Start production API
bun run build:api       # Build API for production

# Run All Services
bun run dev:all         # Start both server and worker in development mode
bun run start:all       # Start both server and worker in production mode
bun run build:all       # Build both server and worker

# Code Quality
bun run lint            # Run ESLint
bun run format          # Format code with Prettier

# Database (PostgreSQL)
bun run db:postgres:seed  # Seed PostgreSQL database

# Database (ClickHouse)
bun run migrate:clickhouse         # Run ClickHouse migrations
bun run migrate:clickhouse:status  # Check ClickHouse migration status
```

## Docker Deployment

### Single Container

```bash
# Build image
docker build -t clean-elysia .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="postgres://user:pass@host:5432/db" \
  -e REDIS_HOST="redis-host" \
  clean-elysia
```

### Multi-Service Setup

```bash
# Start all services
docker-compose up -d

# Scale specific services
docker-compose up --scale app=3
```

## Architecture Diagram

![Architecture Diagram](./docs/images/simple-diagram.png)

*Clean Architecture: Separation between API layer, Application services, and Infrastructure components*

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style Guidelines

- Follow the existing code style
- Run `bun run lint` and `bun run format` before committing
- Write meaningful commit messages
- Use conventional commit format

## Acknowledgments

- [ElysiaJS](https://elysiajs.com/) - The web framework
- [Bun](https://bun.sh/) - JavaScript runtime and package manager
- [Drizzle ORM](https://orm.drizzle.team/) - Type-safe database toolkit
- [ClickHouse](https://clickhouse.com/) - Analytics database
- [BullMQ](https://docs.bullmq.io/) - Queue system

## Support

If you have any questions or issues, please:

- Open an [issue](https://github.com/aolus-software/clean-elysia/issues)
- Start a [discussion](https://github.com/aolus-software/clean-elysia/discussions)

---

Made with love by [Fexend](https://github.com/fexend)
