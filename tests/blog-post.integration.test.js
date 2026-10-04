import { describe, it, expect } from "vitest";

const BASE_URL =
  process.env.BLOG_POST_API_URL ??
  "https://blog-docs-nine.vercel.app/api/posts";
const API_KEY = process.env.BLOG_POST_API_KEY ?? "change-me";

const headers = { "Content-Type": "application/json", "x-api-key": API_KEY };

describe("blog-post E2E: deploy notification flow", () => {
  let postId;
  const slug = `e2e-deploy-test-${Date.now()}`;

  it("creates a published deploy post", async () => {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        title: "Agentic Workflow — What shipped Jan 1, 2026",
        slug,
        content:
          "- CI: Notify blog post API after production deploy\n- Fixed: Harden hooks",
        published: true,
        sha: "abc123",
        ref: "refs/heads/main",
        actor: "nevescomeia",
        repo: "ricardobezerra22/agentic-workflow",
        run_url:
          "https://github.com/ricardobezerra22/agentic-workflow/actions/runs/1",
        deployed_at: "2026-01-01T00:00:00Z",
      }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.slug).toBe(slug);
    expect(body.published).toBe(true);
    expect(body.publishedAt).toBeTruthy();
    postId = body.id;
  });

  it("post appears in the listing", async () => {
    const res = await fetch(BASE_URL, { headers: { "x-api-key": API_KEY } });
    const body = await res.json();
    expect(body.posts.some((p) => p.id === postId)).toBe(true);
  });

  it("cleans up the test post", async () => {
    const res = await fetch(`${BASE_URL}/${postId}`, {
      method: "DELETE",
      headers,
    });
    expect(res.status).toBe(204);
  });
});
