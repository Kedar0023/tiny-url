FROM oven/bun:1.3.4

WORKDIR /app
COPY . .
RUN bun install --frozen-lockfile

EXPOSE 3001
CMD ["bun", "run", "apps/redirect/index.ts"]