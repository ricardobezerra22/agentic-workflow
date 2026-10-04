import { describe, it, expect, afterAll } from "vitest";

const BASE_URL = process.env.BLOG_POST_API_URL ?? "https://blog-docs-nine.vercel.app/api/posts";
const API_KEY = process.env.BLOG_POST_API_KEY ?? "change-me";

const post = (body, key = API_KEY) =>
  fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key },
    body: JSON.stringify(body),
  });

const validPayload = () => ({
  title: "Integration test post",
  slug: `integration-test-${Date.now()}`,
  content: "- CI: Test entry",
  published: true,
});

describe("blog-post API contract", () => {
  const created = [];

  afterAll(async () => {
    await Promise.all(
      created.map((id) =>
        fetch(`${BASE_URL}/${id}`, {
          method: "DELETE",
          headers: { "x-api-key": API_KEY },
        })
      )
    );
  });

  it("rejects missing auth with 401", async () => {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validPayload()),
    });
    expect(res.status).toBe(401);
  });

  it("rejects wrong auth with 401", async () => {
    const res = await post(validPayload(), "wrong-key");
    expect(res.status).toBe(401);
  });

  it("rejects body missing required fields with 400", async () => {
    const res = await post({ sha: "abc" });
    expect(res.status).toBe(400);
  });

  it("accepts valid payload and returns 201 with published post", async () => {
    const res = await post(validPayload());
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.published).toBe(true);
    expect(body.id).toBeTruthy();
    created.push(body.id);
  });
});
