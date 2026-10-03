# Cognifyz Internship: Exact Screenshot Capture Guide (Tasks 1–8)

Use this guide to capture the exact screenshots required for your internship submission report.

---

### Screenshot 1: Landing Page & EJS Form Rendering (Task 1)
- **URL to open:** `http://localhost:3000/` and `http://localhost:3000/register`
- **What to show in the screenshot:**
  - The TaskFlow landing page with the hero section, "Cognifyz Full Stack Development Internship Project" badge, and Call to Action buttons.
  - The clean registration form rendered via EJS on `/register`.
- **Caption for report:** *"Figure 1: Task 1 – Semantic HTML5 Landing Page & EJS Server-Side Rendered Registration Form."*

---

### Screenshot 2: Client & Server-Side Input Validation (Task 2)
- **URL to open:** `http://localhost:3000/register`
- **What to show in the screenshot:**
  - Type a weak password (e.g. `abc`) into the Password input to display the **Password Strength: Weak** red progress bar and criteria checklist.
  - Attempt to submit an empty form to show the red validation highlights and error messages.
- **Caption for report:** *"Figure 2: Task 2 – Multi-tier Validation with Real-Time Password Strength Meter & Error Handling."*

---

### Screenshot 3: Modern Responsive UI, Cards & Dashboard (Task 3)
- **URL to open:** `http://localhost:3000/dashboard`
- **What to show in the screenshot:**
  - The full dashboard layout showing:
    - Navbar and Sidebar navigation.
    - 4 Core Statistics cards: **Total Tasks**, **Completed Tasks**, **Pending Tasks**, and **High / Urgent Priority**.
    - The Work Breakdown / Completion Progress bar.
    - The Recent Tasks table.
- **Caption for report:** *"Figure 3: Task 3 – Responsive Dashboard with Statistical Cards, Progress Meters, and Responsive Layout."*

---

### Screenshot 4: Advanced JavaScript, Real-Time DOM & Delete Modal (Task 4)
- **URL to open:** `http://localhost:3000/tasks`
- **What to show in the screenshot:**
  - Type a search query into the search input to demonstrate live instant filtering of cards without page reloads.
  - Click on the trash icon on any task card to display the **Delete Confirmation Modal**.
- **Caption for report:** *"Figure 4: Task 4 – Client-Side DOM Search Filtering and Asynchronous Delete Confirmation Dialog."*

---

### Screenshot 5: Complete RESTful CRUD API (Task 5)
- **Tool to use:** Browser Developer Tools (Network Tab) or Postman / curl
- **What to show in the screenshot:**
  - An inspection of `GET /api/tasks` returning `200 OK` with JSON payload.
  - A `POST /api/tasks` returning `201 Created` with the newly created task object.
- **Caption for report:** *"Figure 5: Task 5 – RESTful API CRUD Endpoints with Standard HTTP Status Codes and JSON Responses."*

---

### Screenshot 6: MongoDB Persistence, bcrypt Hashing & JWT Authorization (Task 6)
- **URL to open:** `http://localhost:3000/profile`
- **What to show in the screenshot:**
  - The User Profile page displaying the MongoDB `_id`, authenticated email, and the **Task 6 Security Compliance** checklist (bcrypt 10 salt rounds, JWT session token, and task data isolation).
- **Caption for report:** *"Figure 6: Task 6 – MongoDB Document Persistence, Salted bcrypt Password Hashing, and JWT Authorization."*

---

### Screenshot 7: External Weather API Live Integration (Task 7)
- **URL to open:** `http://localhost:3000/weather`
- **What to show in the screenshot:**
  - The live weather card displaying city name, temperature in °C and °F, weather condition, humidity, wind speed, and the **OAuth 2.0 Architectural Specification** section below.
- **Caption for report:** *"Figure 7: Task 7 – Live Backend Integration with External Open-Meteo Weather API and OAuth Architecture."*

---

### Screenshot 8: Redis Caching & BullMQ Background Queue (Task 8)
- **URL to open:** `http://localhost:3000/dashboard` and Developer Tools Network Tab
- **What to show in the screenshot:**
  - The **Background Jobs Queue** panel on the dashboard showing completed jobs (`GENERATE_SUMMARY_REPORT` or `TASK_DUE_REMINDER`).
  - In Network headers for `GET /api/tasks`, show the response header `X-Cache-Status: HIT` demonstrating Redis caching.
- **Caption for report:** *"Figure 8: Task 8 – Redis Cache-Aside Acceleration (HIT/MISS) and BullMQ Asynchronous Job Processing."*
