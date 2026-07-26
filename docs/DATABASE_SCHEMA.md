# Database Schema

Database: **MongoDB** (via Mongoose ODM). Three collections: `users`, `workers`, `violations`.

## Entity relationship overview

```
 User (admin / supervisor)                Worker (from provided dataset)
 ┌──────────────────────┐                 ┌───────────────────────────┐
 │ _id                   │                 │ _id                        │
 │ name                  │                 │ name                       │
 │ email (unique)        │                 │ workerId (unique)          │
 │ password (hashed)     │                 │ jobProfile                 │
 │ role: admin|supervisor│                 │ department                 │
 │ site                  │                 │ mobileNumber                │
 │ isActive              │                 │ aadharNumber (masked out)  │
 │ createdBy -> User     │                 │ site                       │
 └──────────┬────────────┘                 │ isActive                  │
            │ acknowledgedBy               └──────────┬─────────────────┘
            │                                          │ worker
            ▼                                          ▼
                     Violation
                     ┌───────────────────────────────────┐
                     │ _id                                 │
                     │ worker      -> Worker._id            │
                     │ ppeType     (enum)                   │
                     │ severity    (enum)                   │
                     │ site                                 │
                     │ department                            │
                     │ deviceId    (simulated IoT device id) │
                     │ description                           │
                     │ status      pending | acknowledged     │
                     │ acknowledgedBy  -> User._id             │
                     │ acknowledgedAt                          │
                     │ detectedAt   (escalation clock)         │
                     │ createdAt / updatedAt (timestamps)      │
                     └────────────────────────────────────────┘
```

## Collection: `users`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | primary key |
| `name` | String | required |
| `email` | String | required, unique, lowercase |
| `password` | String | required, bcrypt-hashed, `select: false` by default |
| `role` | String enum `['admin','supervisor']` | required |
| `site` | String | default `Main Site` — the site/area a supervisor is responsible for |
| `isActive` | Boolean | default `true`; used to disable a supervisor without deleting them |
| `createdBy` | ObjectId ref `User` | which admin created this account (null for the seeded admin) |
| `createdAt` / `updatedAt` | Date | Mongoose timestamps |

Indexes: unique index on `email`.

## Collection: `workers`

Seeded directly from the provided dataset (`backend/seed/workers.json`).

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | primary key |
| `name` | String | required |
| `workerId` | String | required, unique — e.g. `WRK0001` |
| `jobProfile` | String | required — e.g. `Forklift Operator` |
| `department` | String | required — e.g. `Warehouse & Logistics` |
| `mobileNumber` | String | required |
| `aadharNumber` | String | required; **masked in every API response** (`XXXX XXXX 6379`) via a `toJSON` transform, since this is government ID / PII |
| `site` | String | default `Main Site` |
| `isActive` | Boolean | default `true` |
| `createdAt` / `updatedAt` | Date | Mongoose timestamps |

Indexes: unique index on `workerId`; index on `department` (used for filtering/insights).

## Collection: `violations`

Represents a single PPE non-compliance event (simulated IoT detection).

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | primary key |
| `worker` | ObjectId ref `Worker` | required |
| `ppeType` | String enum | `Helmet`, `Safety Vest`, `Safety Gloves`, `Safety Boots`, `Safety Goggles`, `Face Mask` |
| `severity` | String enum | `Low`, `Medium`, `High` (default `Medium`) |
| `site` | String | copied from the worker at creation time |
| `department` | String | copied from the worker at creation time (denormalized for fast filtering/aggregation) |
| `deviceId` | String | identifies the (simulated) IoT device that reported the event |
| `description` | String | human-readable summary |
| `status` | String enum | `pending` \| `acknowledged` |
| `acknowledgedBy` | ObjectId ref `User` | the supervisor who acknowledged it |
| `acknowledgedAt` | Date | when it was acknowledged |
| `detectedAt` | Date | **the escalation clock**. Normally equals creation time; the demo simulator can back-date it to instantly demonstrate escalation |
| `createdAt` / `updatedAt` | Date | Mongoose timestamps (audit trail, distinct from `detectedAt`) |

Indexes:
- Compound index on `{ status: 1, detectedAt: 1 }` — this is exactly the shape of
  the escalation query (`status: 'pending', detectedAt: { $lte: now - 10min }`),
  so lookups for the Admin Alerts page stay fast as the collection grows.
- Index on `department` — used by the insights aggregations and violation filters.

### Why "escalation" is a computed field, not a stored one

A violation is not flagged "escalated" by a background job flipping a boolean.
Instead, every read (`GET /api/violations`, `GET /api/violations/alerts`, and the
admin dashboard metrics) computes `isEscalated` from `status` and `detectedAt` at
request time. This avoids clock-drift / missed-job problems that come with relying
on a cron worker, and guarantees the Alerts page is always correct even if the
server was briefly down.

## Seed data

`backend/seed/seed.js`:
1. Clears `users`, `workers`, `violations`.
2. Creates one `admin` and one `supervisor` account.
3. Inserts the 4 workers from the provided dataset.
4. Inserts 4 sample violations covering all three states you'll want to see
   immediately: one already acknowledged, one fresh pending (< 10 min), and two
   pending violations older than 10 minutes (so the Admin Alerts page is populated
   right after seeding, without waiting).
