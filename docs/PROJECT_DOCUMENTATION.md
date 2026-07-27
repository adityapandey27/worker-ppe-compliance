# Project Documentation

## 1. Objective

Build a responsive full-stack app that lets **administrators** and **site
supervisors** manage workforce operations and monitor PPE compliance, seeded from
a provided worker dataset and driven by simulated IoT non-compliance events.

## 2. Architecture

```
┌────────────┐        HTTPS/JSON        ┌───────────────┐        Mongoose        ┌───────────┐
│  React SPA │ ───────────────────────▶ │  Express API   │ ─────────────────────▶ │ MongoDB    │
│  (Vite)    │ ◀─────────────────────── │  (JWT auth)    │ ◀───────────────────── │            │
└────────────┘                          └───────────────┘                         └───────────┘
     │                                          │
     │ role-based routing (admin/supervisor)    │ role-based middleware (protect + authorize)
```

- **Frontend:** React 18 + Vite + React Router. Tailwind (CDN) for styling,
  Recharts for the Data Insights charts. A single `AuthContext` holds the logged-in
  `user` object (fetched via `GET /api/auth/me` on load); `ProtectedRoute` enforces
  both "must be logged in" and "must have role X" at the route level, mirroring the
  server-side checks. The JWT itself is never held by the frontend — it lives only
  in an httpOnly cookie set by the backend, so JS on the page can't read or leak it.
- **Backend:** Express, organized by feature (`routes` → `controllers`), with
  Mongoose models for `User`, `Worker`, `Violation`. Two middleware functions,
  `protect` (reads the JWT from the `token` cookie via `cookie-parser` and verifies
  it) and `authorize(...roles)` (role gate), are composed on every private route.
  Auth uses an httpOnly, `SameSite=None; Secure` cookie rather than a bearer token
  in `localStorage` — see 3.3 below for the reasoning and trade-offs.
- **Database:** MongoDB. Chosen per the requested stack; document model fits well
  since violations are naturally independent, high-write, denormalized documents
  (each stores `department`/`site` directly rather than requiring a join to render
  a list).

## 3. Key design decisions

### 3.1 Escalation is computed, not scheduled
Rather than running a cron job every N minutes to flip violations from "pending"
to "escalated," escalation is a **pure function of `status` and `detectedAt`**,
evaluated on every read (`isEscalated = pending && now - detectedAt >= 10min`).
This means:
- No missed escalations if the server restarts or a job fails to fire.
- The Admin Alerts page is always exactly correct, not "correct as of the last job run."
- It costs nothing extra in write complexity — one indexed query.

### 3.2 Simulating IoT input
There is no physical hardware in this assessment, so a `POST /api/violations/simulate`
endpoint plays the role of an IoT device. It is exposed in the UI as an explicit
"Trigger Violation" action (rather than fully automatic background generation) so
the reviewer can deterministically demonstrate both the initial violation flow and
the 10-minute escalation flow using the `backdateMinutes` parameter, without waiting
around in real time. In a production deployment, this endpoint (or an equivalent
ingestion route) would instead be called by actual IoT gateways/devices, and the
manual trigger would be removed or restricted to a staging environment.

### 3.3 Session storage: httpOnly cookie vs. Bearer token
The JWT is delivered via an **httpOnly cookie** (`Set-Cookie: token=...`), not
returned in the login response body or stored in `localStorage`. Concretely:
- On login, the server sets `token` as `httpOnly; secure; sameSite=none`, and the
  frontend never sees the raw token — every subsequent request just needs
  `withCredentials: true` (axios) for the browser to attach it automatically.
- This is a deliberate improvement over a `localStorage`-held bearer token: an
  httpOnly cookie **can't be read by JavaScript**, which closes off the most common
  way a stolen/XSS'd script would exfiltrate a session token. `localStorage` has no
  such protection — any script running on the page (including a compromised
  dependency) can read it.
- The trade-off: because the frontend (Netlify) and backend (Render) are on
  different domains, the cookie must be `SameSite=None`, which some browsers'
  privacy settings treat as "third-party" and may block depending on the user's
  configuration (Safari ITP, and increasingly Chrome). The app was verified working
  cross-browser after deployment; a fully same-origin setup (e.g. proxying `/api`
  through the frontend host) would remove this class of risk entirely and is a
  reasonable next step if browser compatibility issues arise in practice.
- CORS (`cors` middleware) is configured with an explicit origin allowlist and
  `credentials: true`, which is required for cookies to be accepted cross-origin at
  all — a wildcard (`origin: '*'`) origin cannot be combined with credentialed
  requests per the CORS spec, so the allowlist isn't just a security nicety here,
  it's a functional requirement.

### 3.4 Role separation
Roles are enforced twice: once in the JWT-derived `req.user.role` on the server
(the actual security boundary), and once in the React router (`ProtectedRoute`) for
UX (so a supervisor is redirected, not shown a raw 403 page). Admin-only vs.
supervisor-only endpoints are grouped in dedicated routers so the authorization
rule is visible at a glance rather than scattered per-handler.

### 3.5 PII handling for Aadhar numbers
The dataset includes Aadhar (Indian national ID) numbers. Since these are
sensitive personal identifiers, the `Worker` model masks them (`XXXX XXXX 6379`)
in every JSON response via a Mongoose `toJSON` transform, rather than exposing the
full number to the frontend. This is a reasonable default for a compliance
dashboard where the full number isn't operationally needed; a real system would
likely encrypt it at rest and only decrypt for authorized, audited access.

### 3.6 Denormalized `department`/`site` on `Violation`
Each violation stores a copy of the worker's `department`/`site` at the time it
was recorded. This trades a small amount of duplication for much simpler/faster
filtering and aggregation (department breakdowns, department filters on
reports) without needing `$lookup` on every query — appropriate for a
write-once, read-many event log.

## 4. Assumptions

- "10 minutes" escalation applies uniformly to all violations (no per-severity SLA),
  matching the assessment's literal description. `ESCALATION_MINUTES` is
  configurable via env var if this needs to change.
- A supervisor is not scoped to a single department/site for acknowledging
  violations — the brief describes supervisors monitoring "the site" broadly, so
  any supervisor can acknowledge any pending violation. The schema already
  supports adding a `site`-based restriction later (`User.site` and
  `Violation.site` exist for this purpose).
- Admins can also trigger the demo simulator (not just supervisors), since it's a
  demo/test utility rather than a role-restricted business action.
- "Export the violations list" is implemented as CSV (broadly compatible with
  Excel/Sheets and easy to audit); the endpoint accepts the same filters as the
  Violations list view.
- Worker records are read-mostly in this UI (the dataset is the seed source of
  truth); a `POST /api/workers` endpoint exists as an extension point for
  onboarding new workers/IoT badges, but no dedicated "manage workers" screen was
  built since it wasn't in the stated requirements.

## 5. Security notes

- Passwords are hashed with bcrypt (`bcryptjs`), never stored or returned in plain text.
- JWTs are signed server-side (`JWT_SECRET`) and expire after 8 hours by default,
  matching the session cookie's `maxAge`.
- The JWT is delivered as an **httpOnly cookie**, not exposed to frontend
  JavaScript or persisted in `localStorage` — this significantly limits the blast
  radius of an XSS vulnerability, since a malicious script on the page cannot read
  or exfiltrate the session token (see 3.3 for the full trade-off discussion).
- The cookie is also `secure` (HTTPS-only) and `sameSite=none` (required for the
  cross-origin Netlify ↔ Render deployment); logout explicitly clears it via
  `res.clearCookie` with matching attributes.
- `User.password` has `select: false` in the schema — it's never returned unless
  explicitly requested (login flow).
- CORS uses an explicit origin allowlist (`CLIENT_ORIGIN`) plus `credentials: true`,
  rather than a wildcard — required for cookies to be sent/accepted cross-origin at
  all, and prevents arbitrary sites from making credentialed requests to the API.
- Role checks happen server-side on every private route — the frontend guard is a
  UX convenience, not the security boundary.

## 6. Possible extensions (out of scope for this assessment)

- Real-time delivery of new violations/alerts via WebSockets/SSE instead of polling.
- Per-site scoping so a supervisor only sees/acknowledges violations for their site.
- Audit log of admin actions (user creation/disable, worker edits).
- Multi-factor auth / password reset flow.
- Rate limiting and request validation middleware (e.g. `express-validator`) for
  all write endpoints.
- Automated tests (unit tests for controllers/escalation logic, integration tests
  for the auth flow) — recommended next step if this were to continue past the
  assessment stage.

## 7. How the requirements map to the implementation

| Requirement | Implementation |
|---|---|
| Import/seed provided dataset | `backend/seed/workers.json` + `backend/seed/seed.js` |
| JWT auth (httpOnly cookie), role-based access | `middleware/auth.js` (`protect`, `authorize`), `authController.js`, `cookie-parser` |
| Admin: Dashboard | `GET /api/dashboard/admin` → `pages/admin/Dashboard.jsx` |
| Admin: Users (create supervisors) | `POST /api/users` → `pages/admin/Users.jsx` |
| Admin: Alerts (unacknowledged > 10 min) | `GET /api/violations/alerts` → `pages/admin/Alerts.jsx` |
| Admin: Data Insights (charts) | `GET /api/dashboard/insights` → `pages/admin/Insights.jsx` (Recharts) |
| Supervisor: Dashboard | `GET /api/dashboard/supervisor` → `pages/supervisor/Dashboard.jsx` |
| Supervisor: Violations + acknowledge | `GET /api/violations`, `PATCH /api/violations/:id/acknowledge` → `pages/supervisor/Violations.jsx` |
| Supervisor: Reports export | `GET /api/reports/violations/export` → `pages/supervisor/Reports.jsx` |
| Alert workflow simulation | `POST /api/violations/simulate` (manual trigger, with `backdateMinutes` to demo escalation instantly) |
