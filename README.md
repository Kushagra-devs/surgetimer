# Horse Jumping Timer

Production-oriented monorepo scaffold for a horse show jumping timing platform with:

- NestJS API
- Next.js web app
- Prisma + PostgreSQL
- Redis-backed live state
- Server-authoritative timer engine
- Pluggable ALGE-ready hardware adapters
- vMix-friendly HTML overlay

## Quick start

1. Copy `.env.example` to `.env`.
2. Install dependencies with `npm install`.
3. Start supporting services with `docker compose up -d postgres redis`.
4. Generate Prisma client with `npm run prisma:generate`.
5. Run migrations with `npm run prisma:migrate`.
6. Seed demo data with `npm run seed`.
7. Start apps with `npm run dev`.

See the files in `docs/` for architecture, operations, and overlay setup.

