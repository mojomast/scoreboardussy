# Deployment Guide

## Prerequisites

- **Docker** & Docker Compose (for self-hosting)
- **Node.js 18+** (for manual/local development)
- **PostgreSQL** database (connection string required)
- **Redis** (optional, enables horizontal scaling)

---

## Environment Variables

Copy `server/.env.example` to `server/.env` and fill in the values:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3001` | HTTP port the server listens on |
| `NODE_ENV` | No | `development` | Set to `production` for prod builds |
| `PUBLIC_URL` | Yes | — | Public URL used for QR codes and links (e.g. `https://scoreboard.example.com`) |
| `JWT_SECRET` | Yes | — | Strong secret for signing JWT room tokens |
| `ROOM_TTL_HOURS` | No | `2` | Hours until inactive rooms expire |
| `MAX_ROOMS` | No | `100` | Maximum concurrent rooms allowed |
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `REDIS_URL` | No | — | Redis connection string (enables multi-node scaling) |
| `LOG_LEVEL` | No | `info` | Pino log level (`trace`, `debug`, `info`, `warn`, `error`) |

---

## Self-Host with Docker

1. **Clone the repository**
   ```bash
   git clone https://github.com/mojomast/scoreboardussy.git
   cd scoreboardussy
   ```

2. **Copy and configure environment**
   ```bash
   cp server/.env.example server/.env
   # Edit server/.env and set JWT_SECRET, PUBLIC_URL, DATABASE_URL
   ```

3. **Start services**
   ```bash
   docker compose -f docker-compose.vps.yml up -d
   ```

4. **Verify**
   ```bash
   curl http://localhost:3002/health
   ```

---

## Deploy to Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/placeholder)

1. Fork this repository on GitHub.
2. Create a new project in Railway and select **Deploy from GitHub repo**.
3. Add a **PostgreSQL** plugin in Railway.
4. Set the required environment variables (`JWT_SECRET`, `PUBLIC_URL`).
5. Railway will auto-detect the `Dockerfile` and deploy.

---

## Deploy to Fly.io

1. **Install Flyctl** and authenticate:
   ```bash
   fly auth login
   ```

2. **Launch the app**:
   ```bash
   fly launch
   ```

3. **Attach a PostgreSQL database**:
   ```bash
   fly postgres create --name scoreboardussy-db
   fly postgres attach scoreboardussy-db
   ```

4. **Set secrets**:
   ```bash
   fly secrets set JWT_SECRET=your-secret PUBLIC_URL=https://your-app.fly.dev
   ```

5. **Deploy**:
   ```bash
   fly deploy
   ```

---

## SSL / Caddy

The repository includes a `Caddyfile` for easy reverse-proxy + SSL termination:

```
scoreboard.ussy.host {
    reverse_proxy localhost:3002
}
```

1. Install [Caddy](https://caddyserver.com/).
2. Update the `Caddyfile` with your domain.
3. Run `caddy run` or `caddy start`.
4. Caddy will automatically provision and renew TLS certificates.

---
