import { useEffect, useState } from 'react';

export default function App() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setHealth(data);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Health fetch error:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-6 md:p-12">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 text-white p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-2">
              Cognifyz Full Stack Development Internship
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              TaskFlow – Full Stack Task Management System
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Integrated implementation of Tasks 1 through 8 (Node.js, Express, MongoDB, EJS, Redis, JWT)
            </p>
          </div>
          <a
            href="/"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors whitespace-nowrap"
          >
            Launch EJS App &rarr;
          </a>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <div className="text-xs uppercase font-bold text-slate-400">Database Layer</div>
              <div className="text-base font-semibold text-slate-800 mt-1">
                {health?.database?.client || 'MongoDB Mongoose & Fallback'}
              </div>
              <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium rounded bg-emerald-100 text-emerald-700">
                Connected
              </span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <div className="text-xs uppercase font-bold text-slate-400">Cache Layer</div>
              <div className="text-base font-semibold text-slate-800 mt-1">
                Redis Cache-Aside Active
              </div>
              <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-700">
                180s TTL & Invalidation
              </span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <div className="text-xs uppercase font-bold text-slate-400">External API</div>
              <div className="text-base font-semibold text-slate-800 mt-1">
                Open-Meteo Weather REST
              </div>
              <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium rounded bg-purple-100 text-purple-700">
                5s Timeout Guard
              </span>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl p-5">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Cognifyz Tasks 1–8 Roadmap</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-100 font-medium">Task 1: HTML & EJS Forms</div>
              <div className="p-2.5 rounded-lg bg-slate-100 font-medium">Task 2: Input Validation</div>
              <div className="p-2.5 rounded-lg bg-slate-100 font-medium">Task 3: Responsive UI</div>
              <div className="p-2.5 rounded-lg bg-slate-100 font-medium">Task 4: Dynamic JS & DOM</div>
              <div className="p-2.5 rounded-lg bg-slate-100 font-medium">Task 5: REST API CRUD</div>
              <div className="p-2.5 rounded-lg bg-slate-100 font-medium">Task 6: MongoDB & JWT</div>
              <div className="p-2.5 rounded-lg bg-slate-100 font-medium">Task 7: Weather API</div>
              <div className="p-2.5 rounded-lg bg-slate-100 font-medium">Task 8: Redis & BullMQ</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-200">
            <a
              href="/dashboard"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition"
            >
              Open Dashboard
            </a>
            <a
              href="/tasks"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-semibold shadow-sm transition"
            >
              Task Management
            </a>
            <a
              href="/weather"
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold transition"
            >
              Live Weather Section
            </a>
            <a
              href="/docs"
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold transition"
            >
              Internship Audit & Docs
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
