import { Hono } from "hono";
import Redis from "ioredis";
import { db, urls } from "@tiny-url/database";
import { desc, eq, sql } from "drizzle-orm";

const redis = new Redis(process.env.REDIS_ANALYTICS_URL ?? "redis://localhost:6380");
const FLUSH_MS = 60_000;
const app = new Hono();
let running = false;

async function flush() {
  if (running) return;
  running = true;
  try {
    // rotate the hash so new clicks go to a fresh "clicks" key while we flush
    // (if a previous flush crashed, "clicks:flush" still exists, so finish it first)
    if (!(await redis.exists("clicks:flush"))) {
      try {
        await redis.rename("clicks", "clicks:flush");
      } catch {
        return; // no clicks this interval
      }
    }

    const data = await redis.hgetall("clicks:flush");
    const codes = Object.keys(data);
    if (codes.length) {
      await db.transaction(async (tx) => {
        for (const code of codes) {
          await tx
            .update(urls)
            .set({ usedCount: sql`${urls.usedCount} + ${Number(data[code])}` })
            .where(eq(urls.shortUrl, code));
        }
      });
    }
    await redis.del("clicks:flush");
  } finally {
    running = false;
  }
}

app.get("/analytics", async (c) => {
  const rows = await db
    .select({ shortUrl: urls.shortUrl, longUrl: urls.longUrl, usedCount: urls.usedCount })
    .from(urls)
    .orderBy(desc(urls.usedCount), desc(urls.createdAt));

  const rowsHtml = rows.length
    ? rows
        .map(
          (row) => `
            <tr>
              <td>${row.shortUrl}</td>
              <td><a href="${row.longUrl}" target="_blank" rel="noreferrer">${row.longUrl}</a></td>
              <td>${row.usedCount}</td>
            </tr>`,
        )
        .join("")
    : `<tr><td colspan="3">No URLs yet</td></tr>`;

  return c.html(`<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>URL Analytics</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 32px; }
          table { border-collapse: collapse; width: 100%; max-width: 1100px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background: #f4f4f4; }
          a { color: #0b57d0; }
        </style>
      </head>
      <body>
        <h1>URL Analytics</h1>
        <table>
          <thead>
            <tr>
              <th>Short URL</th>
              <th>Original URL</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
    </html>`);
});

app.get("/api/v1/analytics", async (c) => {
  const rows = await db
    .select({ shortUrl: urls.shortUrl, longUrl: urls.longUrl, usedCount: urls.usedCount })
    .from(urls)
    .orderBy(desc(urls.usedCount), desc(urls.createdAt));

  return c.json(rows);
});

setInterval(() => flush().catch(console.error), FLUSH_MS);
console.log("analytics worker running");

export default {
  port: 3002,
  fetch: app.fetch,
};