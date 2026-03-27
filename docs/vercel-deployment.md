# Vercel Deployment

## Frontend scope

Deploy only the Next.js frontend on Vercel.

- Project root: `apps/web`
- Framework preset: `Next.js`
- Build command: `npm run build`
- Output directory: leave blank

If you deploy from the repository root instead of setting the Vercel root directory to `apps/web`, use:

- Build command: `npm run build -w @horse-timer/web`
- Install command: `npm install`

## Required environment variable

Set this in Vercel before production use:

- `NEXT_PUBLIC_API_BASE_URL=https://your-api-domain.com`

Do not leave it pointed at `http://localhost:4000`, or the live site will not be able to reach the backend.

## Backend note

This product uses a separate NestJS API in `apps/api`.

Vercel can host the frontend, but the backend should be deployed separately unless you explicitly redesign the platform into Vercel serverless functions.

Recommended backend targets:

- Railway
- Render
- Fly.io
- VPS / Docker host

## Suggested Vercel setup

1. Import the GitHub repository.
2. Prefer setting the root directory to `apps/web`.
3. Keep the framework as `Next.js`.
4. Leave the output directory empty.
5. Add `NEXT_PUBLIC_API_BASE_URL`.
6. Deploy.

If the project is imported from the repository root, the repo now also provides:

- root `vercel.json`
- root `vercel-build` script
- frontend-scoped `apps/web/vercel.json`

This helps Vercel detect and build the Next.js frontend more reliably from a monorepo.

## Verification after deploy

Check these pages:

- `/dashboard`
- `/judge`
- `/status`
- `/mobile-control`
- `/live`

If the pages render but show API failures, confirm the backend URL is correct and reachable from the public internet.
