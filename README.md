# SiteGuard — Worker PPE Compliance Monitoring System

A full-stack web application that lets **administrators** and **site supervisors**
manage workforce operations and monitor PPE (Personal Protective Equipment)
compliance, based on simulated IoT device data.

**Stack:** Node.js / Express · MongoDB (Mongoose) · React (Vite) · JWT Auth · Recharts

---

## 1. Features

### Authentication
- JWT-based login for two roles: `admin` and `supervisor`.
- Route-level and API-level role enforcement (a supervisor cannot hit admin-only
  endpoints, and vice versa).

### Administrator portal
| Module | Description |
| Dashboard | Key metrics: active workers, supervisors, violations today, pending, escalated alerts, response rate. |
| Users | Create/enable/disable supervisor (or admin) accounts. |
| Alerts | Violations **not acknowledged by a supervisor within 10 minutes** of detection. |
| Data Insights | Charts: violations by PPE type, 7-day trend, by department, top repeat offenders. |

### Supervisor portal
| Module | Description |
| Dashboard | Personal + site metrics, and a **"Trigger Random Violation"** demo button. |
| Violations | All non-compliance events site-wide, with an **Acknowledge** action. |
| Reports | Export the violations list to CSV with optional filters (status/department/date range). |

### Alert / escalation workflow
1. A worker's IoT device reports a PPE non-compliance event → a `Violation` document
   is created with `status: pending` and `detectedAt: now`.
2. It immediately appears on the **Supervisor → Violations** page with an
   **Acknowledge** button.
3. If **no supervisor acknowledges it within 10 minutes**, it automatically appears
   on the **Admin → Alerts** page. This is computed live (`detectedAt` vs. current
   time), not by a separate cron job, so it is always accurate on read.
4. Since no physical IoT hardware exists for this assessment, violations are
   **simulated** via a "Trigger Violation" button available to supervisors
   (see "Simulating the workflow" below).

---

## 2. Project structure

```
worker-ppe-compliance/
├── backend/                 
│   ├── config/db.js
│   ├── models/               
│   ├── middleware/auth.js    
│   ├── controllers/
│   ├── routes/
│   ├── seed/                 
│   └── server.js
├── frontend/                 
│   └── src/
│       ├── api/axios.js
│       ├── context/AuthContext.jsx
│       ├── components/       
│       └── pages/
│           ├── admin/        
│           └── supervisor/   
├── docs/                     
└── README.md
```

---

## 3. Prerequisites

- Node.js 18+ and npm
- MongoDB (local install, or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster)


---

## 4. Setup & run — local

### 4.1 Backend

```bash
cd backend
cp .env.example .env
# edit .env if needed (MONGO_URI, JWT_SECRET, etc.)
npm install
npm run seed      # loads the provided worker dataset + demo users + sample violations
npm run dev        # starts the API on http://localhost:5000
```

The seed script creates:
- **Admin** login: `admin@ppe.com` / `Admin@123`
- **Supervisor** login: `supervisor@ppe.com` / `Supervisor@123`
- The 4 workers from the provided dataset
- A few sample violations (one already acknowledged, one fresh pending, and two
  already older than 10 minutes so you can see the Admin Alerts page populated
  immediately after seeding).

### 4.2 Frontend

```bash
cd frontend
cp .env.example .env      # VITE_API_URL should point at the backend, default http://localhost:5000/api
npm install
npm run dev                # starts the app on http://localhost:5173
```

Open `http://localhost:5173`, and use the "Admin demo" / "Supervisor demo" buttons
on the login screen to autofill credentials.

---



## 5. Simulating the workflow (no physical IoT devices)

Since there are no real IoT sensors for this assessment, non-compliance events are
generated through a manual **simulate** action, available two ways:

1. **Supervisor → Dashboard → "Trigger Random Violation"** — creates one
   violation for a random worker/PPE type, detected "now".
2. **Supervisor → Violations → "Simulate Violation"** — lets you pick a specific
   worker, PPE type, and how many minutes ago it was "detected". Setting this to
   **11+ minutes** instantly demonstrates the escalation path: refresh
   **Admin → Alerts** and the event will already be there, because escalation is
   evaluated as `status === 'pending' && (now - detectedAt) >= 10 minutes`, not by
   waiting for a background timer.

In a production system, step 1 (device → API) would be replaced by IoT devices
calling `POST /api/violations/simulate` (or a dedicated ingestion endpoint) directly.

---

## 6. Environment variables

### backend/.env
| Variable | Description | Default |
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/ppe_compliance` |
| `JWT_SECRET` | Secret used to sign JWTs | — (must set) |
| `JWT_EXPIRES_IN` | Token lifetime | `8h` |
| `PORT` | API port | `5000` |
| `DEFAULT_ADMIN_EMAIL` / `DEFAULT_ADMIN_PASSWORD` | Seeded admin credentials | `admin@ppe.com` / `Admin@123` |
| `ESCALATION_MINUTES` | Minutes before a pending violation escalates to Admin Alerts | `10` |
| `CLIENT_ORIGIN` | Allowed CORS origin(s), comma separated | `http://localhost:5173` |

### frontend/.env
| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Base URL of the backend API | `http://localhost:5000/api` |

---

## 8. Deployment (free tier)

The app is designed to deploy on free-tier hosting:

- **Database:** MongoDB Atlas (free M0 cluster) → use the connection string as `MONGO_URI`.
- **Backend:** Render / Railway / Fly.io — deploy `backend/` as a Node web service,
  set the environment variables from the table above, and run `npm run seed` once
  (via a one-off shell/job) after the first deploy.
- **Frontend:** Vercel / Netlify — deploy `frontend/`, set `VITE_API_URL` to the
  deployed backend's `/api` URL, build command `npm run build`, output dir `dist`.

See `docs/PROJECT_DOCUMENTATION.md` for more detail on the deployment approach and
architectural trade-offs.

---

## 9. Documentation index

- [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md) — collections, fields, relationships, indexes.
- [`docs/API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md) — every endpoint, auth requirements, request/response shapes.
- [`docs/PROJECT_DOCUMENTATION.md`](docs/PROJECT_DOCUMENTATION.md) — architecture, design decisions, assumptions, and possible extensions.
