# Security Policy

Xinbaopedia combines a public academic Wiki, an LLM-backed question-answering
API, pseudonymous usage metadata, and a production deployment. Security and
privacy reports are welcome and should be handled privately until a fix is
available.

## Supported Versions

Security fixes target the current `main` branch and the production service at
<https://xinbaopedia.top>. Historical commits, forks, and unsupported local
deployments are not maintained as separate release lines.

## Report a Vulnerability Privately

Do **not** open a public Issue or Discussion for a suspected vulnerability.

1. Preferred: use [GitHub private vulnerability
   reporting](https://github.com/XinbaoQiao/XinbaoWiki/security/advisories/new).
2. If that channel is unavailable, email
   [xinbaoqiao@cuhk.edu.hk](mailto:xinbaoqiao@cuhk.edu.hk) with the subject
   `Xinbaopedia security report`.

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
- storage or disclosure of raw questions, chat history, raw IP addresses, or
  other data outside the documented metadata policy;
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
