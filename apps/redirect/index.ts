import { Hono } from "hono";
import Redis from "ioredis";
import { db, urls } from "@tiny-url/database";
import { eq } from "drizzle-orm";

const cacheRedis = new Redis(process.env.REDIS_CACHE_URL ?? "redis://localhost:6379");
const analyticsRedis = new Redis(process.env.REDIS_ANALYTICS_URL ?? "redis://localhost:6380");
const TTL = 3600;

const app = new Hono();

app.get("/:code{[0-9A-Za-z]{6}}", async (c) => {
    const startedAt = performance.now();
    const code = c.req.param("code");
    const logLatency = (status: number) => {
        console.info({
            event: "redirect",
            code,
            status,
            latency_ms: Number((performance.now() - startedAt).toFixed(2)),
        });
    };

    // 1. cache
    let long_url = await cacheRedis.get(code);

    // 2. db fallback
    if (!long_url) {
        const result = await db
            .select({ longUrl: urls.longUrl })
            .from(urls)
            .where(eq(urls.shortUrl, code))
            .limit(1);
        if (!result[0]) {
            logLatency(404);
            return c.json({ error: "not found" }, 404);
        }
        long_url = result[0].longUrl;
        await cacheRedis.set(code, long_url, "EX", TTL);
    }

    analyticsRedis.hincrby("clicks", code, 1).catch(console.error);

    logLatency(302);
    return c.redirect(long_url, 302);
});

export default {
    port: 3001,
    fetch: app.fetch,
};
