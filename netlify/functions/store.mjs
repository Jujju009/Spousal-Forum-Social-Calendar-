import { getStore } from "@netlify/blobs";

const PATH_OK = /^(config\/poll|responses\/[A-Za-z]+|ideas\/[A-Za-z]+)$/;
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

export default async (req) => {
  const store = getStore({ name: "spousal-poll", consistency: "strong" });
  const url = new URL(req.url);
  const path = url.searchParams.get("path");

  if (req.method === "GET") {
    const { blobs } = await store.list();
    const out = {};
    await Promise.all(blobs.map(async (b) => { out[b.key] = await store.get(b.key, { type: "json" }); }));
    return json(out);
  }
  if (!path || !PATH_OK.test(path)) return json({ error: "bad path" }, 400);
  if (req.method === "PUT") {
    const body = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "bad body" }, 400);
    if (JSON.stringify(body).length > 50000) return json({ error: "too large" }, 413);
    await store.setJSON(path, body);
    return json({ ok: true });
  }
  if (req.method === "DELETE") {
    await store.delete(path);
    return json({ ok: true });
  }
  return json({ error: "method not allowed" }, 405);
};

export const config = { path: "/api/store" };
