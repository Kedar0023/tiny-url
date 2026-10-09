# Tiny URL

## Run the full stack

Docker Compose starts an Nginx gateway, the shortener, redirect service, analytics worker, PostgreSQL, a redirect cache Redis, and an analytics Redis. Nginx serves the web client, routes `/api/` to the shortener, and routes short codes to the redirect service. The database migration runs before the services start.

```bash
docker compose up --build
```

Open the app at `http://localhost:8080`. PostgreSQL is exposed on `5431` (container port `5432`), cache Redis on `6379`, and analytics Redis on `6380`. Set `HTTP_PORT`, `BASE_URL`, `POSTGRES_PASSWORD`, `POSTGRES_PORT`, `REDIS_CACHE_PORT`, and `REDIS_ANALYTICS_PORT` in the environment to override the local defaults.

Create a short URL:

```bash
curl -X POST http://localhost:8080/api/v1/shorten \
	-H 'content-type: application/json' \
	-d '{"long_url":"https://example.com"}'
```

Open the returned short URL to redirect and increment the click counter. Analytics flushes click counts to PostgreSQL every minute.

## Development

Install dependencies and run the three backend apps:

```bash
bun install
bun run dev
```

Generate schema migrations after changing `packages/database/src/schema.ts`, then apply them to the configured database:

```bash
bun run db:generate
bun run db:migrate
```

Set `DATABASE_URL`, `REDIS_CACHE_URL`, and `REDIS_ANALYTICS_URL` when running services outside Docker. Defaults target local Postgres and Redis instances.
