# Site-wide custom background

Visitors see the background the site owner publishes. Personal (this-device) uploads remain available as an optional local override.

## Storage

- **Image:** [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) at `site-wallpaper/wallpaper.*` when `the Vercel Blob RW token env` is set. Local / preview fallback writes under `public/site-wallpaper/` (gitignored).
- **Metadata** (enabled, imageUrl, mode, overlay, position, tone, updatedAt): Upstash Redis key `['xinbao', 'site-wallpaper', 'v1'].join(':')`.

## Auth

Writes reuse the existing owner password envelope `SITE_ACTIVITY_OWNER_PASSWORD_HASH` (same scrypt format as site-activity preference). Guests can `GET /api/site-activity/wallpaper`; only the owner password can `POST` / `DELETE`.

## Environment

| Variable | Required for | Notes |
| --- | --- | --- |
| `UPSTASH_REDIS_REST_URL` | shared read/write | Already used by chat / site-activity |
| `UPSTASH_REDIS_REST_TOKEN` | shared read/write | Server-only |
| `SITE_ACTIVITY_OWNER_PASSWORD_HASH` | owner writes | `scrypt:v1:<salt>:<digest>` |
| `RATE_LIMIT_SALT` | owner rate-limit on Vercel | Reused from site-activity |
| `the Vercel Blob RW token env` | production image storage | Optional locally (falls back to `public/site-wallpaper/`) |

## API

- `GET /api/site-activity/wallpaper` — public JSON of the current shared background (`writable` / `shared` flags included).
- `POST /api/site-activity/wallpaper` — multipart upload (`password`, `image`, optional mode/overlay/position/tone) or JSON settings update / `{ clear: true }`.
- `DELETE /api/site-activity/wallpaper` — JSON `{ password }` clears image + metadata.

## UI

Custom panel scope:

- **Everyone** (default when writable): requires owner password; publishes for all visitors.
- **This device**: keeps the previous IndexedDB / localStorage behavior as a personal override.

Root layout loads the shared record for first paint (HTML data attributes + CSS variables) to reduce wallpaper flash.

## Template branch

The public `template` branch must not ship personal wallpapers. The sanitizer disables shared publish (local-only custom background) and the leak check ignores / strips `public/site-wallpaper/**` and Vercel Blob wallpaper URLs.

## Local preview password

`next start` / `next dev` read `.env.local` (gitignored). To exercise real password checks locally, copy production `SITE_ACTIVITY_OWNER_PASSWORD_HASH` (and Redis if you want Redis-backed metadata) into `.env.local`, then restart the preview. Without the hash, local shared writes still require typing any password of at least 8 characters in the panel, and store the image under `public/site-wallpaper/`.
