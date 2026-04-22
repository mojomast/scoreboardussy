# SaaS Architecture

## Tier Model

| Feature | Free | Pro |
|---------|------|-----|
| Active rooms | Up to 3 | Unlimited |
| Spectators per room | 20 | 500 |
| Room TTL | 2 hours | 24 hours |
| Custom branding | — | Yes |

---

## Billing Plan

Stripe or LemonSqueezy integration is **planned** for a future release.

- The `User.plan` field in the Prisma schema is stubbed with `"free"` | `"pro"`.
- `stripeCustomerId` is reserved for Stripe Customer IDs.
- No billing webhooks or checkout flows are implemented yet.

---

## Auth Flow

### Current: JWT-based room tokens
- Rooms are accessed via short 6-character codes.
- Each room role (`referee`, `display`, `viewer`) has a unique secret.
- Optional JWT tokens can be issued per-room for socket authentication.

### Planned: User account login
- Email + password registration (hashed with `passwordHash`).
- JWT session tokens for user authentication.
- Room ownership via `Room.ownerId` ↔ `User.id` relation.

---

## Scaling

### Single-node default
- By default the app runs on a single server with in-memory room state.
- PostgreSQL persists room metadata and events.

### Horizontal scaling with Redis
- Set `REDIS_URL` to enable the Socket.IO Redis adapter.
- This allows multiple server instances to share WebSocket state.
- Use `docker-compose.vps.yml` which includes a `redis` service.
