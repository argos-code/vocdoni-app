# Deploying vocdoni-app

This guide covers running vocdoni-app in production using Docker.

## Prerequisites

- [Docker Engine](https://docs.docker.com/engine/install/) 24 or later
- A `.env` file populated from `.env.example` (see [Environment Variables](#environment-variables))

No external database or cache service is required. The app is a self-contained Node.js SSR server that connects to the Vocdoni SaaS API configured via `SAAS_URL`.

## Quick Start

```bash
# 1. Copy and fill in environment variables
cp .env.example .env
$EDITOR .env

# 2. Build the Docker image (env vars are baked in at build time)
docker build -t vocdoni-app .

# 3. Run the container
docker run -d \
  --name vocdoni-app \
  -p 3000:3000 \
  -e APP_URL=https://your-domain.example.com \
  vocdoni-app

# 4. Check that it started
docker logs vocdoni-app
```

Open `http://localhost:3000` (or your configured domain) to verify the app is running.

## Services Overview

| Service       | Description                         | Port   |
| ------------- | ----------------------------------- | ------ |
| `vocdoni-app` | Node.js SSR server (Vike + Express) | `3000` |

The container is sized for a **512 MB** host: `NODE_OPTIONS=--max-old-space-size=328` is set in the image. Increase it via the `NODE_OPTIONS` environment variable if you have more memory available.

## Environment Variables

Variables fall into two categories: **build-time** (baked into the JavaScript bundle by Vite during `docker build`) and **runtime** (read by the Node.js server process at startup).

### Build-time variables

These must be present in a `.env` file at the project root before running `docker build`. Copy `.env.example` as a starting point. Alternatively, `VOCDONI_ENVIRONMENT` can be passed directly as a build argument:

```bash
docker build --build-arg VOCDONI_ENVIRONMENT=prod -t vocdoni-app .
```

| Variable                      | Description                                               |
| ----------------------------- | --------------------------------------------------------- |
| `VOCDONI_ENVIRONMENT`         | Vocdoni network to target: `prod` or `dev`                |
| `SAAS_URL`                    | Base URL of the Vocdoni SaaS API                          |
| `STRIPE_PUBLIC_KEY`           | Stripe publishable key                                    |
| `GTM_CONTAINER_ID`            | Google Tag Manager container ID (e.g. `GTM-XXXXXXX`)      |
| `PLAUSIBLE_DOMAIN`            | Domain registered with Plausible analytics                |
| `ANALYTICS_CLIENT_ID`         | Analytics client identifier                               |
| `CRISP_WEBSITE_ID`            | Crisp chat widget site ID (leave blank to disable)        |
| `PRIORITY_SUPPORT_PHONE`      | Phone number shown in the priority-support UI             |
| `PRIVACY_POLICY_URL`          | URL of the privacy policy page                            |
| `TERMS_OF_SERVICE_URL`        | URL of the terms of service page                          |
| `VIDEO_TUTORIAL`              | JSON object mapping locale codes to tutorial video URLs   |
| `ANNOUNCEMENT`                | JSON object for the in-app announcement banner (optional) |
| `BASE_URL`                    | Public base path used by the Vite build (default: `/`)    |
| `BUILD_PATH`                  | Output directory for built files (default: `dist`)        |
| `CUSTOM_ORGANIZATION_DOMAINS` | JSON object mapping custom hostnames to organization IDs  |

### Runtime variables

These are read by the server process when the container starts. Pass them with `-e` or `--env-file` to `docker run`.

| Variable       | Default (in image)         | Description                                                                                                                                                                                                                                         |
| -------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PORT`         | `3000`                     | TCP port the server listens on                                                                                                                                                                                                                      |
| `NODE_ENV`     | `production`               | Node environment                                                                                                                                                                                                                                    |
| `NODE_OPTIONS` | `--max-old-space-size=328` | V8 heap limit; override for larger hosts                                                                                                                                                                                                            |
| `APP_URL`      | _(none)_                   | Canonical public URL of the deployment (e.g. `https://app.example.com`). Recommended in production — used for SSR cache partitioning. Without it the cache key falls back to the `x-forwarded-host` header, which requires a trusted reverse proxy. |
| `LANGUAGES`    | `{"en":"English"}`         | JSON object of supported public language codes to display names (e.g. `{"en":"English","es":"Español"}`). Controls language-prefix routing on SSR pages.                                                                                            |

## Common Operations

```bash
# Start a stopped container
docker start vocdoni-app

# Stop the container
docker stop vocdoni-app

# View live logs
docker logs -f vocdoni-app

# Restart
docker restart vocdoni-app

# Update to a new image (rebuild, then recreate the container)
docker build -t vocdoni-app .
docker stop vocdoni-app
docker rm vocdoni-app
docker run -d \
  --name vocdoni-app \
  -p 3000:3000 \
  -e APP_URL=https://your-domain.example.com \
  vocdoni-app
```

## Troubleshooting

**Port 3000 is already in use**

Change the host-side port mapping: `-p 8080:3000` to expose the app on host port `8080`.

**`APP_URL` warning in logs**

The server prints a warning if `APP_URL` is unset in production. Set `-e APP_URL=https://your-domain.example.com` to suppress it and ensure correct SSR cache behaviour.

**Environment variables missing from the built app**

Build-time variables are baked in during `docker build`. If a value is wrong or missing, rebuild the image after updating your `.env` file — restarting the container is not enough.

**Container exits immediately**

Run `docker logs vocdoni-app` to inspect the error. Common causes: missing `dist/` output (the build step failed) or a syntax error in a JSON-valued environment variable (`ANNOUNCEMENT`, `VIDEO_TUTORIAL`, etc.).
