# Blog Post Integration

Called once after every successful production deploy (merge to main).
Triggered by the `Notify blog post API` step in `.github/workflows/deploy.yml`.

## Endpoint

```
POST <set BLOG_POST_API_URL in GitHub Actions variables>
```

## Headers

```
x-api-key: <BLOG_POST_API_KEY>
Content-Type: application/json
```

## Body

```json
{
  "title":       "<Repo Name> — What shipped <Month D, YYYY>",
  "slug":        "<repo-name>-<YYYY-MM-DD>",
  "content":     "- Label: Entry\n- Label: Entry",
  "published":   true,
  "sha":         "<full commit SHA>",
  "ref":         "refs/heads/main",
  "actor":       "<GitHub actor who triggered the run>",
  "repo":        "<owner/repo>",
  "run_url":     "https://github.com/<owner>/<repo>/actions/runs/<run_id>",
  "deployed_at": "<ISO 8601 timestamp of the head commit>"
}
```

`content` is built from the `## [Unreleased]` section of `CHANGELOG.md`,
with commit SHAs and dates stripped, prefixed with their change label.

## GitHub repo setup (one-time)

In **Settings → Secrets and variables → Actions**:

| Type     | Name                | Value                        |
|----------|---------------------|------------------------------|
| Secret   | `BLOG_POST_API_KEY` | `change-me` (replace when ready) |
| Variable | `BLOG_POST_API_URL` | `https://blog-docs-nine.vercel.app/api/posts` |
