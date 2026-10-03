/**
 * TaskFlow Interactive Dashboard Engine
 * Implements real-time AJAX tasks management, instant filtering, weather controls, and background workers
 */

document.addEventListener('DOMContentLoaded', function () {
  // Global dashboard state
  let currentFilter = 'all'; // 'all' | 'Pending' | 'In Progress' | 'Completed' | 'Urgent' | category
  let currentSearchQuery = '';
  let isFahrenheit = false;
  let cachedTempC = null;
  let cachedTempF = null;

  // Retrieve token from window, sessionStorage, or URL query
  function getActiveToken() {
    if (window.__TASKFLOW_TOKEN__) return window.__TASKFLOW_TOKEN__;
    try {
      const fromSession = sessionStorage.getItem('taskflow_token');
      if (fromSession) return fromSession;
    } catch (e) {}
    try {
      const fromUrl = new URLSearchParams(window.location.search).get('token');
      if (fromUrl) {
        try { sessionStorage.setItem('taskflow_token', fromUrl); } catch (e) {}
        return fromUrl;
      }
    } catch (e) {}
    return null;
  }

  function getAuthHeaders(extra = {}) {
    const token = getActiveToken();
    const headers = { ...extra };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  // Preserve token on internal navigation links for iframe/mobile cookie resilience
  const activeToken = getActiveToken();
  if (activeToken) {
    document.querySelectorAll('a[href^="/"]').forEach((link) => {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('/api/auth/logout') && !href.includes('token=')) {
        const sep = href.includes('?') ? '&' : '?';
        link.setAttribute('href', `${href}${sep}token=${encodeURIComponent(activeToken)}`);
      }
    });
  }

  // Cache initial temperature values from DOM
  const tempEl = document.getElementById('dashWeatherTemp');
  if (tempEl) {
    const rawC = parseFloat(tempEl.textContent);
    if (!isNaN(rawC)) {
      cachedTempC = rawC;
      cachedTempF = Math.round((rawC * 9) / 5 + 32);
    }
  }

  // =========================================================================
  // 1. STATS RE-CALCULATOR HELPER
  // =========================================================================
  function recalculateStats() {
    const rows = document.querySelectorAll('#dashTasksTbody tr:not(#emptyTasksRow)');
    let total = rows.length;
    let completed = 0;
    let inProgress = 0;
    let pending = 0;
    let urgent = 0;

    rows.forEach((row) => {
      const status = row.getAttribute('data-status');
      const priority = row.getAttribute('data-priority');

      if (status === 'Completed') completed++;
      else if (status === 'In Progress') inProgress++;
      else pending++;

      if (priority === 'Urgent' || priority === 'High') urgent++;
    });

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Update DOM counters
    const totalEl = document.getElementById('statTotalVal');
    const compEl = document.getElementById('statCompletedVal');
    const pendEl = document.getElementById('statPendingVal');
    const inProgEl = document.getElementById('statInProgressVal');
    const urgEl = document.getElementById('statUrgentVal');
    const compRateEl = document.getElementById('statCompletionRateVal');
    const progBadge = document.getElementById('dashProgressBadge');
    const progBar = document.getElementById('dashProgressBar');

    if (totalEl) totalEl.textContent = total;
    if (compEl) compEl.textContent = completed;
    if (pendEl) pendEl.textContent = pending + inProgress;
    if (inProgEl) inProgEl.textContent = inProgress;
    if (urgEl) urgEl.textContent = urgent;
    if (compRateEl) compRateEl.textContent = `${completionRate}%`;
    if (progBadge) progBadge.textContent = `${completionRate}% Complete`;
    if (progBar) {
      progBar.style.width = `${completionRate}%`;
      progBar.setAttribute('aria-valuenow', completionRate);
    }

    applyFilters();
  }

  // =========================================================================
  // 2. LIVE FILTERING & SEARCH ENGINE
  // =========================================================================
  function applyFilters() {
    const rows = document.querySelectorAll('#dashTasksTbody tr:not(#emptyTasksRow)');
    let visibleCount = 0;

    rows.forEach((row) => {
      const status = row.getAttribute('data-status');
      const priority = row.getAttribute('data-priority');
      const category = row.getAttribute('data-category');
      const title = row.getAttribute('data-title') || '';

      let matchesFilter = true;

      if (currentFilter === 'all') {
        matchesFilter = true;
      } else if (currentFilter === 'Completed') {
        matchesFilter = status === 'Completed';
      } else if (currentFilter === 'Pending') {
        // Pending card represents all uncompleted work (both Pending & In Progress)
        matchesFilter = status === 'Pending' || status === 'In Progress';
      } else if (currentFilter === 'In Progress') {
        matchesFilter = status === 'In Progress';
      } else if (currentFilter === 'Urgent') {
        matchesFilter = priority === 'Urgent' || priority === 'High';
      } else {
        // Category filter
        matchesFilter = category === currentFilter;
      }

      // Check search query
      const matchesSearch =
        !currentSearchQuery ||
        title.includes(currentSearchQuery.toLowerCase()) ||
        (category && category.toLowerCase().includes(currentSearchQuery.toLowerCase()));

      if (matchesFilter && matchesSearch) {
        row.style.display = '';
        visibleCount++;
      } else {
        row.style.display = 'none';
      }
    });

    const visibleBadge = document.getElementById('visibleTasksCount');
    if (visibleBadge) visibleBadge.textContent = visibleCount;

    const emptyRow = document.getElementById('emptyTasksRow');
    if (emptyRow) {
      emptyRow.style.display = rows.length === 0 ? '' : 'none';
    }

    const indicator = document.getElementById('filterStatusIndicator');
    if (indicator) {
      if (currentFilter === 'all' && !currentSearchQuery) {
        indicator.innerHTML = `<span class="badge bg-primary-subtle text-primary border me-1">Total Tasks</span> Showing all tasks (${visibleCount} tasks)`;
      } else if (currentFilter === 'Pending') {
        indicator.innerHTML = `<span class="badge bg-warning-subtle text-dark border me-1">Pending Tasks</span> Showing pending & in-progress tasks (${visibleCount} tasks)`;
      } else if (currentFilter === 'Completed') {
        indicator.innerHTML = `<span class="badge bg-success-subtle text-success border me-1">Completed Tasks</span> Showing completed tasks (${visibleCount} tasks)`;
      } else if (currentFilter === 'Urgent') {
        indicator.innerHTML = `<span class="badge bg-danger-subtle text-danger border me-1">High / Urgent</span> Showing urgent priority tasks (${visibleCount} tasks)`;
      } else if (currentSearchQuery) {
        indicator.textContent = `Search results for "${currentSearchQuery}" (${visibleCount} found)`;
      } else {
        indicator.textContent = `Filtered by category: ${currentFilter} (${visibleCount} visible)`;
      }
    }
  }

  // Stat Card click to filter
  function handleFilterSelection(filter, scrollToTable = true) {
    currentFilter = filter;

    // Update active card styling
    document.querySelectorAll('.stat-filter-card').forEach((c) => {
      c.classList.remove('border-2', 'border-primary', 'border-success', 'border-warning', 'border-danger', 'shadow-sm', 'active');
      c.classList.add('border-0');
    });

    const activeCard = document.querySelector(`.stat-filter-card[data-filter="${filter}"]`);
    if (activeCard) {
      activeCard.classList.remove('border-0');
      activeCard.classList.add('border-2', 'shadow-sm', 'active');
      if (filter === 'all') activeCard.classList.add('border-primary');
      else if (filter === 'Completed') activeCard.classList.add('border-success');
      else if (filter === 'Pending') activeCard.classList.add('border-warning');
      else if (filter === 'Urgent') activeCard.classList.add('border-danger');
    }

    // Sync with tab pills
    document.querySelectorAll('.dash-filter-tab').forEach((tab) => {
      if (tab.getAttribute('data-tab') === filter) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    applyFilters();

    // Feedback notification & smooth scroll down to tasks table
    if (scrollToTable) {
      const workspace = document.getElementById('tasksWorkspaceCard');
      if (workspace) {
        workspace.scrollIntoView({ behavior: 'smooth', block: 'start' });
        workspace.classList.add('border', 'border-primary', 'shadow');
        setTimeout(() => workspace.classList.remove('border', 'border-primary', 'shadow'), 1200);
      }

      if (window.showToast) {
        if (filter === 'all') window.showToast('Showing all registered tasks in workspace');
        else if (filter === 'Pending') window.showToast('Showing pending & in-progress tasks');
        else if (filter === 'Completed') window.showToast('Showing completed tasks');
        else if (filter === 'Urgent') window.showToast('Showing high & urgent priority tasks');
      }
    }
  }

  // Bind click on entire stat cards and internal action buttons
  document.querySelectorAll('.stat-filter-card').forEach((card) => {
    card.addEventListener('click', function (e) {
      // If user clicked the "Page ->" link, allow normal navigation to /tasks
      if (e.target.closest('a')) return;

      const filter = this.getAttribute('data-filter') || 'all';
      handleFilterSelection(filter, true);
    });
  });

  document.querySelectorAll('.stat-card-action-btn').forEach((btn) => {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      const filter = this.getAttribute('data-filter') || 'all';
      handleFilterSelection(filter, true);
    });
  });

  // Tab pills click to filter
  document.querySelectorAll('.dash-filter-tab').forEach((tab) => {
    tab.addEventListener('click', function () {
      const tabValue = this.getAttribute('data-tab') || 'all';
      handleFilterSelection(tabValue, false);
    });
  });

  // Category chip click to filter
  document.querySelectorAll('.category-filter-chip').forEach((chip) => {
    chip.addEventListener('click', function () {
      const category = this.getAttribute('data-category');
      currentFilter = category;

      document.querySelectorAll('.category-filter-chip').forEach((c) => c.classList.remove('border-primary', 'bg-primary-subtle'));
      this.classList.add('border-primary', 'bg-primary-subtle');

      const clearBtn = document.getElementById('clearCategoryFilterBtn');
      if (clearBtn) clearBtn.classList.remove('d-none');

      applyFilters();
    });
  });

  // Clear Category filter
  document.getElementById('clearCategoryFilterBtn')?.addEventListener('click', function () {
    currentFilter = 'all';
    this.classList.add('d-none');
    document.querySelectorAll('.category-filter-chip').forEach((c) => c.classList.remove('border-primary', 'bg-primary-subtle'));
    document.querySelector('.dash-filter-tab[data-tab="all"]')?.classList.add('active');
    applyFilters();
  });

  // In-table search input
  const searchInput = document.getElementById('dashTaskSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      currentSearchQuery = this.value.trim();
      applyFilters();
    });
  }

  // =========================================================================
  // 3. INLINE QUICK TASK CREATOR (INSTANT AJAX)
  // =========================================================================
  const quickTaskForm = document.getElementById('dashQuickTaskForm');
  const quickTitleInput = document.getElementById('dashQuickTitle');
  const quickPriorityInput = document.getElementById('dashQuickPriority');
  const quickCategoryInput = document.getElementById('dashQuickCategory');
  const quickSubmitBtn = document.getElementById('dashQuickSubmitBtn');

  if (quickTaskForm && quickTitleInput) {
    quickTaskForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const title = quickTitleInput.value.trim();
      const priority = quickPriorityInput?.value || 'Medium';
      const category = quickCategoryInput?.value || 'Work';

      if (title.length < 3) {
        quickTitleInput.classList.add('is-invalid');
        return;
      }
      quickTitleInput.classList.remove('is-invalid');

      if (quickSubmitBtn) {
        quickSubmitBtn.disabled = true;
        quickSubmitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Adding...';
      }

      try {
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: getAuthHeaders({
            'Content-Type': 'application/json',
            Accept: 'application/json',
          }),
          body: JSON.stringify({
            title,
            priority,
            category,
            status: 'Pending',
          }),
        });

        const data = await response.json();

        if (response.ok && data.success && data.data) {
          const newTask = data.data;

          // Remove empty row if present
          const emptyRow = document.getElementById('emptyTasksRow');
          if (emptyRow) emptyRow.remove();

          // Create new table row
          const tbody = document.getElementById('dashTasksTbody');
          if (tbody) {
            const tr = document.createElement('tr');
            tr.id = `task-row-${newTask._id}`;
            tr.setAttribute('data-task-id', newTask._id);
            tr.setAttribute('data-status', newTask.status);
            tr.setAttribute('data-priority', newTask.priority);
            tr.setAttribute('data-category', newTask.category);
            tr.setAttribute('data-title', newTask.title.toLowerCase());
            tr.className = 'table-success transition-all';

            const badgeClass =
              newTask.priority === 'Urgent'
                ? 'badge bg-danger-subtle text-danger border border-danger-subtle'
                : newTask.priority === 'High'
                ? 'badge bg-danger text-white'
                : newTask.priority === 'Medium'
                ? 'badge bg-warning-subtle text-dark border border-warning-subtle'
                : 'badge bg-secondary-subtle text-secondary';

            const tokenParam = activeToken ? `?token=${encodeURIComponent(activeToken)}` : '';

            tr.innerHTML = `
              <td>
                <button type="button" class="btn btn-xs p-0 border-0 text-secondary toggle-done-btn" data-id="${newTask._id}" data-status="Pending" title="Toggle Done">
                  <i class="bi bi-circle fs-5"></i>
                </button>
              </td>
              <td>
                <div class="fw-semibold text-dark text-truncate task-row-title" style="max-width: 220px;">${escapeHtml(newTask.title)}</div>
                <div class="text-muted fs-8">Just added</div>
              </td>
              <td>
                <span class="${badgeClass}">${newTask.priority}</span>
              </td>
              <td>
                <select class="form-select form-select-xs border-0 bg-light py-0 px-2 rounded status-dropdown" data-id="${newTask._id}" style="font-size: 0.75rem; width: auto;">
                  <option value="Pending" selected>Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </td>
              <td>
                <span class="badge bg-light text-dark border">${escapeHtml(newTask.category)}</span>
              </td>
              <td class="text-end">
                <div class="btn-group btn-group-sm">
                  <a href="/tasks/${newTask._id}/edit${tokenParam}" class="btn btn-xs btn-outline-secondary py-1 px-2" title="Edit">
                    <i class="bi bi-pencil"></i>
                  </a>
                  <button type="button" class="btn btn-xs btn-outline-danger py-1 px-2 delete-task-btn" data-id="${newTask._id}" title="Delete">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </td>
            `;

            tbody.prepend(tr);

            // Bind events for the newly inserted row
            bindRowEvents(tr);

            // Smoothly remove success background after 1.5 seconds
            setTimeout(() => {
              tr.classList.remove('table-success');
            }, 1500);
          }

          quickTitleInput.value = '';
          if (window.showToast) {
            window.showToast(`Task "${newTask.title}" added to your workspace!`);
          }

          recalculateStats();
        } else {
          alert(data.message || 'Could not create task.');
        }
      } catch (err) {
        console.error('Quick task error:', err);
      } finally {
        if (quickSubmitBtn) {
          quickSubmitBtn.disabled = false;
          quickSubmitBtn.innerHTML = '<i class="bi bi-plus-lg"></i> Instant Add';
        }
      }
    });
  }

  // =========================================================================
  // 4. IN-TABLE INTERACTIVE ACTIONS (TOGGLE DONE, STATUS DROPDOWN, DELETE)
  // =========================================================================
  function bindRowEvents(row) {
    // 1. Toggle Done Button
    const doneBtn = row.querySelector('.toggle-done-btn');
    if (doneBtn) {
      doneBtn.addEventListener('click', async function () {
        const taskId = this.getAttribute('data-id');
        const currentStatus = row.getAttribute('data-status');
        const nextStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';

        await updateTaskStatus(row, taskId, nextStatus);
      });
    }

    // 2. Status Dropdown
    const statusSelect = row.querySelector('.status-dropdown');
    if (statusSelect) {
      statusSelect.addEventListener('change', async function () {
        const taskId = this.getAttribute('data-id');
        const nextStatus = this.value;
        await updateTaskStatus(row, taskId, nextStatus);
      });
    }

    // 3. Delete Button
    const delBtn = row.querySelector('.delete-task-btn');
    if (delBtn) {
      delBtn.addEventListener('click', async function () {
        const taskId = this.getAttribute('data-id');
        if (!confirm('Are you sure you want to delete this task?')) return;

        try {
          const res = await fetch(`/api/tasks/${taskId}`, {
            method: 'DELETE',
            headers: getAuthHeaders({ Accept: 'application/json' }),
          });

          if (res.ok) {
            row.style.transition = 'all 0.3s ease';
            row.style.opacity = '0';
            row.style.transform = 'translateX(20px)';
            setTimeout(() => {
              row.remove();
              recalculateStats();
              if (window.showToast) {
                window.showToast('Task removed from workspace.');
              }
            }, 300);
          } else {
            alert('Failed to delete task.');
          }
        } catch (e) {
          console.error('Delete error:', e);
        }
      });
    }
  }

  async function updateTaskStatus(row, taskId, newStatus) {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: getAuthHeaders({
          'Content-Type': 'application/json',
          Accept: 'application/json',
        }),
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        row.setAttribute('data-status', newStatus);

        // Update title strike-through
        const titleEl = row.querySelector('.task-row-title');
        if (titleEl) {
          if (newStatus === 'Completed') {
            titleEl.classList.add('text-decoration-line-through', 'text-muted');
          } else {
            titleEl.classList.remove('text-decoration-line-through', 'text-muted');
          }
        }

        // Update toggle button icon & color
        const doneBtn = row.querySelector('.toggle-done-btn');
        if (doneBtn) {
          doneBtn.setAttribute('data-status', newStatus);
          if (newStatus === 'Completed') {
            doneBtn.className = 'btn btn-xs p-0 border-0 text-success toggle-done-btn';
            doneBtn.innerHTML = '<i class="bi bi-check-circle-fill fs-5"></i>';
          } else {
            doneBtn.className = 'btn btn-xs p-0 border-0 text-secondary toggle-done-btn';
            doneBtn.innerHTML = '<i class="bi bi-circle fs-5"></i>';
          }
        }

        // Update select element if present
        const selectEl = row.querySelector('.status-dropdown');
        if (selectEl && selectEl.value !== newStatus) {
          selectEl.value = newStatus;
        }

        // Recalculate top statistics
        recalculateStats();

        if (window.showToast) {
          window.showToast(`Task status updated to "${newStatus}"`);
        }
      }
    } catch (err) {
      console.error('Status update error:', err);
    }
  }

  // Bind existing rows on initial page load
  document.querySelectorAll('#dashTasksTbody tr:not(#emptyTasksRow)').forEach(bindRowEvents);

  // =========================================================================
  // 5. INTERACTIVE WEATHER WIDGET (CITY CHIPS, AJAX, UNIT TOGGLE)
  // =========================================================================
  async function fetchAndUpdateWeather(city) {
    if (!city) return;

    const cacheBadge = document.getElementById('weatherCacheBadge');
    if (cacheBadge) {
      cacheBadge.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Fetching...';
    }

    try {
      const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`, {
        headers: getAuthHeaders({ Accept: 'application/json' }),
      });
      const data = await response.json();

      if (response.ok && data.success && data.data) {
        const w = data.data;
        cachedTempC = w.temperature;
        cachedTempF = w.temperatureF;

        const cityEl = document.getElementById('dashWeatherCity');
        const countryEl = document.getElementById('dashWeatherCountry');
        const condEl = document.getElementById('dashWeatherCond');
        const iconEl = document.getElementById('dashWeatherIcon');
        const tempEl = document.getElementById('dashWeatherTemp');
        const tempFEl = document.getElementById('dashWeatherTempF');
        const humEl = document.getElementById('dashWeatherHumidity');
        const windEl = document.getElementById('dashWeatherWind');

        if (cityEl) cityEl.textContent = w.city;
        if (countryEl) countryEl.textContent = w.country || '';
        if (condEl) condEl.textContent = w.condition;
        if (iconEl) iconEl.textContent = w.icon;

        if (tempEl && tempFEl) {
          if (isFahrenheit) {
            tempEl.textContent = `${w.temperatureF}°F`;
            tempFEl.textContent = `(${w.temperature}°C)`;
          } else {
            tempEl.textContent = `${w.temperature}°C`;
            tempFEl.textContent = `(${w.temperatureF}°F)`;
          }
        }

        if (humEl) humEl.textContent = `${w.humidity}%`;
        if (windEl) windEl.textContent = `${w.windSpeed} km/h`;

        if (cacheBadge) {
          cacheBadge.className =
            'position-absolute top-0 end-0 mt-2 me-2 badge border fs-8 ' +
            (w.cached
              ? 'bg-success-subtle text-success border-success-subtle'
              : 'bg-info-subtle text-info border-info-subtle');
          cacheBadge.innerHTML = `<i class="bi bi-lightning-charge"></i> ${w.cached ? 'Redis Cache HIT' : 'Live API Fresh'}`;
        }

        if (window.showToast) {
          window.showToast(`Weather updated to ${w.city} (${w.temperature}°C). ${w.cached ? 'Cache HIT' : 'Live fetch'}`);
        }
      }
    } catch (e) {
      console.error('Weather fetch error:', e);
    }
  }

  // 1-Click Popular City Chips
  document.querySelectorAll('.city-chip').forEach((chip) => {
    chip.addEventListener('click', function () {
      document.querySelectorAll('.city-chip').forEach((c) => c.classList.remove('btn-primary', 'text-white'));
      this.classList.add('btn-primary', 'text-white');

      const city = this.getAttribute('data-city');
      fetchAndUpdateWeather(city);
    });
  });

  // Custom city fetch button & Enter key
  const quickCityInput = document.getElementById('quickCityInput');
  const quickCityBtn = document.getElementById('quickCityBtn');
  if (quickCityBtn && quickCityInput) {
    const handleCityFetch = () => {
      const city = quickCityInput.value.trim();
      if (city) {
        document.querySelectorAll('.city-chip').forEach((c) => c.classList.remove('btn-primary', 'text-white'));
        fetchAndUpdateWeather(city);
        quickCityInput.value = '';
      }
    };

    quickCityBtn.addEventListener('click', handleCityFetch);
    quickCityInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleCityFetch();
      }
    });
  }

  // Temperature unit toggle (°C <=> °F)
  document.getElementById('tempUnitToggleBtn')?.addEventListener('click', function () {
    isFahrenheit = !isFahrenheit;
    const tempEl = document.getElementById('dashWeatherTemp');
    const tempFEl = document.getElementById('dashWeatherTempF');

    if (tempEl && tempFEl && cachedTempC !== null) {
      if (isFahrenheit) {
        tempEl.textContent = `${cachedTempF}°F`;
        tempFEl.textContent = `(${cachedTempC}°C)`;
        this.textContent = 'Units: °F';
      } else {
        tempEl.textContent = `${cachedTempC}°C`;
        tempFEl.textContent = `(${cachedTempF}°F)`;
        this.textContent = 'Units: °C';
      }
    }
  });

  // =========================================================================
  // 6. INTERACTIVE BACKGROUND JOBS CONSOLE (Task 8)
  // =========================================================================
  document.querySelectorAll('.trigger-job-btn').forEach((btn) => {
    btn.addEventListener('click', async function () {
      const jobType = this.getAttribute('data-job');
      const originalText = this.innerHTML;

      this.disabled = true;
      this.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Dispatching...';

      try {
        const response = await fetch('/api/jobs', {
          method: 'POST',
          headers: getAuthHeaders({
            'Content-Type': 'application/json',
            Accept: 'application/json',
          }),
          body: JSON.stringify({ type: jobType }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          const job = data.data.job;

          if (window.showToast) {
            window.showToast(`Worker dispatched job #${job.id.substring(0, 14)}...`);
          }

          const list = document.getElementById('jobHistoryList');
          const noJobsMsg = document.getElementById('noJobsMsg');
          if (noJobsMsg) noJobsMsg.remove();

          if (list) {
            const item = document.createElement('div');
            item.className = 'p-2 border rounded-3 bg-light shadow-xs transition-all';
            item.innerHTML = `
              <div class="d-flex justify-content-between align-items-center mb-1">
                <span class="fw-semibold small text-dark">${job.name}</span>
                <span class="badge bg-primary-subtle text-primary" id="status-${job.id}">
                  <span class="spinner-border spinner-border-sm me-1" style="width: 10px; height: 10px;"></span> processing
                </span>
              </div>
              <div class="progress mb-1" style="height: 4px;">
                <div class="progress-bar progress-bar-striped progress-bar-animated bg-primary" id="prog-${job.id}" style="width: 40%;"></div>
              </div>
              <div class="fs-8 text-muted font-monospace">${job.id}</div>
              <div class="fs-8 text-secondary mt-1" id="msg-${job.id}">Asynchronous execution underway...</div>
            `;
            list.prepend(item);

            // Animate progress and poll for completion
            setTimeout(() => {
              const prog = document.getElementById(`prog-${job.id}`);
              if (prog) prog.style.width = '80%';
            }, 600);

            setTimeout(async () => {
              try {
                const pollRes = await fetch(`/api/jobs/${job.id}`, {
                  headers: getAuthHeaders({ Accept: 'application/json' }),
                });
                const pollData = await pollRes.json();
                const statusEl = document.getElementById(`status-${job.id}`);
                const msgEl = document.getElementById(`msg-${job.id}`);
                const prog = document.getElementById(`prog-${job.id}`);

                if (prog) {
                  prog.style.width = '100%';
                  prog.className = 'progress-bar bg-success';
                }

                if (statusEl) {
                  statusEl.className = 'badge bg-success-subtle text-success';
                  statusEl.textContent = 'completed';
                }

                if (msgEl) {
                  msgEl.textContent = pollData.data?.job?.result?.message || 'Job executed successfully by background worker.';
                }

                const badge = document.getElementById('jobCountBadge');
                if (badge) {
                  const currentCount = list.children.length;
                  badge.textContent = `${currentCount} Jobs`;
                }
              } catch (e) {
                console.warn('Poll error:', e);
              }
            }, 1400);
          }
        }
      } catch (err) {
        console.error('Job error:', err);
      } finally {
        this.disabled = false;
        this.innerHTML = originalText;
      }
    });
  });

  // Clear background jobs console
  document.getElementById('clearJobsBtn')?.addEventListener('click', function () {
    const list = document.getElementById('jobHistoryList');
    if (list) {
      list.innerHTML = `
        <div class="text-center py-4 text-muted small" id="noJobsMsg">
          History cleared. Tap any button above to dispatch a background worker!
        </div>
      `;
    }
    const badge = document.getElementById('jobCountBadge');
    if (badge) badge.textContent = '0 Jobs';
  });

  // Helper function to escape HTML
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
