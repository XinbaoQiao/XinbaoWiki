# Xinbaopedia Cloudflare edge proxy

This folder contains a Cloudflare Workers reverse proxy for Xinbaopedia. It is intended as a lightweight edge entrypoint in front of the existing Vercel deployment:

```text
visitor -> Cloudflare custom domain -> Cloudflare Workers -> https://xinbaopedia.vercel.app
```

The proxy preserves the current Next.js and Vercel setup, including `/api/chat-with-xinbao`, while letting static assets such as `/_next/static/*`, images, CSS, and JavaScript cache at Cloudflare's edge. API routes are explicitly not cached.

## Why this approach

The current application uses dynamic Next.js route handlers for Chat with Xinbao. Rebuilding the whole app for the Cloudflare Workers runtime would require a larger OpenNext migration and runtime testing. A Worker proxy keeps the Vercel origin working and adds a Cloudflare-accessible custom domain first.

This may improve access from mainland China when Vercel-hosted domains are difficult to reach, but it is not a formal mainland-China availability guarantee. For reliable mainland-China delivery, use an ICP-filed domain with a mainland China CDN/hosting provider, or Cloudflare's China Network/Enterprise offering where applicable.

## Required Cloudflare credentials

Store deployment secrets outside the repository:

```bash
mkdir -p /data/qiaoxinbao/.secrets
printf '%s' '<cloudflare-api-token>' > /data/qiaoxinbao/.secrets/cloudflare.token
printf '%s' '<cloudflare-account-id>' > /data/qiaoxinbao/.secrets/cloudflare.account_id
```

The API token should have permission to edit Workers scripts on the target account. If you also want to bind a route or custom domain from the CLI, grant the needed Zone/Workers route permissions for that domain.

## Deploy the Worker

```bash
export CLOUDFLARE_API_TOKEN="$(cat /data/qiaoxinbao/.secrets/cloudflare.token)"
export CLOUDFLARE_ACCOUNT_ID="$(cat /data/qiaoxinbao/.secrets/cloudflare.account_id)"
npm run cf:deploy
```

For local testing:

```bash
export CLOUDFLARE_API_TOKEN="$(cat /data/qiaoxinbao/.secrets/cloudflare.token)"
export CLOUDFLARE_ACCOUNT_ID="$(cat /data/qiaoxinbao/.secrets/cloudflare.account_id)"
npm run cf:dev
```

## Attach a custom domain

Use a real domain or subdomain, for example `wiki.example.com`.

1. Add the domain to Cloudflare DNS, or create a Cloudflare Pages/Workers custom domain flow from the dashboard.
2. Open Cloudflare Dashboard -> Workers & Pages -> `xinbaopedia-proxy`.
3. Go to Settings -> Domains & Routes.
4. Add a Custom Domain or Route for the desired hostname.
5. Keep the origin in `wrangler.toml` as `https://xinbaopedia.vercel.app`.

Avoid relying on `*.workers.dev` as the main China-facing URL. A custom domain on Cloudflare DNS is easier to manage and verify.

## Verification

After deployment and domain binding:

```bash
curl -I https://<your-cloudflare-domain>/wiki/Xinbao_Qiao/
curl -I https://<your-cloudflare-domain>/_next/static/
curl -sS https://<your-cloudflare-domain>/api/chat-with-xinbao/
```

Expected signs:

- Responses include `X-Xinbaopedia-Edge: cloudflare`.
- `/api/chat-with-xinbao/` returns JSON with `limit: 10`.
- Static assets resolve through the Cloudflare hostname.
- Browser Network tab calls the Cloudflare hostname, not `xinbaopedia.vercel.app` directly.

## Security notes

- Do not commit Cloudflare tokens or account IDs.
- The Worker does not contain Yunwu, Upstash, Vercel, or GitHub tokens.
- The Worker does not cache `/api/*`, so chat quotas, cookies, and admin endpoints stay dynamic.
