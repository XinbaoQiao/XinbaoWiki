# Site activity map

The homepage `Site activity / 访问足迹` panel is a coarse public summary of
all activity collected since 2026-08-09. It is not a live-presence monitor and
it does not identify people.

## Metric and display contract

- The headline is an approximate count of distinct signed first-party browser
  identifiers observed since collection began on 2026-08-09, including the
  current day. Clearing or expiring the cookie, blocking JavaScript, changing
  browsers, or automation can change the estimate.
- The total remains hidden below two estimated browser identifiers. Once the
  threshold is reached, the public API returns the HyperLogLog estimate as an
  integer; it is not a count of people.
- Geography is quantized to a 5-degree cell before storage. A cell is omitted
  below two estimated browser identifiers and is exposed only as low (2-4),
  medium (5-9), or high (10+) intensity. The public response contains no
  country, state, city, raw or exact latitude/longitude, cell identifier, or
  per-cell count; it carries only a coarse, already-projected SVG canvas
  position needed to draw the cluster.
- VPNs, proxies, mobile networks, and ISP egress points can move an IP-derived
  location. The map describes approximate activity density, not physical
  addresses or travel paths.

## Data flow and retention

1. The homepage sends a same-origin, bodyless `POST /api/site-activity/v2/`.
   The schema version is part of the route so a future incompatible payload can
   use a new endpoint without breaking an already-open page. The unversioned
   version 2 route remains available for pages opened before this change.
2. The server creates or verifies a signed random `HttpOnly`, `SameSite=Lax`
   first-party cookie with a 400-day maximum age. Only its keyed digest enters
   Redis HyperLogLog buckets. Browser deletion or expiry can cause a returning
   browser to receive another identifier and be counted again. Existing
   version 1 cookies are reissued in the version 2 envelope with the same
   identifier, so the longer maximum age does not itself duplicate them.
   On Vercel, fresh-cookie issuance is limited per trusted forwarding IP. The
   rate-limit key is an HMAC digest with a one-hour TTL; the raw IP is neither
   written to Redis nor used as map data.
3. On Vercel, the server reads platform-provided IP-derived latitude and
   longitude headers, validates them, immediately quantizes them, and discards
   the original values. Local and non-Vercel requests still contribute to the
   total but have no map cell.
4. Version 2 stores one lifetime total HLL, lifetime cell HLLs, and one active
   cell index without automatic expiry. They are retained until the maintainer
   deliberately resets the statistic by rotating its versioned key prefix.
5. On first use, the route merges the launch-period version 1 daily HLLs into
   version 2 with `PFMERGE`; no raw visitor identifiers are recovered. A Redis
   `SET NX` lock prevents concurrent full migrations, cell merges run in
   128-cell batches, and two catch-up passes at 15-minute intervals capture
   writes from an old deployment over a 30-minute rollout window. The old daily
   keys retain their original 33-day expiry and are not used after the migration
   receipt is complete. Migration is best-effort on the public read path: a busy
   lock or failed migration attempt does not prevent the route from returning
   the lifetime aggregate already available in version 2.
6. The public `GET` response contains only the estimate, projected map
   positions, three-level intensity buckets, thresholds, and the collection
   start date.

## Private maintainer exclusion

The intensity heading below the atlas is an understated control rather than a
public settings link. Activating it opens a native password dialog. The
password is sent only in a same-origin JSON request and is verified against the
server-only `SITE_ACTIVITY_OWNER_PASSWORD_HASH` scrypt envelope; plaintext is
not included in the client bundle, URL, cookie, Redis, or application logs.
Wrong attempts are limited to five per 15-minute window using a keyed digest of
Vercel's trusted forwarding IP. The raw IP is not persisted, and a Redis or
configuration failure fails closed without creating an exclusion.

Successful verification sets a signed `HttpOnly`, `SameSite=Strict`
first-party exclusion cookie. The recording route validates that marker before
it creates a visitor identifier, reads geographic headers, runs migration, or
writes Redis, and returns an ordinary private `204` without recording the
request. The same password dialog can clear only the exclusion marker; it
preserves an existing signed visitor identifier so rejoining does not create a
second lifetime identity.

The exclusion follows that browser when its public IP, country, or region
changes. It deliberately does not block an entire IP address, because shared
NAT, campus, office, mobile, and VPN addresses may also carry unrelated
visitors. It does not follow a person across devices, different browsers,
private windows, or cleared cookies because the site has no owner-login
identity. Each maintainer browser must be verified separately, and the marker
must be renewed after at most 400 days.

Redis HyperLogLog cannot remove one historical digest. Therefore the preference
is forward-only: visits made before it is enabled remain in the lifetime total
and any earlier map cells. Exact removal of prior maintainer activity requires
rotating the aggregate key prefix and restarting the public collection period,
which also discards other visitors' history.

Migration must be deployed before the version 1 daily keys from 2026-08-09
expire; an HLL cannot reconstruct an already expired source. If that deadline
is missed, the advertised collection start must move to the first recoverable
date. Migration retains all 1,988 valid five-degree cells in 128-cell batches.
Public reads are bounded to a deterministic non-geographic subset of 512 cells
if the lifetime index ever exceeds that display ceiling.

Xinbaopedia-owned Redis and application logs do not store the raw IP address or
the original latitude/longitude for this feature. The lifetime HLLs cannot
enumerate or delete individual browser digests; resetting the public history
requires rotating the versioned key prefix and deleting the retired aggregate
keys. The maintainer owns that reset decision, including any response to
long-term automated inflation or a `RATE_LIMIT_SALT` rotation. Redis may hold
the short-lived HMAC IP digest used only to limit fresh-cookie issuance and
owner-password attempts; it is pseudonymous abuse-control data, not an
anonymous activity-map value. The
hosting/network platform still processes the request IP to route requests and
derive its geolocation headers under the platform's own terms and privacy
policy.

## Configuration and failure behavior

The route reuses `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, and
`RATE_LIMIT_SALT`. The same salt signs the non-identifying browser exclusion
marker and HMACs its attempt-limit key; rotating it invalidates existing
visitor and exclusion cookies. `SITE_ACTIVITY_OWNER_PASSWORD_HASH` contains an
independent `scrypt:v1:<salt>:<digest>` envelope and must be configured only in
the server environment. It must not reuse the chat administration token, the
Redis token, or the rate-limit salt. No client-side analytics package or
browser geolocation permission is required.

When Redis or the salt is absent, recording returns an empty `204` and the
public endpoint returns `enabled: false`. Recording errors still soft-fail so
activity statistics never block the homepage; public read errors return a
generic uncached `503`, allowing the interface to distinguish a temporary
failure from missing configuration. The client retries transient network and
server failures, then exposes a bilingual retry control rather than leaving the
panel in a terminal error state. Successful public aggregates are
shared-cached for five minutes; recording responses are private and never
cached. The public endpoint rejects query strings so callers cannot create
arbitrary cache-key variants that repeatedly force the Redis read path.

## Map asset

`public/maps/world-land-dots.svg` is an abstract dotted land silhouette without
internal political borders. It is generated from the pinned `world-atlas`
2.0.2 / Natural Earth geometry by
`npm run generate:site-activity-map`. It is a local static asset; the homepage
adds no Leaflet, MapLibre, OpenLayers, ECharts, or browser-map runtime.

This geometry is not described as a Chinese official standard map or as an
authority-reviewed map. Replacing the silhouette does not change the anonymous
aggregate API contract.
