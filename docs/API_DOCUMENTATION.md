# API Documentation

Base URL (local): `http://localhost:5000/api`

All protected endpoints require:
```
Authorization: Bearer <JWT>
```
Tokens are issued by `POST /api/auth/login` and expire after `JWT_EXPIRES_IN` (default 8h).

Error responses follow the shape `{ "message": "..." }` (validation/server errors may
also include `"error"`).

---

## Auth

### `POST /api/auth/login`
Public. Authenticates a user and returns a JWT.

**Body**
```json
{ "email": "admin@ppe.com", "password": "Admin@123" }
```
**200 Response**
```json
{
  "token": "eyJhbGciOi...",
  "user": { "id": "...", "name": "System Admin", "email": "admin@ppe.com", "role": "admin", "site": "Head Office", "isActive": true, "createdAt": "..." }
}
```
**401** — invalid credentials or inactive account.

### `GET /api/auth/me`
Auth: any logged-in user. Returns the current user (used to restore a session on page reload).

---

## Users (admin only)

### `POST /api/users`
Create a supervisor (or another admin).

**Body**
```json
{ "name": "Jane Doe", "email": "jane@site.com", "password": "Passw0rd", "role": "supervisor", "site": "Main Site" }
```
**201** → `{ "user": { ...safe user fields } }`
**409** if the email is already registered.

### `GET /api/users?role=supervisor`
List users. Optional `role` query filter (`admin` | `supervisor`).
**200** → `{ "users": [ ... ] }`

### `PATCH /api/users/:id/status`
Enable/disable a user without deleting them.
**Body:** `{ "isActive": false }`
**200** → `{ "user": {...} }`

### `DELETE /api/users/:id`
Permanently deletes a user.
**200** → `{ "message": "User deleted." }`

---

## Workers

### `GET /api/workers?department=&search=`
Auth: admin or supervisor. Lists workers, optional department filter and free-text search
over name/workerId.
**200** → `{ "workers": [ { "name", "workerId", "jobProfile", "department", "mobileNumber", "aadharNumber" (masked), "site", "isActive" } ] }`

### `GET /api/workers/departments`
Returns the distinct list of departments (for filter dropdowns).
**200** → `{ "departments": ["Warehouse & Logistics", "Maintenance", ...] }`

### `POST /api/workers` (admin only)
Registers a new worker (schema extension point — e.g. onboarding a worker with a new IoT badge).
**Body:** any subset of the Worker schema fields (`name`, `workerId`, `jobProfile`, `department`, `mobileNumber`, `aadharNumber`, `site`).
**201** → `{ "worker": {...} }`

---

## Violations

### `GET /api/violations?status=&department=&ppeType=&from=&to=`
Auth: admin or supervisor. Lists violations (most recent first, capped at 500), with
`worker` and `acknowledgedBy` populated, plus two computed fields per item:
- `isEscalated`: `true` if `status === 'pending'` and it has been pending ≥ `ESCALATION_MINUTES`.
- `minutesPending`: minutes since `detectedAt`, or `null` if already acknowledged.

**200**
```json
{
  "violations": [
    {
      "_id": "...",
      "worker": { "_id": "...", "name": "Praveen Sharma", "workerId": "WRK0001", "jobProfile": "Forklift Operator", "department": "Warehouse & Logistics" },
      "ppeType": "Helmet",
      "severity": "High",
      "status": "pending",
      "detectedAt": "2026-07-24T10:00:00.000Z",
      "isEscalated": true,
      "minutesPending": 14
    }
  ]
}
```

### `GET /api/violations/alerts` (admin only)
Returns only violations that are `pending` **and** have been pending for
`≥ ESCALATION_MINUTES` (default 10) — i.e. exactly the events a supervisor failed
to acknowledge in time.
**200** → `{ "alerts": [ ... ], "count": 2 }`

### `PATCH /api/violations/:id/acknowledge` (supervisor only)
Marks a violation acknowledged by the current supervisor. Sets `status`,
`acknowledgedBy`, `acknowledgedAt`.
**200** → `{ "violation": {...} }`
**400** if it was already acknowledged. **404** if not found.

### `POST /api/violations/simulate`
Auth: admin or supervisor. Simulates an IoT device reporting a non-compliance event
(used because no physical devices exist for this assessment).

**Body (all optional)**
```json
{
  "workerId": "WRK0002",       // omit for a random active worker
  "ppeType": "Safety Gloves",  // omit for a random PPE type
  "severity": "High",           // omit for a random severity
  "backdateMinutes": 12          // omit/0 = detected now; set >=10 to demo instant escalation
}
```
**201** → `{ "violation": { ...populated with worker } }`

---

## Dashboard & Insights

### `GET /api/dashboard/admin` (admin only)
```json
{
  "totalWorkers": 4,
  "totalSupervisors": 1,
  "violationsToday": 3,
  "pendingViolations": 2,
  "acknowledgedToday": 1,
  "escalatedAlerts": 2,
  "complianceResponseRate": 75
}
```

### `GET /api/dashboard/supervisor` (supervisor only)
```json
{
  "violationsToday": 3,
  "pendingViolations": 2,
  "acknowledgedByMe": 5,
  "totalWorkers": 4,
  "avgResponseMinutes": 6
}
```

### `GET /api/dashboard/insights` (admin only)
Chart-ready aggregates:
```json
{
  "byPpeType": [ { "type": "Helmet", "count": 8 } ],
  "byDepartment": [ { "department": "Maintenance", "count": 5 } ],
  "bySeverity": [ { "severity": "High", "count": 4 } ],
  "last7Days": [ { "date": "2026-07-20", "count": 2 } ],
  "topViolators": [ { "_id": "...", "count": 3, "name": "Swati Bose", "workerId": "WRK0002", "department": "Maintenance" } ]
}
```

---

## Reports

### `GET /api/reports/violations/export?status=&department=&from=&to=`
Auth: admin or supervisor. Streams a CSV file (`Content-Type: text/csv`) of the
(optionally filtered) violations list — worker, PPE type, severity, status,
acknowledgement details, timestamps.

---

## Health check

### `GET /api/health`
Public. `{ "status": "ok", "time": "..." }` — useful for uptime checks on free hosting tiers.

---

## Status codes used throughout

| Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Resource created |
| 400 | Bad request / validation error |
| 401 | Missing/invalid/expired token, or bad credentials |
| 403 | Authenticated but wrong role for this endpoint |
| 404 | Resource not found |
| 409 | Conflict (e.g. duplicate email) |
| 500 | Unexpected server error |
