# TaskFlow – Full Stack Task Management System
### Cognifyz Full Stack Development Internship Submission

[![Cognifyz Internship](https://img.shields.io/badge/Cognifyz-Full%20Stack%20Internship-blue.svg)](https://cognifyz.com)
[![Tasks 1-8](https://img.shields.io/badge/Tasks%201--8-100%25%20Completed-success.svg)](#features-mapping-tasks-18)
[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey.svg)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-brightgreen.svg)](https://www.mongodb.com)
[![Redis](https://img.shields.io/badge/Redis-Cache%20%26%20BullMQ-red.svg)](https://redis.io)

TaskFlow is a production-ready, full stack task management and analytics application built for the **Cognifyz Full Stack Development Internship**. All 8 internship tasks are progressively integrated into a single, cohesive, fully runnable project with zero placeholder code or mock buttons.

---

## 📋 Features Mapping (Tasks 1–8)

| Task | Module | Core Implementation | Key Files |
|---|---|---|---|
| **Task 1** | HTML & EJS Forms | Express server, semantic HTML5 forms, POST handling, modular EJS templates | `server.ts`, `views/pages/*`, `routes/pageRoutes.ts` |
| **Task 2** | Client/Server Validation | Required fields, email regex, phone validation, password strength scoring | `middleware/validationMiddleware.ts`, `public/js/validation.js` |
| **Task 3** | Responsive Bootstrap UI | Navbar, sidebar, dashboard statistics, cards, progress bars, responsive grid | `views/pages/dashboard.ejs`, `public/css/custom.css` |
| **Task 4** | Advanced JavaScript | Real-time DOM search filtering, multi-filter, sort, delete confirmation modal | `public/js/tasks-client.js`, `views/pages/tasks.ejs` |
| **Task 5** | RESTful CRUD API | Complete endpoints: GET, POST, PUT, DELETE `/api/tasks` with HTTP status codes | `controllers/taskController.ts`, `routes/taskRoutes.ts` |
| **Task 6** | MongoDB & JWT Auth | Mongoose User & Task models, bcrypt 10 salt rounds, JWT cookies/headers, RBAC | `models/User.ts`, `models/Task.ts`, `services/authService.ts` |
| **Task 7** | External Weather API | Backend proxy for Open-Meteo, 5s timeout guard, rate limiting, OAuth spec | `services/weatherService.ts`, `views/pages/weather.ejs` |
| **Task 8** | Redis & BullMQ Queue | Cache-Aside pattern on tasks, automatic invalidation, BullMQ background jobs | `config/redis.ts`, `services/cacheService.ts`, `jobs/taskQueue.ts` |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** v18 or higher (v20+ recommended)
- **npm** (comes with Node.js)
- *(Optional)* Local MongoDB or MongoDB Atlas connection string
- *(Optional)* Local Redis or Upstash/Redis Cloud URL
  > **Note:** If MongoDB or Redis is not running locally, TaskFlow includes an **automatic in-memory database and cache fallback** so the entire application starts and functions immediately out of the box with zero crashes!

### 2. Installation
Clone or extract the repository and install all dependencies:
```bash
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Edit `.env` to configure your settings (or use the defaults):
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/taskflow
JWT_SECRET=taskflow_cognifyz_secret_jwt_key_2026_secure
JWT_EXPIRES_IN=7d
REDIS_URL=redis://127.0.0.1:6379
CACHE_TTL_SECONDS=180
WEATHER_DEFAULT_CITY=New York
```

### 4. Running the Application
Start the development server:
```bash
npm run dev
```
Open your browser and navigate to:
```
http://localhost:3000
```

### 5. Running the Automated Test Suite
Verify that all 8 tasks pass their functional requirements:
```bash
npm test
```

---

## 👤 Default Demo Credentials
To quickly explore the dashboard with pre-seeded tasks:
- **Email:** `demo@taskflow.dev`
- **Password:** `Password123!`

*(You can also register your own account on `/register` with full validation).*

---

## 🗄️ Database & Cache Setup Guide

### MongoDB Setup (Task 6)
- **Option A (Local MongoDB):**
  Ensure MongoDB service is running:
  ```bash
  mongod --dbpath /data/db
  ```
  Set `MONGODB_URI=mongodb://127.0.0.1:27017/taskflow` in `.env`.
- **Option B (MongoDB Atlas Cloud):**
  1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
  2. Under Database Access, create a database user.
  3. Under Network Access, allow IP `0.0.0.0/0`.
  4. Paste connection string into `.env`:
     `MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/taskflow?retryWrites=true&w=majority`
- **Option C (Zero Setup):**
  Leave `MONGODB_URI` blank to use the built-in in-memory repository.

### Redis Setup (Task 8)
- **Option A (Local Redis):**
  ```bash
  redis-server
  ```
  Set `REDIS_URL=redis://127.0.0.1:6379` in `.env`.
- **Option B (Upstash / Redis Cloud):**
  Create a free cloud instance on [Upstash](https://upstash.com) or [Redis.com](https://redis.com) and paste the `rediss://...` URL into `.env`.
- **Option C (Zero Setup):**
  Leave `REDIS_URL` blank to run the built-in in-memory cache and async worker engine.

---

## 📡 API Reference Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new account with bcrypt hashing & JWT token |
| `POST` | `/api/auth/login` | Authenticate user & issue JWT cookie/token |
| `GET` | `/api/auth/me` | Current authenticated user profile |
| `GET` | `/api/tasks` | Get all tasks (Cached in Redis; header `X-Cache-Status`) |
| `POST` | `/api/tasks` | Create task & invalidate Redis cache |
| `GET` | `/api/tasks/:id` | Get single task by ID (Enforces user isolation) |
| `PUT` | `/api/tasks/:id` | Update task & invalidate Redis cache |
| `DELETE` | `/api/tasks/:id` | Delete task & invalidate Redis cache |
| `GET` | `/api/weather` | Live meteorological data (Open-Meteo, 15m cache) |
| `POST` | `/api/jobs` | Trigger BullMQ background job (report, reminder, export) |

For comprehensive payload schemas, see [`docs/api.md`](docs/api.md).

---

## 📁 Project Structure

```
├── config/                  # Database and Redis configurations
│   ├── db.ts               # MongoDB Mongoose connection with memory fallback
│   └── redis.ts            # Redis client with in-memory cache fallback
├── controllers/             # Express controllers for routes
│   ├── authController.ts   # Registration, login, session handlers
│   ├── taskController.ts   # RESTful CRUD operations
│   ├── weatherController.ts# External weather API proxy
│   ├── jobController.ts    # BullMQ background job triggers
│   └── pageController.ts   # EJS server-rendered page views
├── docs/                    # Internship documentation & evidence guides
│   ├── api.md              # Complete REST API specifications
│   ├── architecture.md     # System architecture & diagrams
│   ├── tasks-1-8.md        # Syllabus mapping for all 8 tasks
│   ├── internship-report.md# Formal internship submission report
│   └── screenshots-checklist.md # Exact screenshot capture instructions
├── jobs/                    # BullMQ and asynchronous workers
│   └── taskQueue.ts        # Background job queue and worker logic
├── middleware/              # Express middlewares
│   ├── authMiddleware.ts   # JWT verification & route protection
│   ├── validationMiddleware.ts # Input validation for auth and tasks
│   ├── loggerMiddleware.ts # HTTP request logger with response time
│   ├── rateLimitMiddleware.ts # Endpoint rate limiters
│   └── errorHandler.ts     # Centralized error handling
├── models/                  # Data models
│   ├── User.ts             # Mongoose User schema with bcrypt hooks
│   └── Task.ts             # Mongoose Task schema with compound indexes
├── public/                  # Static assets
│   ├── css/custom.css      # Custom styling, badges, transitions
│   └── js/                 # Client scripts
│       ├── validation.js   # Client validation & password strength meter
│       ├── tasks-client.js # Live DOM search, filter, sort & delete modal
│       ├── weather-client.js # Async weather search & widget updates
│       └── dashboard-client.js # Dashboard interactions & job triggers
├── routes/                  # Express route definitions
│   ├── authRoutes.ts
│   ├── taskRoutes.ts
│   ├── weatherRoutes.ts
│   ├── jobRoutes.ts
│   └── pageRoutes.ts
├── services/                # Business logic services
│   ├── authService.ts      # Authentication & token operations
│   ├── taskService.ts      # Task CRUD & Redis caching integration
│   ├── cacheService.ts     # Redis cache-aside & invalidation logic
│   └── weatherService.ts   # Open-Meteo API integration with timeout
├── tests/
│   └── api.test.ts         # Automated test suite for Tasks 1–8
├── views/                   # EJS templates
│   ├── pages/              # Landing, register, login, dashboard, tasks, etc.
│   └── partials/           # Reusable head, navbar, sidebar, footer, alerts
├── .env.example             # Documented environment variables template
├── package.json             # Scripts and dependencies
├── server.ts                # Application entry point
└── README.md                # Project documentation
```

---

## 📦 What to Include in Final Internship ZIP

When preparing your submission ZIP file for Cognifyz:
1. **Include all application source code:**
   - `config/`, `controllers/`, `jobs/`, `middleware/`, `models/`, `public/`, `routes/`, `services/`, `views/`, `tests/`, `docs/`
   - `server.ts`, `package.json`, `tsconfig.json`, `.env.example`, `README.md`
2. **Exclude:**
   - `node_modules/` (The evaluator runs `npm install`)
   - `.env` (Include `.env.example` instead with your template variables)
3. **Include your completed Report & Screenshots:**
   - Use [`docs/internship-report.md`](docs/internship-report.md) as the content for your report.
   - Follow [`docs/screenshots-checklist.md`](docs/screenshots-checklist.md) to capture and embed all 8 screenshots.

---

## ⚖️ License
Created for Cognifyz Full Stack Development Internship. Open-source educational project.
