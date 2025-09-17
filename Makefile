.PHONY: help dev build start lint format seed db-generate db-migrate db-push db-pull db-studio db-drop

# Default target
help:
	@echo "Available commands:"
	@echo "  Development:"
	@echo "    dev         - Start development server with hot reload"
	@echo "    build       - Build the API application"
	@echo "    start       - Start the production server"
	@echo "    lint        - Run ESLint"
	@echo "    format      - Format code with Prettier"
	@echo "    seed        - Run database seeder"
	@echo ""
	@echo "  Database (Drizzle):"
	@echo "    db-generate - Generate migration files"
	@echo "    db-migrate  - Run pending migrations"
	@echo "    db-push     - Push schema to database (dev only)"
	@echo "    db-pull     - Pull schema from database"
	@echo "    db-studio   - Open Drizzle Studio"
	@echo "    db-drop     - Drop all tables (dangerous!)"

# Development commands
dev-api:
	bun run dev:api

build-api:
	bun run build:api

start-api:
	bun run start:api

lint:
	bun run lint

format:
	bun run format

db-seed:
	bun run seed

# Database commands
db-generate:
	bunx drizzle-kit generate

db-migrate:
	bunx drizzle-kit migrate

db-push:
	bunx drizzle-kit push

db-pull:
	bunx drizzle-kit introspect

db-studio:
	bunx drizzle-kit studio

db-drop:
	bunx drizzle-kit drop

# Combined commands for common workflows
fresh: db-drop db-push seed
	@echo "Database refreshed and seeded!"

reset: db-generate db-migrate seed
	@echo "Database migrated and seeded!"
