# SmartShift Board — Backend

FastAPI + MongoDB Atlas + JWT authentication.

## Setup

### 1. Python environment

```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Environment variables

```bash
cp .env.example .env
```

Edit `.env`:

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string (free tier M0) |
| `JWT_SECRET` | Random secret ≥ 32 chars — `openssl rand -hex 32` |
| `JWT_ALGORITHM` | `HS256` (default) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `480` = 8 hours (default) |
| `FRONTEND_URL` | Frontend origin for CORS — `http://localhost:5173` locally |

### 3. Seed the database

```bash
python -m app.utils.seed
```

This creates 20 employees, shifts for 2 weeks, 5 absences, 2 replacements, and availabilities.

**Demo accounts:**

| Email | Password | Role |
|---|---|---|
| directeur@smartshift.fr | directeur123 | Director |
| adjoint@smartshift.fr | adjoint123 | Assistant Manager |
| gerant@smartshift.fr | gerant123 | Manager |
| employe@smartshift.fr | employe123 | Employee |

### 4. Run the server

```bash
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/api/docs

---

## Frontend setup

```bash
cd ../  # project root (smartshift-board/)
cp .env.example .env
# .env already has VITE_API_URL=http://localhost:8000/api
npm install
npm run dev
```

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET | `/api/auth/me` | JWT | Current user |
| GET | `/api/employees` | JWT | List employees (role-filtered) |
| POST | `/api/employees` | Manager | Create employee |
| PUT | `/api/employees/{id}` | JWT | Update employee |
| DELETE | `/api/employees/{id}` | Manager | Delete employee |
| GET | `/api/shifts` | JWT | List shifts (role-filtered) |
| POST | `/api/shifts` | Manager | Create shift |
| PUT | `/api/shifts/{id}` | Manager | Update shift |
| DELETE | `/api/shifts/{id}` | Manager | Delete shift |
| GET | `/api/absences` | JWT | List absences (role-filtered) |
| POST | `/api/absences` | JWT | Create absence |
| PUT | `/api/absences/{id}` | Manager | Update absence status |
| DELETE | `/api/absences/{id}` | JWT | Delete absence |
| GET | `/api/replacements` | JWT | List replacements (role-filtered) |
| POST | `/api/replacements` | Manager | Create replacement |
| PUT | `/api/replacements/{id}/assign` | Manager | Assign replacement |
| DELETE | `/api/replacements/{id}` | Manager | Delete replacement |
| GET | `/api/availabilities` | JWT | List availabilities |
| PUT | `/api/availabilities` | JWT | Set availability (upsert) |
| GET | `/api/dashboard/stats` | Manager | Dashboard statistics |
| GET | `/api/reports/summary` | Director | Weekly report |
| GET | `/api/health` | — | Health check |

---

## Deployment

### Backend — Render (free)

1. Push `backend/` to a GitHub repo (or monorepo)
2. Create a new **Web Service** on Render
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables from `.env` in the Render dashboard
6. Set `FRONTEND_URL` to your Vercel frontend URL

### Frontend — Vercel (free)

1. Push `smartshift-board/` root to GitHub
2. Import on Vercel, framework = Vite
3. Add environment variable: `VITE_API_URL=https://your-render-app.onrender.com/api`
4. Deploy

### Database — MongoDB Atlas (free M0)

1. Create cluster at mongodb.com/atlas (free M0 tier)
2. Add a database user with read/write access
3. Whitelist `0.0.0.0/0` (all IPs) for Render compatibility
4. Copy the connection string into `MONGO_URI`

---

## Security checklist

- [x] Passwords hashed with bcrypt (passlib)
- [x] JWT secret loaded from environment variable
- [x] MongoDB URI loaded from environment variable
- [x] CORS restricted to `FRONTEND_URL` only
- [x] `password_hash` never returned by any endpoint
- [x] Pydantic validation on all inputs
- [x] Role-based access control on every route
- [x] Department-scoped data for managers
- [x] Rate limiting on `/api/auth/login` (10/minute)
- [x] Audit log for sensitive actions (create/update/delete)
- [x] Employees can only edit their own `phone` and `note`
- [x] Non-directors cannot assign `director` role
- [x] Managers cannot access other departments' data
