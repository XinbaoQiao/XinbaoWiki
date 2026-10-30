# Security Policy

MyWiki combines a public academic Wiki, an LLM-backed question-answering
API, private abuse/cost audit records, pseudonymous usage metadata, and a production deployment. Security and
privacy reports are welcome and should be handled privately until a fix is
available.

## Supported Versions

Security fixes target the current `main` branch and the production service at
<https://example.com>. Historical commits, forks, and unsupported local
deployments are not maintained as separate release lines.

## Report a Vulnerability Privately

Do **not** open a public Issue or Discussion for a suspected vulnerability.

1. Preferred: use [GitHub private vulnerability
   reporting](https://github.com/your-username/your-wiki/security/advisories/new).
2. If that channel is unavailable, email
   [you@example.com](mailto:you@example.com) with the subject
   `MyWiki security report`.

Include only the information needed to reproduce and assess the problem:

- affected URL, route, commit, or component;
- vulnerability type and likely impact;
- minimal reproduction steps or a small proof of concept;
- whether the issue affects the LLM endpoint, citations, Redis metadata,
  deployment credentials, or user privacy;
- any suggested mitigation.

Use synthetic test data. Do not include API keys, access tokens, raw private
questions, raw IP addresses, private prompts, or another person's personal
information. If sensitive evidence is essential, first ask how to transfer it
safely.

The maintainer aims to acknowledge a report within seven days, confirm its
scope, and coordinate remediation and disclosure. Response time may vary with
impact and reproducibility. This project does not currently operate a bug
bounty program.

## Private AI Audit Data Boundary

New AI requests may retain bounded questions and delivered replies, validated
Vercel request IPs, approximate location, bounded browser user agents, request
and conversation identifiers, outcomes, retries and provider-reported token
usage in a maintainer-only Redis audit for 365 Tokyo calendar days. The chat
panel displays this notice before sending. These are personal records, not
anonymous data. Full earlier client chat history is not transmitted.

Known server secrets and obvious credential-shaped text are redacted; private
system prompts, voice notes, cookies, authorization headers, provider credentials,
raw provider errors and rejected raw model outputs are excluded. Audit records
never enter public API payloads or application console logs. Authentication is
required before any audit export or store access, with private/no-store/noindex
responses. The legacy 90-day question-metadata dataset remains separate.

A paid provider attempt requires durable audit admission and an atomic daily
site-wide attempt reservation. The default ceiling is 200 attempts, including
retries, errors and cancellations; this bounds request count rather than exact
token charges. A storage failure prevents new provider work. Accepted and
rejected audit buckets have separate caps and fixed expiry; a full accepted
bucket stops provider work without erasing older evidence. Missing token usage
and unfinished records remain explicit unknown states. See
[`docs/chat/README.md`](docs/chat/README.md) for the audit/query contract.

## Site Activity Data Boundary

The public homepage activity map uses a signed random first-party browser
cookie, Redis HyperLogLog aggregates, and coarse geographic cells. The
public map aggregates do not store the raw request IP or the original
IP-derived latitude/longitude. Public map geography is quantized before
storage, and totals and map cells remain suppressed until at least two signed
browser identifiers have contributed. Versioned lifetime aggregate keys are
retained until an explicit maintainer reset; they cannot enumerate or delete an
individual browser digest.

Private reporting also keeps daily page-view counters, browser-count HLLs and
separate country/region/city, public-page, referring-hostname and coarse device
summaries for the current and previous 89 calendar days in `Asia/Tokyo`.
Each daily key has a fixed expiry; the atomic writer bounds dimension labels.
These summaries contain no raw IPs, original coordinates, complete user agents,
query strings or enumerable individual visit records. The private report endpoint
requires the server-only maintainer bearer token and uses `private, no-store`;
public map responses do not expose the daily dimensions. Retention or report
authorization failures are in scope for security reports.

Separate private visit records store server receipt timestamps, the validated
Vercel forwarding IP when available, approximate country/region/city, public
page, referring hostname and coarse device labels. These are personal metadata,
not anonymous data. They expire on a fixed Tokyo calendar-day boundary after
30 days, with at most 2,000 records per day and an explicit overflow counter.
Only the existing server-only maintainer bearer credential grants access;
responses are private/no-store/noindex. No raw cookies, stable browser ID,
complete user agent, coordinates, URL query/fragment, or authorization header
is stored. Automation and verified owner exclusions precede event storage.
Missing maintainer configuration disables event writes. Public map endpoints
never expose these records. This change begins collecting only after deployment
and cannot reconstruct earlier visits. See the event contract and query examples
in `docs/site-activity/README.md`.

To prevent trivial inflation by repeatedly discarding the browser cookie,
Vercel requests use the trusted forwarding IP only long enough to derive a
keyed one-hour rate-limit digest. Rate-limit keys and application logs never contain raw IPs;
the short-lived digest is pseudonymous abuse-control data and never appears in
the public map response.

The browser cookie has a 400-day maximum age. Clearing or expiring it can cause
a returning browser to be counted again, so the public value is an estimate of
browser identifiers rather than people. The deployment platform still
processes public request IPs for network routing
and may derive the geolocation headers supplied to the application under its
own privacy policy. Reports about leaked cookie identifiers, unsuppressed map
cells, retention failures, cross-origin recording, or manipulation of the
public aggregate are in scope. The complete data contract is documented in
[`docs/site-activity/README.md`](docs/site-activity/README.md).

The atlas legend contains an understated, password-gated maintainer control.
The password is verified only against a server-side scrypt hash and failed
attempts are limited per HMAC-derived network key; neither the password nor the
raw request IP is stored or returned. Successful verification sets an
`HttpOnly`, `SameSite=Strict` marker that is checked before visitor-cookie
minting, geographic lookup, migration, or Redis writes. It is a per-browser,
forward-looking exclusion rather than an IP denylist: changing regions does
not bypass it, while another browser, device, private window, or cleared cookie
must be verified separately. This prevents an owner from accidentally
excluding unrelated visitors behind a shared address. Existing lifetime HLL
entries cannot be selectively removed.

## Security Scope

Examples of in-scope reports include:

- exposure of deployment credentials, provider keys, server-only prompts, or
  non-public configuration;
- authentication or authorization bypass, including privileged maintenance
  operations;
- injection, cross-site scripting, server-side request forgery, or unsafe
  Markdown/URL handling;
- practical bypasses of abuse controls that threaten service availability or
  cause material provider cost;
- collection, disclosure or retention of questions, replies, IP addresses or
  other personal data outside the documented private audit and visit contracts,
  including unauthorized exports, public disclosure or excessive retention;
- cross-user disclosure or manipulation of Redis-backed quota or usage data;
- prompt-injection or citation-integrity failures with a concrete
  confidentiality, integrity, or availability impact;
- vulnerable dependencies when the weakness is reachable in this project.

The following normally belong in a public Issue rather than a security report:

- factual corrections to public Wiki content;
- ordinary hallucinations, weak answers, or missing citations without a
  security or privacy impact;
- expected refusal, abstention, or rate-limit behavior;
- broken public links, visual defects, and feature requests;
- vulnerabilities that affect only an unrelated fork or unsupported version.

When uncertain, report privately and let the maintainer reclassify it.

## Responsible Research

Good-faith testing should minimize data access, service disruption, provider
cost, and impact on other users. Do not perform denial-of-service testing,
automated high-volume probing, social engineering, credential attacks, or
access to data beyond what is necessary to demonstrate the issue. Stop once
the behavior is confirmed and allow reasonable time for remediation before
public disclosure.
