FROM oven/bun:1.3.4

WORKDIR /app
COPY . .
RUN bun install --frozen-lockfile

CMD ["bun", "run", "apps/analytics/index.ts"]