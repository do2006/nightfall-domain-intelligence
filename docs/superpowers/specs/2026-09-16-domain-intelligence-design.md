# NightFall Domain Intelligence API — Design

## Goal
Build a separate zero-upfront-cost Cloudflare Worker that sells deterministic domain posture intelligence to AI agents through x402 v2 payments.

## Product boundary
The service accepts a public domain name only. It does not scan private IP space, exploit targets, brute-force services, or depend on paid APIs/LLMs.

## Revenue model
- `POST /domain/health`: $0.005 USDC per call.
- `POST /domain/deep`: $0.03 USDC per call.
- Base mainnet `eip155:8453`, Circle USDC.
- Existing NightFall revenue wallet receives payments.
- Free `/health`, `/demo`, discovery manifests, OpenAPI, and `llms.txt` support distribution.

## Intelligence collected
Health returns normalized DNS and web posture: A/AAAA/CNAME/MX/NS/TXT evidence, HTTPS reachability, redirect behavior, status, and key security headers.
Deep adds SPF, DMARC, mail posture, certificate/TLS metadata available from the HTTPS connection, cookie/header findings, deterministic risk findings, score, and evidence timestamps.

## Safety and input controls
Reject IP literals, localhost, single-label hosts, URL paths, credentials, ports, non-ASCII ambiguity, and malformed domains. Resolve DNS before outbound HTTP and refuse loopback, private, link-local, multicast, documentation, carrier-grade NAT, and otherwise non-public resolved addresses to prevent SSRF.
## Architecture
Use TypeScript + Hono on Cloudflare Workers. Keep domain validation, DNS source collection, HTTP/TLS collection, deterministic analysis, x402 payment middleware, and HTTP routing in separate modules with injected fetch/resolver dependencies for tests.

Paid routes challenge before any target lookup. The payment layer mirrors the proven NightFall GitHub Intelligence x402 v2 structure and PayAI facilitator, while this project keeps a distinct repository, Worker name, manifests, tests, and deployment identity.

## Deterministic scoring
Return evidence plus explainable findings rather than opaque AI judgments. Deep score starts at 100 and applies bounded deductions for concrete conditions such as HTTPS failure, certificate/TLS failure, missing HSTS, missing DMARC, missing SPF, unsafe redirects, and absent defensive headers. Never claim a vulnerability from headers alone.

## Reliability
Every network operation has a short timeout and bounded response size. DNS/HTTP partial failures are represented explicitly instead of crashing the whole report. Results include `observedAt` and source-level error fields.

## Discovery and monetization
Expose x402 Bazaar metadata on paid POST routes plus `/.well-known/x402`, `/.well-known/x402-manifest.json`, `/.well-known/x402-service.json`, `/openapi.json`, `/llms.txt`, `/health`, and `/demo`. After production verification, submit only to free directories and registries; no listing fee, gas spend, or paid API may be introduced.

## Acceptance
Tests must prove input/SSRF rejection, deterministic DNS/mail/header analysis, payment-before-lookup behavior, correct Base-USDC challenge amounts, discovery metadata, CORS/OPTIONS behavior, and graceful upstream failures. `npm test`, typecheck, lint, build, and fresh production probes must all pass before launch is called complete.