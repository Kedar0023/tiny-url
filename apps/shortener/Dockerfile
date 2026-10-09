FROM oven/bun:1.3.4

WORKDIR /app
COPY . .
RUN bun install --frozen-lockfile

EXPOSE 3000
CMD ["bun", "run", "apps/shortener/index.ts"]