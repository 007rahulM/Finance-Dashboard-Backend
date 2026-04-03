# Step 8 — Testing Your API

> **You are learning:** How to use Thunder Client (VS Code extension) or Postman to test every endpoint you've built, what to look for in responses, and how to walk through a complete test scenario.

---

## 🧠 Why Test With a Client Tool?

Since this is a backend-only project (no frontend), we need a way to manually send HTTP requests to the server. Tools like **Postman** and **Thunder Client** let you:
- Choose the HTTP method (GET, POST, PUT, DELETE)
- Set request headers (like `Authorization: Bearer <token>`)
- Send a JSON body
- See the response code and body

---

## 🛠 Setting Up

### Option A: Thunder Client (Recommended — lives inside VS Code)

1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X`)
3. Search for **"Thunder Client"** and install it
4. Click the Thunder icon in the left sidebar

### Option B: Postman

1. Download from https://www.postman.com/downloads
2. Create a free account or use the app offline

---

## 🚀 Before You Start Testing

**1. Make sure MongoDB is running locally:**
```bash
# On Mac/Linux:
mongod --dbpath /usr/local/var/mongodb

# On Windows, MongoDB service usually starts automatically.
# Or start MongoDB Compass and it will start the server.
```

**2. Create your `.env` file:**
```bash
cp .env.example .env
```
Edit `.env`:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/zorvyn_finance
JWT_SECRET=myTestSecretKey123SuperLong
NODE_ENV=development
```

**3. Install dependencies and start the server:**
```bash
npm install
npm run dev
```

You should see:
```
MongoDB Connected: localhost
Server running on port 5000 in development mode
```

---

## 📋 Complete Test Walkthrough

Work through these tests **in order** — each one depends on the previous.

---

### ✅ Test 1: Register an Admin User

```
Method:   POST
URL:      http://localhost:5000/api/auth/register
Headers:  Content-Type: application/json
Body:
{
  "username": "admin_rahul",
  "email": "admin@example.com",
  "password": "admin123",
  "role": "Admin"
}
```

**Expected response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "64abc...",
    "username": "admin_rahul",
    "email": "admin@example.com",
    "role": "Admin",
    "isActive": true,
    "createdAt": "2024-06-01T00:00:00.000Z"
  }
}
```

<!-- Screenshot: Test 1 result -->

---

### ✅ Test 2: Register an Analyst User

```
Method:   POST
URL:      http://localhost:5000/api/auth/register
Headers:  Content-Type: application/json
Body:
{
  "username": "analyst_user",
  "email": "analyst@example.com",
  "password": "analyst123",
  "role": "Analyst"
}
```

**Expected:** `201 Created` with Analyst user data.

<!-- Screenshot: Test 2 result -->

---

### ✅ Test 3: Register a Viewer User

```
Method:   POST
URL:      http://localhost:5000/api/auth/register
Headers:  Content-Type: application/json
Body:
{
  "username": "viewer_user",
  "email": "viewer@example.com",
  "password": "viewer123"
}
```

No `role` needed — defaults to `Viewer`.

<!-- Screenshot: Test 3 result -->

---

### ✅ Test 4: Login as Admin

```
Method:   POST
URL:      http://localhost:5000/api/auth/login
Headers:  Content-Type: application/json
Body:
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Expected response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "64abc...",
      "username": "admin_rahul",
      "email": "admin@example.com",
      "role": "Admin"
    }
  }
}
```

> 🔑 **IMPORTANT:** Copy the `token` value. You'll use it as `<ADMIN_TOKEN>` in all subsequent requests.

<!-- Screenshot: Test 4 result -->

---

### ✅ Test 5: Get Your Profile

```
Method:   GET
URL:      http://localhost:5000/api/auth/profile
Headers:  Authorization: Bearer <ADMIN_TOKEN>
```

**Expected (200 OK):** Your user object without the password field.

<!-- Screenshot: Test 5 result -->

---

### ✅ Test 6: Try Without a Token (expect 401)

```
Method:   GET
URL:      http://localhost:5000/api/auth/profile
(no Authorization header)
```

**Expected (401):**
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

<!-- Screenshot: Test 6 result -->

---

### ✅ Test 7: Create a Financial Record (as Admin)

```
Method:   POST
URL:      http://localhost:5000/api/records
Headers:
  Authorization: Bearer <ADMIN_TOKEN>
  Content-Type: application/json
Body:
{
  "title": "Monthly Salary",
  "amount": 5000,
  "type": "income",
  "category": "Salary",
  "date": "2024-06-01"
}
```

**Expected (201 Created):**
```json
{
  "success": true,
  "data": {
    "_id": "64def...",
    "title": "Monthly Salary",
    "amount": 5000,
    "type": "income",
    "category": "Salary",
    "date": "2024-06-01T00:00:00.000Z",
    "createdBy": "64abc...",
    "isDeleted": false,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

> 📝 **Copy the `_id`** of this record. You'll need it for the next tests.

<!-- Screenshot: Test 7 result -->

---

### ✅ Test 8: Create More Records (add variety for summary tests)

Create these records one by one (same method and headers as Test 7):
```json
{ "title": "Rent Payment", "amount": 1500, "type": "expense", "category": "Rent", "date": "2024-06-02" }
{ "title": "Grocery Shopping", "amount": 400, "type": "expense", "category": "Food", "date": "2024-06-05" }
{ "title": "Stock Dividend", "amount": 800, "type": "income", "category": "Investment", "date": "2024-06-10" }
{ "title": "Restaurant", "amount": 120, "type": "expense", "category": "Food", "date": "2024-06-12" }
```

<!-- Screenshot: Test 8 results -->

---

### ✅ Test 9: Get All Records

```
Method:   GET
URL:      http://localhost:5000/api/records
Headers:  Authorization: Bearer <ADMIN_TOKEN>
```

**Expected (200 OK):** List of all records with pagination info.

<!-- Screenshot: Test 9 result -->

---

### ✅ Test 10: Filter Records by Type

```
GET http://localhost:5000/api/records?type=expense
Authorization: Bearer <ADMIN_TOKEN>
```

**Expected:** Only expense records.

<!-- Screenshot: Test 10 result -->

---

### ✅ Test 11: Filter by Date Range

```
GET http://localhost:5000/api/records?startDate=2024-06-01&endDate=2024-06-05
Authorization: Bearer <ADMIN_TOKEN>
```

**Expected:** Only records with dates between June 1–5.

<!-- Screenshot: Test 11 result -->

---

### ✅ Test 12: Get a Single Record

```
Method:   GET
URL:      http://localhost:5000/api/records/<RECORD_ID>
Headers:  Authorization: Bearer <ADMIN_TOKEN>
```

Replace `<RECORD_ID>` with the `_id` you copied in Test 7.

<!-- Screenshot: Test 12 result -->

---

### ✅ Test 13: Update a Record

```
Method:   PUT
URL:      http://localhost:5000/api/records/<RECORD_ID>
Headers:
  Authorization: Bearer <ADMIN_TOKEN>
  Content-Type: application/json
Body:
{
  "title": "Monthly Salary",
  "amount": 5500,
  "type": "income",
  "category": "Salary",
  "notes": "Got a raise this month"
}
```

**Expected (200 OK):** The updated record.

<!-- Screenshot: Test 13 result -->

---

### ✅ Test 14: Viewer Cannot Create Records (expect 403)

First, login as Viewer:
```
POST /api/auth/login
{ "email": "viewer@example.com", "password": "viewer123" }
```
Copy the Viewer token, then:

```
POST http://localhost:5000/api/records
Authorization: Bearer <VIEWER_TOKEN>
Content-Type: application/json

{
  "title": "Test",
  "amount": 100,
  "type": "income",
  "category": "Salary"
}
```

**Expected (403):**
```json
{
  "success": false,
  "message": "Role (Viewer) is not allowed to access this resource."
}
```

<!-- Screenshot: Test 14 result -->

---

### ✅ Test 15: Dashboard Summary

```
Method:   GET
URL:      http://localhost:5000/api/summary/dashboard
Headers:  Authorization: Bearer <ADMIN_TOKEN>
```

**Expected (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalIncome": 5800,
    "totalExpenses": 2020,
    "netBalance": 3780,
    "categoryTotals": [...],
    "recentActivity": [...]
  }
}
```

<!-- Screenshot: Test 15 result -->

---

### ✅ Test 16: Monthly Trends

```
GET http://localhost:5000/api/summary/trends?year=2024
Authorization: Bearer <ADMIN_TOKEN>
```

<!-- Screenshot: Test 16 result -->

---

### ✅ Test 17: Delete a Record (Admin only)

```
Method:   DELETE
URL:      http://localhost:5000/api/records/<RECORD_ID>
Headers:  Authorization: Bearer <ADMIN_TOKEN>
```

**Expected (200 OK):**
```json
{ "success": true, "message": "Record deleted successfully." }
```

Then verify it's gone:
```
GET http://localhost:5000/api/records/<RECORD_ID>
```
**Expected:** `404 Record not found.` (soft delete worked!)

<!-- Screenshot: Test 17 results -->

---

### ✅ Test 18: Validation Error

Try sending invalid data:
```
POST http://localhost:5000/api/records
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json

{
  "title": "",
  "amount": -50,
  "type": "transfer",
  "category": "Games"
}
```

**Expected (400):**
```json
{
  "errors": [
    { "msg": "Title is required", "path": "title" },
    { "msg": "Amount must be a non-negative number", "path": "amount" },
    { "msg": "Type must be income or expense", "path": "type" },
    { "msg": "Invalid category", "path": "category" }
  ]
}
```

<!-- Screenshot: Test 18 result -->

---

### ✅ Test 19: Admin — List All Users

```
GET http://localhost:5000/api/users
Authorization: Bearer <ADMIN_TOKEN>
```

<!-- Screenshot: Test 19 result -->

---

### ✅ Test 20: Analyst Cannot Access User List (expect 403)

Login as Analyst, then:
```
GET http://localhost:5000/api/users
Authorization: Bearer <ANALYST_TOKEN>
```

**Expected:** `403 Forbidden`

<!-- Screenshot: Test 20 result -->

---

## 📊 Test Summary Checklist

| # | Endpoint | Expected Status | Pass? |
|---|---|---|---|
| 1 | POST /api/auth/register (Admin) | 201 | |
| 2 | POST /api/auth/register (Analyst) | 201 | |
| 3 | POST /api/auth/register (Viewer) | 201 | |
| 4 | POST /api/auth/login | 200 + token | |
| 5 | GET /api/auth/profile | 200 | |
| 6 | GET /api/auth/profile (no token) | 401 | |
| 7 | POST /api/records | 201 | |
| 8 | Create 4 more records | 201 × 4 | |
| 9 | GET /api/records | 200 + pagination | |
| 10 | GET /api/records?type=expense | 200, filtered | |
| 11 | GET /api/records with date range | 200, filtered | |
| 12 | GET /api/records/:id | 200 | |
| 13 | PUT /api/records/:id | 200, updated | |
| 14 | POST /api/records (Viewer) | 403 | |
| 15 | GET /api/summary/dashboard | 200 | |
| 16 | GET /api/summary/trends | 200 | |
| 17 | DELETE /api/records/:id | 200 | |
| 18 | POST invalid record | 400 + errors | |
| 19 | GET /api/users (Admin) | 200 + list | |
| 20 | GET /api/users (Analyst) | 403 | |

---

## ✅ What You Learned in This Step

- [x] How to set up Thunder Client or Postman
- [x] How to send requests with tokens in the Authorization header
- [x] How to test every type of endpoint: auth, CRUD, analytics
- [x] How to verify access control is working
- [x] How to confirm validation is rejecting bad input
