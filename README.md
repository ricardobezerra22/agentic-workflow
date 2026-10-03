# Agentic Sandbox

A small app wired for an end-to-end agentic flow:

```
ClickUp task -> /clickup-ship -> OpenSpec (propose) -> TDD (apply) -> PR -> CI -> preview -> merge -> production
```

## One-time setup

1. Push this repo to GitHub and make sure `gh auth status` is green.
2. In Vercel, create a project for the repo and note the org and project IDs.
3. Add repository secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
4. Create a GitHub environment named `production` (add required reviewers if you want a manual gate).
5. Protect `main`: require the `verify` check from the CI workflow and a PR before merging.
6. Connect the ClickUp MCP server in Claude Code.

## Use it

```
claude
> /clickup-ship 86abc123
```

Add `--review-spec` to stop after the OpenSpec proposal so you can approve the spec first.

## Swapping the deploy target

`deploy.yml` uses Vercel. For Netlify or Cloudflare Pages, replace the three Vercel
steps in each job with the vendor's CLI (`netlify deploy`, `wrangler pages deploy dist`).
