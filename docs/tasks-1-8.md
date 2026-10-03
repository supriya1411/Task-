# Cognifyz Full Stack Development Internship: Tasks 1–8 Implementation Mapping

Every single task from the Cognifyz syllabus is progressively integrated and active in the TaskFlow codebase.

---

### Task 1: HTML Forms, Express Server & EJS Server-Side Rendering
- **Requirements:** Implement HTML forms, landing page, registration/login/task forms, Node.js Express server, routes, POST form handling, and EJS server-side rendering.
- **Implementation:**
  - `server.ts`: Configures Express with `app.set('view engine', 'ejs')`.
  - `views/pages/landing.ejs`: Semantic landing page with hero CTA and feature roadmap.
  - `views/pages/register.ejs`: Semantic HTML registration form with POST handler.
  - `views/pages/login.ejs`: Semantic HTML login form with POST handler.
  - `views/pages/task-form.ejs`: Task creation and editing forms.
  - `routes/pageRoutes.ts`: Express routes handling GET renders and POST form submissions.
- **Verification:** Start server and visit `/`, `/register`, `/login`, and `/tasks/new`. Forms submit with POST and render views.

---

### Task 2: Client-Side and Server-Side Validation
- **Requirements:** Required fields, email, phone, password strength, task validation, clear error messages, and temporary server-side storage.
- **Implementation:**
  - `middleware/validationMiddleware.ts`: Server-side validation for registration (name length, email regex, password complexity, phone format) and tasks (title 3–120 chars, enum checks). Returns structured error responses and re-renders forms preserving inputs.
  - `public/js/validation.js`: Instant client-side validation with regex checks and live password entropy scoring.
- **Verification:** Submit empty registration form or enter an invalid email format to view instant client error indicators and server-side validation error alerts.

---

### Task 3: Modern Professional Responsive UI
- **Requirements:** Navbar, sidebar, dashboard, cards, task table/cards, statistics, Bootstrap, CSS Grid/Flexbox, transitions, animations, and responsive layouts for mobile/tablet/desktop.
- **Implementation:**
  - `views/partials/navbar.ejs`: Responsive brand header with user dropdown.
  - `views/partials/sidebar.ejs`: Offcanvas/collapsible sidebar navigation.
  - `views/pages/dashboard.ejs`: 4 core statistic cards (Total Tasks, Completed Tasks, Pending Tasks, High Priority Tasks), progress bar, recent tasks, and weather widget.
  - `views/pages/tasks.ejs`: Responsive CSS Grid cards layout and alternate list table layout.
  - `public/css/custom.css`: Micro-interactions, hover card elevations, custom badges, and smooth transitions.
- **Verification:** Resize browser window from mobile (375px) to tablet (768px) and desktop (1200px) to verify fluid grid collapse.

---

### Task 4: Advanced JavaScript & Dynamic DOM Manipulation
- **Requirements:** Complex form validation, password strength indicator, dynamic DOM manipulation, dynamic task cards, search, filter, sort, delete confirmation, real-time UI updates without unnecessary page reloads.
- **Implementation:**
  - `public/js/validation.js`: Real-time password strength meter calculating entropy across length, uppercase, lowercase, numbers, and symbols with color-coded progress bars.
  - `public/js/tasks-client.js`: Live search filtering DOM nodes instantly on `input` events, status dropdown updates via async `fetch(PUT /api/tasks/:id)`, and modal-based asynchronous delete operations with DOM element removal.
- **Verification:** On `/tasks`, type keywords into the search bar to see task cards filter in real time without refreshing the page.

---

### Task 5: Complete RESTful CRUD API
- **Requirements:** `POST /api/tasks`, `GET /api/tasks`, `GET /api/tasks/:id`, `PUT /api/tasks/:id`, `DELETE /api/tasks/:id`. Proper HTTP status codes, JSON responses, error handling, and frontend fetch/AJAX integration.
- **Implementation:**
  - `controllers/taskController.ts`: Complete controller methods for all 5 HTTP endpoints.
  - `routes/taskRoutes.ts`: RESTful router mapping endpoints.
  - HTTP Status Codes: `200 OK` (reads/updates/deletions), `201 Created` (creations), `400 Bad Request` (validation failures), `401 Unauthorized` (missing/expired token), `403 Forbidden` (user isolation violation), `404 Not Found`.
- **Verification:** Run `npm test` or execute curl commands against `/api/tasks`.

---

### Task 6: MongoDB, User/Task Models, bcrypt & JWT Authentication
- **Requirements:** MongoDB integration, User and Task models. User: name, email, password, createdAt. Task: title, description, priority, status, category, deadline, userId, createdAt, updatedAt. Registration, bcrypt password hashing, login, JWT authentication, logout, auth middleware, protected routes, and authorization. Users can only access and modify their own tasks. Never store plain-text passwords.
- **Implementation:**
  - `models/User.ts`: Mongoose schema with pre-save bcrypt hash hook and comparison helper.
  - `models/Task.ts`: Mongoose schema with userId index and compound status/priority indexes.
  - `services/authService.ts`: JWT generation (`HS256`, 7d expiration) and verification.
  - `middleware/authMiddleware.ts`: `requireAuth` middleware enforcing valid token and populating `req.user`.
  - `services/taskService.ts`: Enforces `task.userId === userId` on all mutations and reads.
- **Verification:** Log in with `demo@taskflow.dev` / `Password123!`. View user profile on `/profile`. Tasks created are strictly isolated to this user.

---

### Task 7: Real External Weather API & Security Architecture
- **Requirements:** Integrate real external Weather API through the backend. `GET /api/weather`. Show weather info on dashboard (city, temperature, condition, humidity, wind speed). Server-side secrets via dotenv. Timeout/error handling, loading/error states, rate limiting, and documented OAuth architecture.
- **Implementation:**
  - `services/weatherService.ts`: Real Open-Meteo REST integration with 5-second timeout guard using `AbortController`.
  - `controllers/weatherController.ts`: `GET /api/weather` endpoint with rate limiting (`weatherRateLimiter`) and 15m Redis caching.
  - `views/pages/weather.ejs` & `views/pages/dashboard.ejs`: Displays city, temperature (°C & °F), condition, humidity, wind speed, and icon.
  - `docs/architecture.md`: Full architectural specification of OAuth 2.0 PKCE flow.
- **Verification:** Visit `/weather` or search any city (e.g., Tokyo, London, Paris) to view live meteorological data.

---

### Task 8: Advanced Server Functionality (Redis, BullMQ, Middleware)
- **Requirements:** Express middleware, request logging, centralized error handling, rate limiting, Redis caching (check Redis first on `GET /api/tasks`, cache result on miss), cache invalidation on task create/update/delete, BullMQ/Redis background jobs, asynchronous processing, and performance optimization.
- **Implementation:**
  - `config/redis.ts`: High-performance Redis client with seamless in-memory fallback.
  - `services/cacheService.ts`: Cache-aside methods and pattern invalidation (`tasks:${userId}:*`).
  - `services/taskService.ts`: Checks Redis cache first on `getTasksForUser`, sets response header `X-Cache-Status: HIT/MISS`, and invalidates cache on `createTask`, `updateTask`, `deleteTask`.
  - `jobs/taskQueue.ts`: BullMQ queue for background tasks (`GENERATE_SUMMARY_REPORT`, `TASK_DUE_REMINDER`, `EXPORT_TASKS_CSV`).
  - `middleware/loggerMiddleware.ts`: Custom request logger with execution duration.
  - `middleware/rateLimitMiddleware.ts`: Window-based rate limiting.
  - `middleware/errorHandler.ts`: Centralized error handler.
- **Verification:** Make consecutive calls to `GET /api/tasks` and observe `X-Cache-Status: MISS` followed by `X-Cache-Status: HIT`. Trigger background jobs from the dashboard.
