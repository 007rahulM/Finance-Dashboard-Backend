# Finance Dashboard Backend

> A role-based Finance Data Processing and Access Control REST API built with Node.js, Express, and MongoDB.

---

## 📌 Table of Contents

1. [About the Project](#about-the-project)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Getting Started](#getting-started)
6. [Environment Variables](#environment-variables)
7. [API Reference](#api-reference)
   - [Auth Endpoints](#auth-endpoints)
   - [Financial Records Endpoints](#financial-records-endpoints)
   - [Summary / Analytics Endpoints](#summary--analytics-endpoints)
   - [User Management Endpoints](#user-management-endpoints)
8. [Role-Based Access Control](#role-based-access-control)
9. [Data Models](#data-models)
10. [Design Decisions & Assumptions](#design-decisions--assumptions)
11. [Testing Guide](#testing-guide)

---

## About the Project

This backend powers a **Finance Dashboard** where different users interact with financial records based on their assigned role. The system handles:

- Secure user registration and JWT-based authentication
- Full CRUD for financial records (income / expenses)
- Aggregated dashboard analytics (totals, category breakdowns, monthly trends)
- Strict role-based access control enforced at the middleware level
- Input validation, consistent error responses, and soft deletes

---

## Features

- 🔐 **JWT Authentication** — tokens expire after 7 days; protected routes via `Authorization: Bearer <token>`
- 👥 **Three-tier RBAC** — Admin, Analyst, and Viewer roles with clearly defined permissions
- 💰 **Financial Records** — create, read, update, soft-delete with filtering and pagination
- 📊 **Analytics APIs** — total income/expenses, net balance, category totals, and monthly trends
- 🛡️ **Input Validation** — every mutation route validated with `express-validator`
- 🚦 **Rate Limiting** — global (100 req / 15 min) and stricter auth (20 req / 15 min) limiters
- 🗑️ **Soft Deletes** — records are flagged `isDeleted: true` rather than removed from the DB
- 📄 **Pagination** — all list endpoints support `?page=` and `?limit=` query params

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express 5 |
| Database | MongoDB (via Mongoose 9) |
| Auth | JSON Web Tokens (`jsonwebtoken`) |
| Password hashing | `bcryptjs` |
| Validation | `express-validator` |
| Rate limiting | `express-rate-limit` |
| Dev server | `nodemon` |

---

## Project Structure

```
Finance-Dashboard-Backend/
├── server.js                  # Entry point — wires up middleware, routes, and DB connection
├── .env.example               # Template for required environment variables
├── package.json
│
├── src/
│   ├── config/
│   │   └── db.js              # Mongoose connection helper
│   │
│   ├── models/
│   │   ├── user.model.js      # User schema (username, email, password hash, role, isActive)
│   │   └── record.model.js    # FinancialRecord schema (title, amount, type, category, date, notes, isDeleted)
│   │
│   ├── controllers/
│   │   ├── auth.controller.js     # register, login, getProfile
│   │   ├── record.controller.js   # createRecord, getAllRecords, getRecordById, updateRecord, deleteRecord
│   │   ├── summary.controller.js  # getDashboardSummary, getMonthlyTrends
│   │   └── user.controller.js     # getAllUsers, getUserById, updateUser, deleteUser
│   │
│   ├── routes/
│   │   ├── auth.routes.js     # POST /register, POST /login, GET /profile
│   │   ├── record.routes.js   # CRUD /api/records
│   │   └── user.rotues.js     # Admin-only /api/users management
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js     # verifyToken, authorizeRoles
│   │   └── validate.middleware.js # handleValidationErrors (returns 400 on bad input)
│   │
│   └── services/
│       └── summary.service.js # MongoDB aggregation logic for analytics
│
└── docs/
    └── step-8-testing.md      # Step-by-step API testing walkthrough (Thunder Client / Postman)
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MongoDB](https://www.mongodb.com/try/download/community) running locally **or** a MongoDB Atlas connection string

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/007rahulM/Finance-Dashboard-Backend.git
cd Finance-Dashboard-Backend

# 2. Install dependencies
npm install

# 3. Copy the env template and fill in your values
cp .env.example .env

# 4. Start the development server
npm run dev
```

You should see:
```
MongoDB Connected: localhost
Server running on port 5000 in development mode
```

---

## Environment Variables

Create a `.env` file in the project root (copy from `.env.example`):

| Variable | Description | Example |
|---|---|---|
| `PORT` | Port the server listens on | `5000` |
| `MONGO_URI` | Full MongoDB connection string | `mongodb://localhost:27017/zorvyn_finance` |
| `JWT_SECRET` | Secret key used to sign JWT tokens — keep this long and random | `mySuperSecretKey123456789` |
| `NODE_ENV` | Environment mode | `development` |

---

## API Reference

All endpoints return JSON. Successful responses include `"success": true`; errors include `"success": false` and a `"message"` (or `"errors"` array for validation failures).

### Base URL

```
http://localhost:5000
```

---

### Auth Endpoints

#### POST `/api/auth/register`

Register a new user. Rate-limited to 20 requests per 15 minutes.

**Request body:**
```json
{
  "username": "admin_rahul",
  "email": "admin@example.com",
  "password": "admin123",
  "role": "Admin"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `username` | string | ✅ | Min 3 chars, unique |
| `email` | string | ✅ | Valid email, unique |
| `password` | string | ✅ | Min 6 chars |
| `role` | string | ❌ | `Admin` \| `Analyst` \| `Viewer` — defaults to `Viewer` |

**Responses:**

| Status | Description |
|---|---|
| `201` | User created successfully |
| `400` | Validation error |
| `409` | Email or username already exists |

---

#### POST `/api/auth/login`

Authenticate and receive a JWT token.

**Request body:**
```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGci...",
    "user": { "id": "...", "username": "admin_rahul", "email": "admin@example.com", "role": "Admin" }
  }
}
```

| Status | Description |
|---|---|
| `200` | Login successful, token returned |
| `401` | Invalid credentials or deactivated account |

---

#### GET `/api/auth/profile`

Get the current user's profile. **Requires auth token.**

**Headers:** `Authorization: Bearer <token>`

**Response (200):** User object (password excluded).

| Status | Description |
|---|---|
| `200` | Profile returned |
| `401` | Missing or invalid token |

---

### Financial Records Endpoints

All records endpoints require `Authorization: Bearer <token>`.

#### POST `/api/records`

Create a financial record. **Requires Admin or Analyst role.**

**Request body:**
```json
{
  "title": "Monthly Salary",
  "amount": 5000,
  "type": "income",
  "category": "Salary",
  "date": "2024-06-01",
  "notes": "June paycheck"
}
```

| Field | Type | Required | Allowed values |
|---|---|---|---|
| `title` | string | ✅ | Non-empty |
| `amount` | number | ✅ | ≥ 0 |
| `type` | string | ✅ | `income` \| `expense` |
| `category` | string | ✅ | `Salary` \| `Rent` \| `Food` \| `Investment` \| `Other` |
| `date` | string | ❌ | ISO 8601 date, defaults to now |
| `notes` | string | ❌ | Max 500 chars |

| Status | Description |
|---|---|
| `201` | Record created |
| `400` | Validation error |
| `401` | Unauthenticated |
| `403` | Viewer role — not allowed |

---

#### GET `/api/records`

Get all records with optional filters and pagination. **All authenticated roles.**

**Query params:**

| Param | Description | Example |
|---|---|---|
| `type` | Filter by `income` or `expense` | `?type=expense` |
| `category` | Filter by category | `?category=Food` |
| `startDate` | Filter records on or after date | `?startDate=2024-06-01` |
| `endDate` | Filter records on or before date | `?endDate=2024-06-30` |
| `page` | Page number (default `1`) | `?page=2` |
| `limit` | Records per page (default `10`) | `?limit=5` |

**Response (200):**
```json
{
  "success": true,
  "data": [...],
  "pagination": { "total": 25, "page": 1, "limit": 10, "pages": 3 }
}
```

---

#### GET `/api/records/:id`

Get a single record by its MongoDB `_id`. **All authenticated roles.**

| Status | Description |
|---|---|
| `200` | Record found |
| `404` | Record not found or soft-deleted |

---

#### PUT `/api/records/:id`

Update a record. **Requires Admin or Analyst role.**

Same body fields as POST (all validated). Returns the updated record.

| Status | Description |
|---|---|
| `200` | Record updated |
| `400` | Validation error |
| `404` | Record not found |

---

#### DELETE `/api/records/:id`

Soft-delete a record (sets `isDeleted: true`). **Requires Admin role.**

**Response (200):**
```json
{ "success": true, "message": "Record deleted successfully." }
```

The record will no longer appear in list or single-record responses.

---

### Summary / Analytics Endpoints

Both summary endpoints require **Admin or Analyst** role.

#### GET `/api/summary/dashboard`

Returns aggregated financial summary.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalIncome": 5800,
    "totalExpenses": 2020,
    "netBalance": 3780,
    "categoryTotals": [
      { "_id": { "category": "Food", "type": "expense" }, "total": 520 },
      ...
    ],
    "recentActivity": [ ...5 most recent records... ]
  }
}
```

---

#### GET `/api/summary/trends`

Returns monthly income and expense totals for a given year.

**Query params:**

| Param | Description | Default |
|---|---|---|
| `year` | 4-digit year | Current year |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "year": 2024,
    "trends": [
      { "_id": { "month": 6, "type": "income" }, "total": 5800 },
      { "_id": { "month": 6, "type": "expense" }, "total": 2020 },
      ...
    ]
  }
}
```

---

### User Management Endpoints

All `/api/users` routes require **Admin role**.

#### GET `/api/users`

List all users with optional role filter and pagination.

**Query params:** `?role=Analyst`, `?page=1`, `?limit=10`

**Response (200):** Array of user objects (passwords excluded) + pagination metadata.

---

#### GET `/api/users/:id`

Get a single user by ID.

| Status | Description |
|---|---|
| `200` | User found |
| `404` | User not found |

---

#### PUT `/api/users/:id`

Update a user's `username`, `email`, `role`, or `isActive` status.

> An Admin cannot change their own role.

**Request body** (all fields optional):
```json
{
  "username": "new_name",
  "email": "new@example.com",
  "role": "Analyst",
  "isActive": false
}
```

---

#### DELETE `/api/users/:id`

Deactivates a user (sets `isActive: false`). Admins cannot deactivate themselves.

**Response (200):**
```json
{ "success": true, "message": "User deactivated successfully.", "data": {...} }
```

---

## Role-Based Access Control

| Action | Viewer | Analyst | Admin |
|---|:---:|:---:|:---:|
| Register / Login | ✅ | ✅ | ✅ |
| View own profile | ✅ | ✅ | ✅ |
| List / view records | ✅ | ✅ | ✅ |
| Create a record | ❌ | ✅ | ✅ |
| Update a record | ❌ | ✅ | ✅ |
| Delete a record | ❌ | ❌ | ✅ |
| View dashboard summary | ❌ | ✅ | ✅ |
| View monthly trends | ❌ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ✅ |

Roles are enforced by the `authorizeRoles(...roles)` middleware applied to each route.

---

## Data Models

### User

| Field | Type | Notes |
|---|---|---|
| `username` | String | Unique, min 3 chars |
| `email` | String | Unique, validated format |
| `password` | String | Bcrypt hashed, min 6 chars |
| `role` | String | `Admin` \| `Analyst` \| `Viewer` (default: `Viewer`) |
| `isActive` | Boolean | `true` by default; `false` = deactivated |
| `createdAt` / `updatedAt` | Date | Auto-managed by Mongoose |

Passwords are hashed via a `pre('save')` hook before they ever reach the database.

---

### FinancialRecord

| Field | Type | Notes |
|---|---|---|
| `title` | String | Required |
| `amount` | Number | Required, ≥ 0 |
| `type` | String | `Income` \| `Expense` |
| `category` | String | `Salary` \| `Rent` \| `Food` \| `Investment` \| `Other` |
| `date` | Date | Required, defaults to now |
| `notes` | String | Optional, max 500 chars |
| `createdBy` | ObjectId | Ref to User |
| `isDeleted` | Boolean | `false` by default; soft-delete flag |
| `createdAt` / `updatedAt` | Date | Auto-managed by Mongoose |

---

## Design Decisions & Assumptions

- **JWT tokens over sessions** — Stateless authentication fits a REST API well; tokens carry `id`, `email`, and `role` to avoid extra DB lookups on every request.
- **Soft deletes** — Financial data is sensitive; records are never truly removed. `isDeleted: true` keeps the history intact while hiding them from normal queries.
- **Role assigned at registration** — In a production system you'd only allow Admins to set roles; here it's open for testing convenience.
- **`type` enum casing discrepancy** — The route validator expects lowercase `income`/`expense` but the Mongoose model uses `Income`/`Expense`. Both work because the validator accepts the incoming value and Mongoose applies `enum` on the stored value — worth aligning in a future cleanup.
- **In-memory aggregation via MongoDB** — The summary service uses MongoDB aggregation pipelines to compute totals and trends on the DB side, which is efficient even at large scale.
- **Rate limiting** — All routes share a global 100 req / 15 min limiter; `/api/auth` has an additional stricter 20 req / 15 min limiter to mitigate brute-force attacks.
- **No email verification** — Out of scope for this assignment; users are active immediately after registration.
- **Pagination defaults** — `page=1`, `limit=10` for all list endpoints.

---

## Testing Guide

A full step-by-step walkthrough covering all 20 API tests (using Thunder Client or Postman) is available in:

📄 [`docs/step-8-testing.md`](./docs/step-8-testing.md)

It covers:
- Setting up your local environment
- Registering Admin, Analyst, and Viewer users
- Testing every CRUD, filter, analytics, and access-control scenario
- A checklist table to track your test results
