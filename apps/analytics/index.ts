import Redis from "ioredis";
import { db, urls } from "@tiny-url/database";
import { eq, sql } from "drizzle-orm";

const redis = new Redis(process.env.REDIS_ANALYTICS_URL ?? "redis://localhost:6380");
const FLUSH_MS = 60_000;
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

setInterval(() => flush().catch(console.error), FLUSH_MS);
console.log("analytics worker running");