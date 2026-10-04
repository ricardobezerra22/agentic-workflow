# Blog Post Integration

Called once after every successful production deploy (merge to main).
Triggered by the `Notify blog post API` step in `.github/workflows/deploy.yml`.

## Endpoint

```
POST <set BLOG_POST_API_URL in GitHub Actions variables>
```

## Headers

```
Authorization: Bearer <BLOG_POST_API_KEY>
Content-Type: application/json
```

## Body

```json
{
  "sha":         "<full commit SHA>",
  "ref":         "refs/heads/main",
  "actor":       "<GitHub actor who triggered the run>",
  "repo":        "<owner/repo>",
  "run_url":     "https://github.com/<owner>/<repo>/actions/runs/<run_id>",
  "deployed_at": "<ISO 8601 timestamp of the head commit>"
}
```

## GitHub repo setup (one-time)

In **Settings → Secrets and variables → Actions**:

| Type     | Name                | Value                        |
|----------|---------------------|------------------------------|
| Secret   | `BLOG_POST_API_KEY` | `change-me` (replace when ready) |
| Variable | `BLOG_POST_API_URL` | `<your endpoint URL>`        |
