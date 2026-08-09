# Site activity map

The homepage `Site activity / 访问足迹` panel is a delayed, coarse, public
traffic summary. It is not a live-presence monitor and it does not identify
people.

## Metric and display contract

- The headline is an approximate count of distinct first-party browser cookies
  across the previous 30 complete UTC days. Clearing the cookie, blocking
  JavaScript, changing browsers, or automation can change the estimate.
- The current UTC day is excluded. Public data is therefore delayed by at least
  one day.
- The total remains hidden below 10 estimated browsers. Published totals are
  rounded to the nearest five.
- Geography is quantized to a 5-degree cell before storage. A cell is omitted
  below five estimated browsers and is exposed only as a low, medium, or high
  intensity level. The public response contains no country, state, city,
  raw or exact latitude/longitude, cell identifier, or per-cell count; it
  carries only a coarse, already-projected SVG canvas position needed to draw
  the cluster.
- VPNs, proxies, mobile networks, and ISP egress points can move an IP-derived
  location. The map describes approximate activity density, not physical
  addresses or travel paths.

## Data flow and retention

1. The homepage sends a same-origin, bodyless `POST /api/site-activity/`.
2. The server creates or verifies a signed random `HttpOnly`, `SameSite=Lax`
   first-party cookie with the same 33-day purpose window as the aggregate.
   Only its keyed digest enters Redis HyperLogLog buckets.
   On Vercel, fresh-cookie issuance is limited per trusted forwarding IP. The
   rate-limit key is an HMAC digest with a one-hour TTL; the raw IP is neither
   written to Redis nor used as map data.
3. On Vercel, the server reads platform-provided IP-derived latitude and
   longitude headers, validates them, immediately quantizes them, and discards
   the original values. Local and non-Vercel requests still contribute to the
   total but have no map cell.
4. Daily total HLLs, daily cell HLLs, and daily active-cell indexes expire 33
   days after their UTC date begins.
5. The public `GET` response contains only the rounded estimate, projected map
   positions, three-level intensity buckets, thresholds, and the time window.

Xinbaopedia-owned Redis and application logs do not store the raw IP address or
the original latitude/longitude for this feature. Redis may hold the short-lived
HMAC IP digest used only to limit fresh-cookie issuance; it is pseudonymous
abuse-control data, not an anonymous activity-map value. The hosting/network
platform still processes the request IP to route requests and derive its
geolocation headers under the platform's own terms and privacy policy.

## Configuration and failure behavior

The route reuses `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, and
`RATE_LIMIT_SALT`. No client-side analytics package or browser geolocation
permission is required.

When Redis or the salt is absent, recording returns an empty `204` and the
public endpoint returns `enabled: false`. Recording errors still soft-fail so
activity statistics never block the homepage; public read errors return a
generic uncached `503`, allowing the interface to distinguish a temporary
failure from missing configuration. Successful public aggregates are
shared-cached for five minutes; recording responses are private and never
cached. The public endpoint rejects query strings so callers cannot create
arbitrary cache-key variants that repeatedly force the Redis read path.

## Map asset

`public/maps/world-land-dots.svg` is an abstract dotted land silhouette without
internal political borders. It is generated from the pinned `world-atlas`
2.0.2 / Natural Earth geometry by
`npm run generate:site-activity-map`. It is a local static asset; the homepage
adds no Leaflet, MapLibre, OpenLayers, ECharts, or browser-map runtime.

This geometry is an implementation preview, not a claim that the asset is a
Chinese official standard map or that the dynamic overlay has received a new
map-review number. Public deployment requires explicit maintainer acceptance of
this preview and a separate map-publication decision; it must not be described
as an official or authority-reviewed map. Replacing the silhouette does not
change the anonymous aggregate API contract.
