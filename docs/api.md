# TaskFlow REST API Documentation

Base URL: `http://localhost:3000/api`

All protected endpoints require an authentication token passed either via:
- HTTP Authorization Header: `Authorization: Bearer <JWT_TOKEN>`
- HTTP-Only Session Cookie: `Cookie: token=<JWT_TOKEN>`

---

## 1. Authentication Endpoints

### `POST /api/auth/register`
Creates a new user account with bcrypt password hashing (10 salt rounds).

**Request Body:**
```json
{
  "name": "Alex Morgan",
  "email": "alex@taskflow.dev",
  "password": "Password123!",
  "phone": "+1 555-0199"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Account registered successfully.",
  "data": {
    "user": {
      "id": "usr_172795...",
      "name": "Alex Morgan",
      "email": "alex@taskflow.dev",
      "phone": "+1 555-0199",
      "role": "user",
      "createdAt": "2026-10-03T..."
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### `POST /api/auth/login`
Authenticates user credentials and returns a JWT token.

**Request Body:**
```json
{
  "email": "alex@taskflow.dev",
  "password": "Password123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged in successfully.",
  "data": {
    "user": {
      "id": "usr_172795...",
      "name": "Alex Morgan",
      "email": "alex@taskflow.dev",
      "phone": "+1 555-0199",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### `GET /api/auth/me`
Retrieves the currently authenticated user's profile.

**Headers:** `Authorization: Bearer <TOKEN>`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_172795...",
      "name": "Alex Morgan",
      "email": "alex@taskflow.dev",
      "phone": "+1 555-0199",
      "role": "user"
    }
  }
}
```

---

## 2. Task Management Endpoints (CRUD)

### `GET /api/tasks`
Retrieves tasks for the authenticated user. Implements **Redis Cache-Aside**.
Response Header `X-Cache-Status` is set to `HIT` or `MISS`.

**Query Parameters:**
- `status`: `all` | `Pending` | `In Progress` | `Completed`
- `priority`: `all` | `Low` | `Medium` | `High` | `Urgent`
- `category`: `all` | `Work` | `Personal` | `Study` | `Health` | `Finance` | `Other`
- `search`: string keyword search
- `sortBy`: `createdAt` | `deadline` | `priority` | `title`
- `sortOrder`: `asc` | `desc`

**Response (200 OK):**
```json
{
  "success": true,
  "cached": false,
  "count": 5,
  "data": [
    {
      "_id": "task_001",
      "title": "Complete Cognifyz Full Stack Project Report",
      "description": "Compile architectural diagrams and API documentation.",
      "priority": "Urgent",
      "status": "In Progress",
      "category": "Work",
      "deadline": "2026-10-05T...",
      "userId": "user_demo_001",
      "createdAt": "2026-10-01T...",
      "updatedAt": "2026-10-03T..."
    }
  ]
}
```

---

### `POST /api/tasks`
Creates a new task and **invalidates the user's Redis cache**.

**Request Body:**
```json
{
  "title": "Build Weather Forecast Widget",
  "description": "Integrate Open-Meteo external API",
  "priority": "High",
  "status": "Pending",
  "category": "Work",
  "deadline": "2026-10-08T18:00:00.000Z"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Task created successfully.",
  "data": {
    "_id": "tsk_172795...",
    "title": "Build Weather Forecast Widget",
    "description": "Integrate Open-Meteo external API",
    "priority": "High",
    "status": "Pending",
    "category": "Work",
    "deadline": "2026-10-08T18:00:00.000Z",
    "userId": "user_demo_001",
    "createdAt": "2026-10-03T..."
  }
}
```

---

### `GET /api/tasks/:id`
Retrieves a single task by ID. Enforces data isolation (users cannot access another user's task).

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "task_001",
    "title": "Complete Cognifyz Full Stack Project Report",
    "priority": "Urgent",
    "status": "In Progress"
  }
}
```

---

### `PUT /api/tasks/:id`
Updates an existing task and **invalidates the user's Redis cache**.

**Request Body:**
```json
{
  "status": "Completed"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Task updated successfully.",
  "data": {
    "_id": "task_001",
    "status": "Completed",
    "updatedAt": "2026-10-03T..."
  }
}
```

---

### `DELETE /api/tasks/:id`
Deletes an existing task and **invalidates the user's Redis cache**.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Task deleted successfully.",
  "data": { "id": "task_001" }
}
```

---

## 3. External Weather API (Task 7)

### `GET /api/weather`
Fetches meteorological metrics from Open-Meteo with caching (15m TTL) and rate limiting.

**Query Parameters:**
- `city`: string (e.g. `London`, `Tokyo`, `New York`)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "city": "London",
    "country": "United Kingdom",
    "temperature": 18.2,
    "temperatureF": 64.8,
    "condition": "Partly Cloudy",
    "humidity": 58,
    "windSpeed": 15.3,
    "weatherCode": 2,
    "icon": "⛅",
    "retrievedAt": "2026-10-03T...",
    "source": "Open-Meteo Global Meteorological API",
    "cached": false
  }
}
```

---

## 4. Background Jobs (BullMQ / Async - Task 8)

### `POST /api/jobs`
Enqueues a background job for asynchronous execution.

**Request Body:**
```json
{
  "type": "GENERATE_SUMMARY_REPORT"
}
```
*Allowed types:* `GENERATE_SUMMARY_REPORT`, `TASK_DUE_REMINDER`, `EXPORT_TASKS_CSV`

**Response (202 Accepted):**
```json
{
  "success": true,
  "message": "Background job \"GENERATE_SUMMARY_REPORT\" has been scheduled.",
  "data": {
    "job": {
      "id": "job_172795_abcd",
      "name": "GENERATE_SUMMARY_REPORT",
      "status": "waiting",
      "createdAt": "2026-10-03T..."
    }
  }
}
```
