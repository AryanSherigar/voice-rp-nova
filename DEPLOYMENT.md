# Deployment

## Dependency management

This project now uses a single dependency source: `package.json` / `package-lock.json` managed by npm.

- React and ReactDOM are bundled by Vite from npm dependencies.
- Tailwind CSS is compiled locally through PostCSS during build.
- No runtime CDN is used for React, ReactDOM, or Tailwind.

> Note: the app still loads external font stylesheets in `index.html` and `index.css`.

## Build steps

1. Install dependencies:

   ```bash
   npm ci
   ```

2. Create production build:

   ```bash
   npm run build
   ```

3. (Optional) Validate production output locally:

   ```bash
   npm run preview
   ```

The generated static assets are emitted to `dist/` by Vite and can be deployed to any static host.

## API turn rate limiting

`api/turn.ts` uses a distributed limiter (Upstash Redis REST pipeline) and intentionally does **not** fall back to process memory. Configure:

- `TURN_RATE_LIMIT_PROVIDER` (default: `upstash`)
- `TURN_RATE_LIMIT_UPSTASH_URL` (required to enable limiter)
- `TURN_RATE_LIMIT_UPSTASH_TOKEN` (required to enable limiter)
- `TURN_RATE_LIMIT_KEY_PREFIX` (optional, default: `turn-api:rate-limit`)
- `TURN_RATE_LIMIT_FAIL_MODE` (`open` default, or `closed`)

Semantics remain fixed-window with the existing values in code (`60s` window, `20` max requests per key/IP).

Failure behavior is explicit:

- `open`: if the provider call fails, request is allowed through.
- `closed`: if the provider call fails, request is rejected with HTTP 429.

If the Upstash URL/token are missing, the limiter is disabled and the API logs a warning once at runtime (no in-memory fallback).

## API payload limits (`/api/turn`)

The turn endpoint enforces payload size at the framework parser layer (Next API `bodyParser.sizeLimit`) via `api/turn.ts` config:

- `TURN_MAX_BODY_SIZE_LIMIT` (default: `1.5mb`)

Behavior contract:

- Requests larger than the configured parser limit are rejected before handler business logic runs.
- Vercel/Next responds with HTTP `413 Payload Too Large` for these oversized bodies.
- The in-handler `Content-Length` check was removed so clients should rely on HTTP 413 semantics (rather than advisory header validation).
