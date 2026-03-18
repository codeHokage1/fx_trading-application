# FX Trading API

NestJS backend for multi-currency FX trading. Users register, fund NGN wallets, and convert or trade between NGN, USD, EUR, GBP, CAD, and JPY using real-time exchange rates.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | NestJS |
| ORM / Database | TypeORM + PostgreSQL 15+ |
| Cache | Redis (optional — falls back to in-memory) |
| FX Rates | exchangerate-api.com |
| Email | Resend |
| Auth | JWT + OTP email verification |
| Logging | nestjs-pino (structured JSON) |

---

## Prerequisites

- Node.js 20+
- PostgreSQL 15+ (or Docker)
- Redis (optional)
- [Resend](https://resend.com) account (free tier)
- [exchangerate-api.com](https://www.exchangerate-api.com) account (free tier)

---

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd fx-trading
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in `.env` — see [Environment Variables](#environment-variables) below.

### 3. Create the database

```bash
# Docker
docker run --name fx-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=fx_trading \
  -p 5432:5432 -d postgres:15

# Native PostgreSQL
psql -U postgres -c "CREATE DATABASE fx_trading;"
```

### 4. Run

```bash
npm run start:dev    # development (watch mode)
npm run start:prod   # production
npm run build        # compile only
```

- App: `http://localhost:3000`
- Swagger UI: `http://localhost:3000/api/docs`

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `3000` | HTTP port |
| `NODE_ENV` | No | `development` | `development` or `production` |
| `DB_HOST` | Yes | `localhost` | PostgreSQL host |
| `DB_PORT` | No | `5432` | PostgreSQL port |
| `DB_USER` | Yes | — | PostgreSQL username |
| `DB_PASS` | Yes | — | PostgreSQL password |
| `DB_NAME` | Yes | `fx_trading` | Database name |
| `JWT_SECRET` | Yes | — | Secret for signing JWT tokens |
| `JWT_EXPIRES_IN` | No | `7d` | Token lifetime |
| `RESEND_API_KEY` | Yes | — | Resend API key (`re_...`) |
| `MAIL_FROM` | Yes | — | Verified sender address — use `onboarding@resend.dev` for testing |
| `FX_API_KEY` | Yes | — | exchangerate-api.com API key |
| `FX_BASE_URL` | No | `https://v6.exchangerate-api.com/v6` | FX API base URL |
| `FX_CACHE_TTL_SECONDS` | No | `300` | How long to cache FX rates (seconds) |
| `REDIS_HOST` | No | `localhost` | Redis host — app functions without Redis |
| `REDIS_PORT` | No | `6379` | Redis port |
| `INITIAL_NGN_BALANCE` | No | `1000` | NGN credited to new accounts on signup |

---

## API Endpoints

All routes are prefixed with `/v1`. Protected routes require `Authorization: Bearer <token>`.

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/v1/auth/register` | — | Register and send OTP to email |
| POST | `/v1/auth/verify` | — | Verify OTP, activate account |
| POST | `/v1/auth/login` | — | Login, returns JWT |
| POST | `/v1/auth/resend-otp` | — | Request a new OTP (rate-limited) |

### Wallet

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/v1/wallet` | JWT + verified | All currency balances |
| POST | `/v1/wallet/fund` | JWT + verified | Add NGN to wallet |
| POST | `/v1/wallet/convert` | JWT + verified | Convert between any two currencies |
| POST | `/v1/wallet/trade` | JWT + verified | Trade NGN ↔ foreign currency |

### FX

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/v1/fx/rates` | JWT | Current exchange rates (USD base) |

### Transactions

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/v1/transactions` | JWT + verified | Paginated transaction history |

Full request/response schemas are available in Swagger at `/api/docs`.

---

## Architecture Decisions

### Multi-currency wallets

Each currency balance is a separate row in the `wallets` table keyed on `(user_id, currency)`. Adding a new currency requires no schema changes — only a constant update.

### Double-spend prevention

All balance operations run inside a PostgreSQL transaction with `SELECT ... FOR UPDATE` (pessimistic write lock). Concurrent requests on the same wallet queue rather than race.

### FX rate caching

Rates are fetched from exchangerate-api.com and cached in Redis (or in-memory if Redis is unavailable) for 5 minutes. If the external API is down, the last cached rates serve as a fallback for up to 1 hour before the service returns an error.

### `convert` vs `trade`

Both deduct one currency and credit another at real-time rates. `trade` enforces that NGN must be one side of the pair (NGN ↔ foreign). `convert` is unrestricted. Both operation types are recorded separately in transaction history for analytics purposes.

### Idempotency

All mutating wallet endpoints accept an optional `idempotencyKey`. Submitting the same key twice returns the original result without re-executing the operation.

### Email verification gate

After registration, users receive a 6-digit OTP by email. Only verified accounts can access wallet and trading endpoints. The `isVerified` flag is embedded in the JWT payload to avoid a database round-trip on every request.

---

## Key Assumptions

- **Wallet funding is simulated.** No payment gateway is integrated. In production, funding would integrate with a provider like Paystack: initiate a charge, confirm via webhook, and credit only on a confirmed payment event — with idempotency on the payment reference.
- **Supported currencies are fixed** at NGN, USD, EUR, GBP, CAD, JPY. Adding a new currency requires only appending it to the `SUPPORTED_CURRENCIES` constant in `fx.service.ts`.
- **FX cross-rates use USD as the base.** NGN/EUR, for example, is computed as `rates['EUR'] / rates['NGN']`.
- **OTPs expire in 10 minutes** and are single-use. Calling the resend endpoint invalidates any previous OTP.
- **New users start with 1,000 NGN** (configurable via `INITIAL_NGN_BALANCE`).
- **Schema auto-sync** (`synchronize: true`) is enabled in development only. Use migrations in production.

---

## Scaling Considerations

- Redis is already abstracted as the cache layer. Ensuring Redis is available in production eliminates the in-memory fallback and enables cache sharing across multiple app instances.
- The wallet locking strategy handles high concurrency per user. Cross-user contention is negligible by design — each user's wallets are independent.
- The FX service is stateless and cacheable. A single shared Redis instance across app instances guarantees rate consistency.
- For large user volumes: partition `wallets` and `transactions` by `user_id`, add read replicas for history queries, and move FX rate fetching to a dedicated background worker.
