# KobKlein Monorepo — Docker-First Development

## Local Development Architecture

- **API**: Runs in Docker (port 3002, internal port 3000)
- **Redis**: Runs in Docker (port 6379)
- **Web**: Runs locally via pnpm (port 3003)

## Quick Start

1. **Stop any local API process**
   - If running: `CTRL+C` in any `pnpm dev` terminal for API

2. **Update your .env**
   - In `apps/web/.env.local`, set:
     ```
     NEXT_PUBLIC_API_BASE_URL=http://localhost:3002
     ```

3. **Ensure Docker env is correct**
   - In `apps/api/.env.development`:
     - `PORT=3000`
     - `REDIS_URL=redis://redis:6379`

4. **Start backend (API + Redis) via Docker**
   ```sh
   docker compose up --build
   ```
   - Wait for: `api | KobKlein API running on port 3000`

5. **Start frontend (web) locally**
   ```sh
   pnpm --filter web dev
   ```

## Service Ports

| Service | Port  | How to Run         |
|---------|-------|--------------------|
| API     | 3002  | Docker Compose     |
| Redis   | 6379  | Docker Compose     |
| Web     | 3003  | pnpm (local)       |

## Why This Architecture?
- No port confusion
- No environment mismatch
- No accidental dual API
- Production-like behavior

## Next Steps
- Add Postgres container
- Run Prisma migrations in Docker
- Add worker/mailer containers

---

For more, see `docker-compose.yml` and each app's README.
