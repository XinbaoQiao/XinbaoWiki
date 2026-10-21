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
  integer; it is not a count of people. The homepage subtracts the number of
  confirmed owner browser identities in its private correction registry from
  this raw estimate, clamped to zero. The corrected value remains an estimate.
  Raw lifetime HLLs, map-cell intensities and private daily/page-view records
  remain unchanged; this is a reversible correction of the headline total only.
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

1. A background recorder in the shared layout sends a same-origin, bodyless
   `POST /api/site-activity/v2/` for the initial page and each client-side route
   change. The map component no longer sends a second homepage ping. Only the
   current pathname and the referring hostname are added as bounded headers;
   query strings, fragments and the full external referring URL are not saved.
   The schema version is part of the route so a future incompatible payload can
   use a new endpoint without breaking an already-open page. The unversioned
   version 2 route remains available for pages opened before this change.
   Recording accepts only the canonical `example.com` hostname. Vercel
   preview or staged hostnames, loopback servers, any project automation marked
   with a `mywiki-` user agent, and recognized headless-browser automation
   receive a private `204` before visitor-cookie creation, geographic-header
   handling, migration, or Redis writes. The automation marker is an analytics
   exclusion rather than an authentication boundary; its value is never stored.
   A test-only switch can exercise recording on loopback and cannot enable a
   remote preview or production automation request. The staged deployment
   canary and canonical production smoke both require this `204` and reject a
   response that issues the visitor cookie before a release is considered safe.
2. The server creates or verifies a signed random `HttpOnly`, `SameSite=Lax`
   first-party cookie with a 400-day maximum age. Only its keyed digest enters
   Redis HyperLogLog buckets. Browser deletion or expiry can cause a returning
   browser to receive another identifier and be counted again. Existing
   version 1 cookies are reissued in the version 2 envelope with the same
   identifier, so the longer maximum age does not itself duplicate them.
   On Vercel, fresh-cookie issuance is limited per trusted forwarding IP. The
   rate-limit key is an HMAC digest with a one-hour TTL; the raw IP is never
   used as map data or embedded in rate-limit keys. Separate private event
   retention is described below.
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

## Private daily reporting

In addition to the lifetime map, accepted recording requests update independent
daily aggregates under `site-activity:daily:v1:<YYYY-MM-DD>`. Days follow
`Asia/Tokyo` (UTC+09:00). Every daily key expires at midnight at the start of
the date 90 days after its bucket date. This keeps the current calendar day and
the previous 89 days; a visit late in a day does not extend its expiry.

The stored metrics are:

- Page-view pings and an approximate distinct signed-browser count per day.
- Separate page-view counts for country, first-level region, city, public
  page, referring hostname, coarse browser family, operating-system family
  and device category. Geography is read only from Vercel system headers;
  city strings are decoded, validated and capped. City labels retain their
  country/region context to distinguish identically named cities.
- Only published Wiki routes and the homepage are named. Other paths become
  `other`, and absent page information becomes `unknown`. Full user-agent
  strings, versions, original coordinates, raw IPs, URL query parameters,
  passwords, search terms and event-level visitor rows are not stored.

The dimensions are independent marginal summaries, not visitor profiles or
joint location/page histories. A single browser can contribute multiple page
views and appear in several dimension labels. Missing or suppressed referrers
use `direct-or-unknown`; `document.referrer` is the document's source, not a
reconstructed chain of client-side navigation. IP-derived city labels may
reflect VPNs or network egress. Device categories are approximate UA families.

One atomic Redis Lua script writes the daily counters and HLL, sets fixed
expiry times, and caps each daily dimension at 256 explicit labels plus an
`__other__` overflow bucket. No visitor digest is stored in an enumerable set
or list. The report computes a multi-key `PFCOUNT` union across days, rather
than adding daily unique-browser estimates. It reads at most seven days per
REST pipeline. Daily storage failures soft-fail independently of the existing
lifetime map and do not log request data.

`GET /api/site-activity/summary/?days=7` returns a private report. The default
is seven calendar days; `days` accepts 1–90. Alternatively, use
`?start=2026-10-08&end=2026-10-08` with both dates inside the current retention
window. The request requires `Authorization: Bearer <maintainer-token>` using
the existing server-only `SITE_CHAT_ADMIN_TOKEN`; missing configuration or an
invalid credential returns 401 before any Redis lookup. Credentials in URLs,
the public owner-exclusion cookie and cross-origin browser access do not grant
report access. Reports use `Cache-Control: private, no-store` and `noindex`.
Keep the token in a secret store or environment variable when querying this
endpoint; never place it in a command argument or URL.

The report contains daily counts, period-wide page views and a unique-browser
estimate, plus page-view rankings for each dimension. `firstObservedDateInRange`
is the earliest retained day with a recorded ping, not a deployment timestamp.
No-data days cannot distinguish zero visits from an unavailable recorder.
This dataset starts with the deployment of daily collection: existing lifetime
HLLs cannot reconstruct past dates, pages, referring sources or city labels.
The private fields are never added to the public map response or a public UI.

## Private visit records

Accepted recorder pings also create private event rows when the server has a
maintainer token configured. The default collector covers an initial page and
client-side route changes, not every HTTP request, asset, click or second spent
on a page. JavaScript-disabled visits, blocked or failed recorder requests,
recognized automation and verified owner browsers can be absent. A bot that
looks like an ordinary browser may still be recorded. A row is an observed
browser page ping, not proof of a person or a unique IP.

Each row contains a random event ID, server receipt time in ISO UTC, a validated
IP from `x-vercel-forwarded-for` only on Vercel (otherwise `null`), approximate
country/region/city, an allowed public pathname, referring hostname and coarse
browser/OS/device labels. No coordinates, raw cookies, stable browser identifier,
complete user agent, URL query/fragment, question text or credential is included.
Page/referrer headers describe the browser ping and are not independently
verified navigation history. VPNs, proxies and shared networks affect IP and
location interpretation. Unknown metadata stays unknown.

Rows are held in separate `site-activity:events:v1:<YYYY-MM-DD>` daily
lists and expire at Tokyo midnight 30 calendar days after the bucket date.
The current and preceding 29 days are queryable. This is personal metadata,
not anonymous data. An atomic Lua writer caps rows and deduplication keys at
2,000 per day. It rejects a duplicate event ID within the same signed browser,
using an HMAC of browser digest and event ID; the stable digest itself is not
stored in event rows. Existing daily summaries still count accepted pings,
including duplicates, and retain their independent 90-day contract.
Once the cap is reached, a fixed-expiry `droppedPings` counter reports additional
attempts. Storage failures are reported only as generic server log messages;
they can also produce missing rows. No claim of complete delivery is made.

`GET /api/site-activity/events/` defaults to today in `Asia/Tokyo`, newest stored
rows first, and 100 rows per page. It accepts `date=YYYY-MM-DD`, `limit=1..200`,
`offset=0..2000` and `snapshot=0..2000`. Use the returned `nextOffset` and the
same `snapshot` on the next request; new rows do not shift the frozen pages.
When `nextOffset` is `null`, that snapshot is exhausted. A snapshot that has
expired or become unavailable returns an error, not an empty success.
`totalStored` can include new arrivals outside a previously frozen snapshot.
`droppedPings=0` does not establish recorder availability or complete delivery.

Like the daily summary, access requires the server-only
`SITE_CHAT_ADMIN_TOKEN` bearer credential, checked before storage access.
Unknown, duplicated or credential-bearing query parameters are rejected.
Responses use `private, no-store` and `noindex, nofollow`, with no cross-origin
access. Never place the token in command arguments or a URL. These records are not added to the public map
or knowledge exports. Recording starts after deployment; earlier aggregate
data cannot be backfilled into event rows or raw IPs.

The local report helper invokes the existing `site-chat` credential profile
in a child with a parent-enforced timeout. It performs only authenticated GETs:

```powershell
New-Item -ItemType Directory -Force .cache | Out-Null
npm run activity:report -- events --date 2026-10-10 --limit 100 --output .cache/activity-events.json
npm run activity:report -- summary --days 7 --output .cache/activity-summary.json
```

Use `--offset` and `--snapshot` from the previous response to continue event
pagination. Private output files stay in ignored `.cache`, never in Wiki
content, tracked documentation or public assets. The helper does not deploy code
or change collection settings. Querying the new endpoint requires its deployment.

## Private maintainer exclusion

The dialog shows the current browser's inclusion state before password entry.
After entering the owner password, **Check this browser and IP** performs a
read-only authenticated inspection: it returns the current request's trusted
Vercel IP, approximate location, coarse browser/OS/device and check time without
changing cookies or writing an action record. These fields never appear in the
unauthenticated preference GET or the public map. Unknown IPs remain null.

Successful password-verified exclusion and inclusion requests also attempt to
save a separate private action receipt: random action ID, server receipt time,
action, trusted request IP, approximate country/region/city and coarse device
labels. No stable browser ID, cookie, password, full user agent, page or referrer
is saved. Records expire at Tokyo midnight after 30 calendar days, capped at 200
per day with reported overflow. They identify accepted setting requests, not
unique devices, people, or a permanent list of excluded IPs. Earlier operations
cannot be reconstructed. A storage failure does not prevent opting out; the
dialog explicitly reports an unsaved receipt. After a setting change the dialog
reads the browser cookie state back before claiming success. Inspection never
uses the action writer, and failed password attempts never create these records.

Administrators can read snapshot-paginated receipts through authenticated
`GET /api/site-activity/exclusions/`, using the same `date`, `limit`, `offset`
and `snapshot` rules as visit events (maximum snapshot/offset 200):

```powershell
npm run activity:report -- exclusions --date 2026-10-18 --limit 200 --output .cache/owner-actions.json
```

This endpoint uses the existing maintainer bearer credential, private/no-store
and noindex headers, and no cross-origin access. The browser password grants
inspection of that request only; it does not grant access to the action history.
Private action receipts remain separate from visitor counts and page-view data.

The intensity heading below the atlas is an understated control rather than a
public settings link. Activating it opens a native password dialog. The
password is sent only in a same-origin JSON request and is verified against the
server-only `SITE_ACTIVITY_OWNER_PASSWORD_HASH` scrypt envelope; plaintext is
not included in the client bundle, URL, cookie, Redis, or application logs.
Wrong attempts are limited to five per 15-minute window using a keyed digest of
Vercel's trusted forwarding IP. Failed password attempts and rate-limit keys do
not persist raw IPs. Successful setting requests have the separate private action
receipts described above. A rate-limit or configuration failure fails closed
without creating an exclusion.

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

Redis HyperLogLog cannot remove one historical digest. A separate bounded
owner correction registry therefore adjusts the displayed total without
rewriting that aggregate or deleting other visitors. Successful owner exclusion
registers the existing, signed v2 browser identity once; restoring inclusion
removes that identity's correction. A refresh from an already excluded browser
also registers it, so previously excluded devices need only refresh after the
upgrade. Delayed old excluded requests cannot override an explicit restoration.
Only v2 cookies issued after successful lifetime aggregation qualify. Missing,
legacy or invalid cookies cause no invented subtraction or new identity. Older
identities lost through cookie clearing cannot be recovered from IP records.

This owner-only registry stores at most 200 salted one-way browser digests and
exclude/include state, separately from the 30-day action receipts. It stores no
IP, device label, page or cookie value, and persists alongside the lifetime
aggregate so historical corrections do not silently expire. It is not a list
of unique people or devices. Each valid identity is deducted once across IP
changes; the raw HyperLogLog estimation error still applies. Public responses
do not expose correction members or counts. Public cache freshness is shortened
to 30 seconds plus at most 30 seconds of stale revalidation.

Migration must be deployed before the version 1 daily keys from 2026-08-09
expire; an HLL cannot reconstruct an already expired source. If that deadline
is missed, the advertised collection start must move to the first recoverable
date. Migration retains all 1,988 valid five-degree cells in 128-cell batches.
Public reads are bounded to a deterministic non-geographic subset of 512 cells
if the lifetime index ever exceeds that display ceiling.

Public map aggregates and application logs do not store raw IP addresses or
the original latitude/longitude. Private event rows retain request IPs only
under the separate 30-day contract above. The lifetime HLLs cannot
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
