# Clean ElysiaJS Starter Template

A clean, production-ready starter template for building modern web applications with [ElysiaJS](https://elysiajs.com/). This template provides a well-structured monorepo setup with TypeScript, database integration, Docker support, and development best practices.

## 🚀 Features

### Core Framework & Runtime

- **⚡ ElysiaJS Framework**: Fast and modern web framework for Bun
- **🔷 TypeScript**: Full TypeScript support with strict configuration
- **📦 Bun Runtime**: Lightning-fast JavaScript runtime and package manager

### Architecture & Structure

- **🏗️ Monorepo Structure**: Organized with `apps`, `packages`, and `infra` directories
- **🔄 Worker Support**: Background job processing with BullMQ
- **🎯 Clean Architecture**: Separation of concerns with modular design

### Database & ORM

- **🗄️ PostgreSQL**: Production-ready relational database
- **🔷 Drizzle ORM**: Type-safe database operations and migrations
- **🌱 Database Seeding**: Pre-configured seeding with drizzle-seed

### Cache & Queue

- **⚡ Redis Integration**: High-performance caching and session management (IORedis)
- **📬 BullMQ**: Robust queue system for background jobs and task processing

### Authentication & Security

- **🔐 JWT Authentication**: Secure token-based authentication with @elysiajs/jwt
- **🔒 Password Hashing**: Bcrypt integration for secure password storage
- **🔑 Encryption**: Crypto-JS for data encryption and decryption

### API & Middleware

- **🌐 CORS Support**: Configurable cross-origin resource sharing
- **📝 Request Validation**: Type-safe validation with VineJS
- **📊 Logging**: Structured logging with Pino and pino-pretty

### Email & Notifications

- **📧 Email Support**: Nodemailer integration for sending emails
- **✉️ Template Ready**: Pre-configured email service layer

### Development Tools

- **🐳 Docker Support**: Complete containerization with Docker and Docker Compose
- **🔧 Hot Reload**: Fast development with Bun's watch mode
- **🎨 Code Quality**: ESLint, Prettier, and Husky for consistent code formatting
- **⏰ Date Handling**: DayJS for modern date/time operations
- **🔄 Concurrency**: Run multiple services simultaneously with concurrently

### Environment & Configuration

- **🌍 Environment Variables**: Dotenv for configuration management
- **⚙️ Multi-Environment**: Support for development, staging, and production
- **🕐 Timezone Support**: Configurable timezone settings

## 📋 Prerequisites

- [Bun](https://bun.sh/) (latest version)
- [PostgreSQL](https://www.postgresql.org/) (v14 or higher)
- [Redis](https://redis.io/) (v6 or higher)
- [Docker](https://www.docker.com/) (optional, for containerization)
- [Make](https://www.gnu.org/software/make/) (optional, for using Makefile commands)

## 🛠️ Installation

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
   bun dev
   ```

## 🏃 Quick Start

### Using Bun (Recommended)

```bash
# Install dependencies
bun install

# Start development server
bun dev

# Build for production
bun run build

# Start production server
bun start
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

# Database Commands
make db-generate      # Generate migration files
make db-migrate       # Run pending migrations
make db-push          # Push schema to database (dev only)
make db-pull          # Pull schema from database
make db-studio        # Open Drizzle Studio
make db-drop          # Drop all tables (dangerous!)
make db-seed          # Run database seeder

# Combined Workflows
make fresh            # Drop database, push schema, and seed
make reset            # Generate migrations, migrate, and seed
```

### Using Docker

```bash
# Build and run with Docker Compose
docker-compose up --build

# Run in detached mode
docker-compose up -d
```

## 📁 Project Structure

```
clean-elysia/
├── apps/                    # Application modules
│   ├── apis/               # API application
│   │   ├── errors/         # Custom error definitions
│   │   ├── handlers/       # Request handlers
│   │   ├── middleware/     # API middleware
│   │   ├── repositories/   # Data access layer
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── types/          # TypeScript type definitions
│   └── worker/             # Background job workers
├── packages/               # Shared packages and utilities
│   ├── cache/             # Caching utilities
│   ├── config/            # Configuration management
│   ├── db/                # Database connectors
│   │   ├── clickhouse/    # ClickHouse integration
│   │   └── postgres/      # PostgreSQL integration
│   ├── default/           # Default configurations
│   ├── event/             # Event handling
│   │   ├── queue/         # Queue management
│   │   └── worker/        # Worker utilities
│   ├── logger/            # Logging utilities
│   ├── mail/              # Email service
│   │   └── templates/     # Email templates
│   ├── redis/             # Redis integration
│   ├── security/          # Security utilities
│   └── toolkit/           # Common tools and helpers
├── infra/                 # Infrastructure and deployment
│   ├── migrations/        # Database migrations
│   │   └── meta/          # Migration metadata
│   └── seed/              # Database seeding scripts
├── storage/               # File storage
│   └── logs/              # Application logs
├── docs/                  # Documentation
│   └── images/            # Documentation images
├── .github/               # GitHub workflows and templates
├── .husky/                # Git hooks
├── Dockerfile             # Container configuration
├── docker-compose.yml     # Multi-service setup
├── drizzle.config.ts      # Database configuration
├── Makefile               # Build and deployment commands
└── package.json           # Project dependencies and scripts
```

## 🗄️ Database Setup

This template uses Drizzle ORM for database operations:

1. **Configure your database** in `.env`:

   ```env
   DATABASE_URL="your-database-connection-string"
   ```

2. **Generate database migrations**:

   ```bash
   bun run db:generate
   ```

3. **Run migrations**:
   ```bash
   bun run db:migrate
   ```

## 🧪 Development

### Code Quality

- **ESLint**: Configured for TypeScript and modern JavaScript
- **Prettier**: Automatic code formatting
- **Husky**: Pre-commit hooks for code quality

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

# Database
bun run seed            # Seed database with initial data
```

## 🐳 Docker Deployment

### Single Container

```bash
# Build image
docker build -t clean-elysia .

# Run container
docker run -p 3000:3000 clean-elysia
```

### Multi-Service Setup

```bash
# Start all services
docker-compose up

# Scale specific services
docker-compose up --scale app=3
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style Guidelines

- Follow the existing code style
- Run `bun lint` and `bun format` before committing
- Write meaningful commit messages
- ~Add tests for new features~

## 📐 Architecture Diagram

![Architecture Diagram](./docs/images/simple-diagram.png)

_Clean Architecture: Separation between API layer, Application services, and Infrastructure components_

## 🙏 Acknowledgments

- [ElysiaJS](https://elysiajs.com/) - The web framework
- [Bun](https://bun.sh/) - JavaScript runtime and package manager
- [Drizzle ORM](https://orm.drizzle.team/) - Type-safe database toolkit

## 📞 Support

If you have any questions or issues, please:

- Open an [issue](https://github.com/aolus-software/clean-elysia/issues)
- Start a [discussion](https://github.com/aolus-software/clean-elysia/discussions)

---

Made with ❤️ by [Aolus Software](https://github.com/aolus-software)
