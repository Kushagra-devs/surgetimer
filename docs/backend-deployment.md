# Backend Deployment

## Recommended target

Deploy the NestJS API separately from the Vercel frontend.

Supported repo manifests included:

- `render.yaml`
- `railway.json`

## Required environment variables

- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `REFRESH_TOKEN_SECRET`
- `NODE_ENV=production`
- `HARDWARE_ADAPTER_MODE=mock` unless a live ALGE connection is available on the host

The API now supports platform-provided `PORT` automatically.

## Render

Use the included `render.yaml` or create a Web Service with:

- Build Command: `npm install && npm run build -w @horse-timer/api`
- Start Command: `npm run start -w @horse-timer/api`
- Health Check Path: `/health/live`

## Railway

Use the included `railway.json` or create a service with:

- Build: Nixpacks
- Start Command: `npm run start -w @horse-timer/api`
- Health Check Path: `/health/live`

## After backend deploy

Set this in Vercel:

- `NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain.com`

Then redeploy the frontend.
