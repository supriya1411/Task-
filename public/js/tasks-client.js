/**
 * TaskFlow Tasks Client - Advanced DOM Manipulation & REST CRUD (Task 4 & Task 5)
 */

document.addEventListener('DOMContentLoaded', function () {
  const searchInput = document.getElementById('taskSearchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const filterStatus = document.getElementById('filterStatus');
  const filterPriority = document.getElementById('filterPriority');
  const filterCategory = document.getElementById('filterCategory');
  const sortBySelect = document.getElementById('sortBySelect');

  const viewCardsBtn = document.getElementById('viewCardsBtn');
  const viewTableBtn = document.getElementById('viewTableBtn');
  const cardsContainer = document.getElementById('tasksCardsContainer');
  const tableContainer = document.getElementById('tasksTableContainer');
  const emptyState = document.getElementById('tasksEmptyState');
  const totalBadge = document.getElementById('taskTotalBadge');

  let taskToDeleteId = null;
  let deleteModal = null;
  const deleteModalEl = document.getElementById('deleteConfirmModal');
  if (deleteModalEl && typeof bootstrap !== 'undefined') {
    deleteModal = new bootstrap.Modal(deleteModalEl);
  }

  // 1. Switch between Cards and Table Views
  if (viewCardsBtn && viewTableBtn && cardsContainer && tableContainer) {
    viewCardsBtn.addEventListener('click', function () {
      viewCardsBtn.classList.add('active');
      viewTableBtn.classList.remove('active');
      cardsContainer.classList.remove('d-none');
      tableContainer.classList.add('d-none');
    });

    viewTableBtn.addEventListener('click', function () {
      viewTableBtn.classList.add('active');
      viewCardsBtn.classList.remove('active');
      tableContainer.classList.remove('d-none');
      cardsContainer.classList.add('d-none');
    });
  }

  // 2. Real-Time Client-Side Filter & Search (Task 4)
  function applyFilters() {
    const q = (searchInput?.value || '').trim().toLowerCase();
    const statusVal = filterStatus?.value || 'all';
    const priorityVal = filterPriority?.value || 'all';
    const categoryVal = filterCategory?.value || 'all';

    const cardItems = document.querySelectorAll('.task-card-item');
    const tableRows = document.querySelectorAll('.task-table-row');

    let visibleCount = 0;

    // Filter Cards
    cardItems.forEach((item) => {
      const title = item.getAttribute('data-title') || '';
      const status = item.getAttribute('data-status') || '';
      const priority = item.getAttribute('data-priority') || '';
      const category = item.getAttribute('data-category') || '';

      const matchQ = !q || title.includes(q);
      const matchStatus = statusVal === 'all' || status === statusVal;
      const matchPriority = priorityVal === 'all' || priority === priorityVal;
      const matchCategory = categoryVal === 'all' || category === categoryVal;

      if (matchQ && matchStatus && matchPriority && matchCategory) {
        item.classList.remove('d-none');
        visibleCount++;
      } else {
        item.classList.add('d-none');
      }
    });

    // Filter Table Rows
    tableRows.forEach((row) => {
      const title = row.getAttribute('data-title') || '';
      const status = row.getAttribute('data-status') || '';
      const priority = row.getAttribute('data-priority') || '';
      const category = row.getAttribute('data-category') || '';

      const matchQ = !q || title.includes(q);
      const matchStatus = statusVal === 'all' || status === statusVal;
      const matchPriority = priorityVal === 'all' || priority === priorityVal;
      const matchCategory = categoryVal === 'all' || category === categoryVal;

      if (matchQ && matchStatus && matchPriority && matchCategory) {
        row.classList.remove('d-none');
      } else {
        row.classList.add('d-none');
      }
    });

    // Update total counter and empty state
    if (totalBadge) {
      totalBadge.textContent = `${visibleCount} Tasks`;
    }

    if (emptyState) {
      if (visibleCount === 0) {
        emptyState.classList.remove('d-none');
      } else {
        emptyState.classList.add('d-none');
      }
    }
  }

  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', function () {
      if (searchInput) {
        searchInput.value = '';
        applyFilters();
      }
    });
  }
  if (filterStatus) filterStatus.addEventListener('change', applyFilters);
  if (filterPriority) filterPriority.addEventListener('change', applyFilters);
  if (filterCategory) filterCategory.addEventListener('change', applyFilters);

  // 3. Sorting handler
  if (sortBySelect) {
    sortBySelect.addEventListener('change', function () {
      const val = sortBySelect.value;
      const url = new URL(window.location.href);
      url.searchParams.set('sortBy', val);
      window.location.href = url.toString();
    });
  }

  // 4. AJAX Status Update via PUT /api/tasks/:id (Task 5)
  document.querySelectorAll('.task-status-toggle').forEach((selectEl) => {
    selectEl.addEventListener('change', async function () {
      const taskId = this.getAttribute('data-id');
      const newStatus = this.value;

      try {
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // Update data attributes in DOM
          const card = document.querySelector(`.task-card-item[data-id="${taskId}"]`);
          const row = document.querySelector(`.task-table-row[data-id="${taskId}"]`);
          if (card) card.setAttribute('data-status', newStatus);
          if (row) row.setAttribute('data-status', newStatus);

          // Synchronize both dropdowns (cards and table)
          document.querySelectorAll(`.task-status-toggle[data-id="${taskId}"]`).forEach((s) => {
            s.value = newStatus;
          });

          if (window.showToast) {
            window.showToast(`Task status updated to "${newStatus}" & Redis cache invalidated.`);
          }
        } else {
          alert('Could not update task status: ' + (data.message || 'Error'));
        }
      } catch (err) {
        console.error('AJAX status update error:', err);
      }
    });
  });

  // 5. Delete Confirmation Modal & AJAX DELETE /api/tasks/:id (Task 4 & Task 5)
  document.querySelectorAll('.delete-task-btn').forEach((btn) => {
    btn.addEventListener('click', function () {
      taskToDeleteId = this.getAttribute('data-id');
      const taskTitle = this.getAttribute('data-title') || 'Selected Task';

      const previewEl = document.getElementById('deleteTaskTitlePreview');
      if (previewEl) previewEl.textContent = taskTitle;

      if (deleteModal) {
        deleteModal.show();
      }
    });
  });

  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', async function () {
      if (!taskToDeleteId) return;

      const originalHtml = confirmDeleteBtn.innerHTML;
      confirmDeleteBtn.disabled = true;
      confirmDeleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Deleting...';

      try {
        const response = await fetch(`/api/tasks/${taskToDeleteId}`, {
          method: 'DELETE',
          headers: {
            Accept: 'application/json',
          },
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // Remove elements from DOM dynamically without page reload
          const cardEl = document.querySelector(`.task-card-item[data-id="${taskToDeleteId}"]`);
          const rowEl = document.querySelector(`.task-table-row[data-id="${taskToDeleteId}"]`);

          if (cardEl) cardEl.remove();
          if (rowEl) rowEl.remove();

          if (deleteModal) deleteModal.hide();

          if (window.showToast) {
            window.showToast('Task deleted successfully via REST API.');
          }

          applyFilters();
        } else {
          alert('Failed to delete task: ' + (data.message || 'Unknown error'));
        }
      } catch (err) {
        console.error('Delete request failed:', err);
        alert('Network error while deleting task.');
      } finally {
        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.innerHTML = originalHtml;
        taskToDeleteId = null;
      }
    });
  }
});
