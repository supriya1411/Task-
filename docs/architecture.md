# TaskFlow System Architecture

TaskFlow is architected as an enterprise-grade full stack system built for the Cognifyz Full Stack Development Internship. It implements a layered, separation-of-concerns pattern across the presentation, application, data, caching, and background worker tiers.

```
                           +-----------------------------------------------+
                           |        Client Presentation Tier               |
                           |  - Bootstrap 5.3 + Custom CSS3                |
                           |  - EJS Dynamic Server Rendered Views          |
                           |  - Vanilla JS DOM Manipulation & AJAX Client  |
                           +-----------------------+-----------------------+
                                                   |
                                                   | HTTP / REST (JSON & HTML)
                                                   v
+---------------------------------------------------------------------------------------------------+
|                                  Express.js Application Tier                                      |
|                                                                                                   |
|  [Middleware Pipeline]                                                                           |
|  CORS -> Request Logger -> CookieParser -> JSON/URL Parser -> Rate Limiter -> Auth Middleware     |
|                                                                                                   |
|  [Controllers & Routing]                                                                          |
|  - PageController: Renders Landing, Dashboard, Tasks, Weather, Docs                               |
|  - AuthController: Registration, Login, Logout, JWT Token issuance                                |
|  - TaskController: RESTful CRUD (GET, POST, PUT, DELETE)                                          |
|  - WeatherController: External API proxy, rate limiting, and timeout guard                        |
|  - JobController: Asynchronous job dispatch and queue monitoring                                 |
|                                                                                                   |
|  [Service & Business Logic]                                                                       |
|  - AuthService: Password hashing with bcrypt, JWT claims & verification                          |
|  - TaskService: Task lifecycle, authorization, ownership verification, analytics aggregation      |
|  - CacheService: Cache-Aside reads, TTL management, key pattern invalidation                      |
|  - WeatherService: Geocoding lookup, 5000ms AbortController timeout, WMO code interpretation      |
+-------------------+------------------------------+---------------------------+--------------------+
                    |                              |                           |
                    | Query / Mutations            | Cache Check / Invalidation| Async Queue Push
                    v                              v                           v
+-----------------------------+    +-----------------------------+    +-----------------------------+
|        Database Tier        |    |       Cache Layer           |    |     Background Worker Tier  |
|  MongoDB / Mongoose         |    |  Redis Key-Value Store      |    |  BullMQ Worker Engine       |
|  - User Model (bcrypt hash) |    |  - Keys: tasks:<uid>:*      |    |  - Task Summary Report Job  |
|  - Task Model (user scoped) |    |  - Keys: weather:city:*     |    |  - Due Date Reminder Job    |
|  - In-Memory Fallback Repo  |    |  - TTL Expiration: 180s/900s|    |  - Background CSV Export    |
+-----------------------------+    +-----------------------------+    +-----------------------------+
                                                   |
                                                   | Outbound HTTPS with 5s Timeout Guard
                                                   v
                                   +-----------------------------+
                                   |       External API Tier     |
                                   |  Open-Meteo Meteorological  |
                                   |  Forecast & Geocoding REST  |
                                   +-----------------------------+
```

---

## 1. Security & Authentication Architecture (Task 6)

### Password Hashing
- **Algorithm:** `bcryptjs` with **10 salt rounds**.
- Passwords are never stored or logged in plain text.
- Model pre-save hooks automatically hash the password upon creation or modification.

### JWT Token Issuance & Verification
- **Token Format:** Signed JSON Web Token (`HS256`) containing `userId`, `email`, `name`, and `role`.
- **Transmission:** Accepted via both standard `Authorization: Bearer <token>` headers (for API clients) and `token` HTTP-Only cookies (for browser page navigation).
- **Protection:** Prevents Cross-Site Scripting (XSS) credential theft via `httpOnly: true, sameSite: 'lax'`.

### Authorization & Per-User Isolation
- Every task query, update, or deletion strictly validates `task.userId === req.user.userId`.
- Unauthorized attempts to modify or view tasks owned by another user are halted with an HTTP 403 Forbidden status.

---

## 2. Redis Caching & Invalidation Architecture (Task 8)

TaskFlow implements the **Cache-Aside (Lazy Loading)** pattern:

1. **Read Request (`GET /api/tasks`):**
   - The application constructs a deterministic key based on the user's ID and query parameters: `tasks:${userId}:list:${JSON.stringify(filters)}`.
   - The Redis layer is inspected first.
   - **Cache HIT:** Cached JSON is returned immediately with HTTP header `X-Cache-Status: HIT`. Database query is skipped entirely, reducing database load to near zero.
   - **Cache MISS:** Database is queried. The result is returned to the client and asynchronously saved to Redis with a 180-second TTL.

2. **Write Requests (`POST`, `PUT`, `DELETE /api/tasks`):**
   - When a task is created, updated, or removed, `cacheService.invalidateUserTasks(userId)` is triggered.
   - All keys matching the user pattern `tasks:${userId}:*` are purged.
   - Subsequent reads guarantee fresh data consistency without stale reads.

---

## 3. Background Job Processing Architecture (Task 8)

- **Job Manager:** Powered by **BullMQ** connected to Redis, with an integrated asynchronous fallback queue.
- **Queue Name:** `taskflow-jobs`.
- **Job Types:**
  1. `GENERATE_SUMMARY_REPORT`: Compiles completion metrics, total tasks, and progress reports asynchronously.
  2. `TASK_DUE_REMINDER`: Scans pending tasks approaching a 48-hour deadline and logs simulated email notification alerts.
  3. `EXPORT_TASKS_CSV`: Builds CSV formatted exports in the background and delivers an export identifier.

---

## 4. External Meteorological API & Timeout Guard (Task 7)

- **Provider:** Open-Meteo Global Meteorological REST Service.
- **Resilience:** Wrapped in a Node.js `AbortController` with a 5000ms deadline. If the external provider experiences network latency, the request is safely cancelled without blocking server threads.
- **Quota Protection:** Rate limited via `express-rate-limit` (50 queries / 10 min) and cached in Redis for 15 minutes (900s TTL).
