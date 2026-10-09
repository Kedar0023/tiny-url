import { Hono } from "hono";
import { customAlphabet } from "nanoid";
import { db, urls } from "@tiny-url/database";
import { eq } from "drizzle-orm";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

const BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const genCode = customAlphabet(BASE62, 6);

const isHttpUrl = (v: unknown): v is string => {
	try {
		return typeof v === "string" && /^https?:$/.test(new URL(v).protocol);
	} catch {
		return false;
	}
};

const app = new Hono();

app.post("/api/v1/shorten", async (c) => {

	const { long_url } = (await c.req.json().catch(() => ({}))) as {
		long_url?: unknown;
	};

	if (!isHttpUrl(long_url)) return c.json({ error: "invalid url" }, 400);

	for (let i = 0; i < 5; i++) {
		const code = genCode();
		const inserted = await db
			.insert(urls)
			.values({ longUrl: long_url, shortUrl: code })
			.onConflictDoNothing({ target: urls.shortUrl })
			.returning({ shortUrl: urls.shortUrl });
		if (inserted.length === 1)
			return c.json({ short_url: `${BASE_URL}/${code}` }, 201);
	}
	return c.json({ error: "could not generate unique code" }, 503);
});

export default {
	port: 3000,
	fetch: app.fetch,
};
