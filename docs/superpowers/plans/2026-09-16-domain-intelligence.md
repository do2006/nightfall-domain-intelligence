# NightFall Domain Intelligence API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a separate Cloudflare Worker that sells deterministic public-domain intelligence for $0.005/$0.03 USDC through x402 v2.

**Architecture:** TypeScript/Hono Worker with isolated validation, DNS/HTTP evidence collection, deterministic analysis, and x402 middleware. Paid middleware runs before target collection; network dependencies are injected for deterministic tests and SSRF controls.

**Tech Stack:** TypeScript 5.9, Hono, Vitest, ESLint, Cloudflare Workers/Wrangler, `@x402/*` v2 packages.

**Spec:** `docs/superpowers/specs/2026-09-16-domain-intelligence-design.md`

## Global Constraints
- Separate project and Worker; do not mix with other NightFall services.
- Zero upfront spend: no paid APIs, listing fees, or gas.
- Base mainnet `eip155:8453`, Circle USDC, existing NightFall revenue wallet.
- Prices: health $0.005; deep $0.03.
- Public domains only; fail closed against SSRF/private destinations.
- Deterministic evidence and scoring; no LLM dependency.

---

### Task 1: Foundation and domain validation
- [ ] Add package/config files and a failing validation test suite.
- [ ] Prove malformed domains, IP literals, localhost, ports/paths, and unsafe resolved IPs fail.
- [ ] Implement minimal validator and public-IP classifier.
- [ ] Run focused tests, then full tests/typecheck/lint/build.
- [ ] Commit the independently passing foundation.
### Task 2: DNS and web evidence collection
- [ ] Write failing tests for bounded DNS and HTTPS evidence collection and partial failures.
- [ ] Implement DNS-over-HTTPS source abstraction and bounded HTTP collector.
- [ ] Re-check resolved destinations before HTTP collection.
- [ ] Verify deterministic normalized snapshots and timeouts.
- [ ] Run quality gates and commit.

### Task 3: Deterministic health/deep analysis
- [ ] Write failing tests for SPF, DMARC, HTTPS, redirects, and defensive-header findings.
- [ ] Implement health report and bounded deep score with evidence-linked deductions.
- [ ] Ensure no finding overclaims a vulnerability from configuration evidence.
- [ ] Run quality gates and commit.

### Task 4: HTTP API and discovery
- [ ] Write failing HTTP tests for `/health`, `/demo`, paid routes, validation errors, CORS, OpenAPI and well-known resources.
- [ ] Implement Hono routes and discovery documents with POST inputs `{domain}`.
- [ ] Add `llms.txt` and free deterministic demo.
- [ ] Run quality gates and commit.

### Task 5: x402 v2 payment gate
- [ ] Write failing tests proving payment challenge occurs before resolver/fetch calls.
- [ ] Implement PayAI-backed exact EVM middleware for $0.005 and $0.03 Base-USDC routes.
- [ ] Verify x402 v2 challenge body/headers and Bazaar discovery metadata.
- [ ] Run quality gates and commit.
### Task 6: Worker deployment configuration
- [ ] Add Worker entrypoint and `wrangler.jsonc` with the distinct `nightfall-domain-intel-api` identity.
- [ ] Keep receiver address in deployment secret/environment wiring rather than source tests where practical.
- [ ] Run all local quality gates and inspect git diff.
- [ ] Commit deployment-ready code.

### Task 7: Production launch and free distribution
- [ ] Deploy the Worker using the existing authenticated Cloudflare environment.
- [ ] Probe free endpoints and unpaid paid routes from production; verify immediate 402 and exact prices before target lookup.
- [ ] Verify POST behavior from an external path and record production URL/release evidence.
- [ ] Submit to free x402 directories/registries that accept this category; skip any paid submission.
- [ ] Run a final full verification and record actual status without counting revenue until USDC is received.