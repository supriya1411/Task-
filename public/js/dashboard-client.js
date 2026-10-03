/**
 * TaskFlow Dashboard Client Interactions (Task 7 & Task 8)
 */

document.addEventListener('DOMContentLoaded', function () {
  // 1. Quick Weather City Switcher on Dashboard
  const quickCityInput = document.getElementById('quickCityInput');
  const quickCityBtn = document.getElementById('quickCityBtn');

  if (quickCityBtn && quickCityInput) {
    quickCityBtn.addEventListener('click', async function () {
      const city = quickCityInput.value.trim();
      if (!city) return;

      quickCityBtn.disabled = true;
      quickCityBtn.textContent = '...';

      try {
        const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
        const data = await response.json();

        if (response.ok && data.success && data.data) {
          const w = data.data;
          const cityEl = document.getElementById('dashWeatherCity');
          const condEl = document.getElementById('dashWeatherCond');
          const iconEl = document.getElementById('dashWeatherIcon');
          const tempEl = document.getElementById('dashWeatherTemp');
          const tempFEl = document.getElementById('dashWeatherTempF');
          const humEl = document.getElementById('dashWeatherHumidity');
          const windEl = document.getElementById('dashWeatherWind');

          if (cityEl) cityEl.textContent = w.city;
          if (condEl) condEl.textContent = w.condition;
          if (iconEl) iconEl.textContent = w.icon;
          if (tempEl) tempEl.textContent = `${w.temperature}°C`;
          if (tempFEl) tempFEl.textContent = `(${w.temperatureF}°F)`;
          if (humEl) humEl.textContent = `${w.humidity}%`;
          if (windEl) windEl.textContent = `${w.windSpeed} km/h`;

          if (window.showToast) {
            window.showToast(`Dashboard weather updated to ${w.city}. Cache: ${w.cached ? 'HIT' : 'MISS'}`);
          }
          quickCityInput.value = '';
        } else {
          alert('Could not locate weather data for that city.');
        }
      } catch (err) {
        console.error('Quick city fetch error:', err);
      } finally {
        quickCityBtn.disabled = false;
        quickCityBtn.textContent = 'Update';
      }
    });
  }

  // 2. Trigger BullMQ / Async Background Jobs (Task 8)
  document.querySelectorAll('.trigger-job-btn').forEach((btn) => {
    btn.addEventListener('click', async function () {
      const jobType = this.getAttribute('data-job');

      try {
        const response = await fetch('/api/jobs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ type: jobType }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          const job = data.data.job;
          if (window.showToast) {
            window.showToast(`Background Job #${job.id} dispatched successfully to queue.`);
          }

          // Prepend to job history in UI
          const list = document.getElementById('jobHistoryList');
          const noJobsMsg = document.getElementById('noJobsMsg');
          if (noJobsMsg) noJobsMsg.remove();

          if (list) {
            const item = document.createElement('div');
            item.className = 'p-2 border rounded-3 bg-light';
            item.innerHTML = `
              <div class="d-flex justify-content-between align-items-center mb-1">
                <span class="fw-semibold small text-dark">${job.name}</span>
                <span class="badge bg-primary-subtle text-primary" id="status-${job.id}">processing</span>
              </div>
              <div class="fs-8 text-muted font-monospace">${job.id}</div>
              <div class="fs-8 text-secondary mt-1" id="msg-${job.id}">Asynchronous execution in progress...</div>
            `;
            list.prepend(item);

            // Poll for job completion after 1.5 seconds
            setTimeout(async () => {
              try {
                const pollRes = await fetch(`/api/jobs/${job.id}`);
                const pollData = await pollRes.json();
                if (pollRes.ok && pollData.data?.job) {
                  const updated = pollData.data.job;
                  const statusEl = document.getElementById(`status-${job.id}`);
                  const msgEl = document.getElementById(`msg-${job.id}`);
                  if (statusEl) {
                    statusEl.className = 'badge bg-success-subtle text-success';
                    statusEl.textContent = 'completed';
                  }
                  if (msgEl && updated.result?.message) {
                    msgEl.textContent = updated.result.message;
                  }
                }
              } catch (e) {
                console.warn('Poll error:', e);
              }
            }, 1800);
          }
        } else {
          alert('Could not trigger background job: ' + (data.message || 'Error'));
        }
      } catch (err) {
        console.error('Job trigger error:', err);
      }
    });
  });
});
