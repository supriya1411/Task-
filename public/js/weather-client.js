/**
 * TaskFlow Weather Client (Task 7)
 */

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('weatherSearchForm');
  const cityInput = document.getElementById('weatherCityInput');
  const spinner = document.getElementById('weatherSpinner');
  const btnText = document.getElementById('searchBtnText');
  const submitBtn = document.getElementById('searchWeatherBtn');

  // Display elements
  const displayCity = document.getElementById('displayCity');
  const displayCountry = document.getElementById('displayCountry');
  const displayCondition = document.getElementById('displayCondition');
  const displayIcon = document.getElementById('displayIcon');
  const displayTemp = document.getElementById('displayTemp');
  const displayTempF = document.getElementById('displayTempF');
  const displayHumidity = document.getElementById('displayHumidity');
  const displayWind = document.getElementById('displayWind');
  const displayCache = document.getElementById('displayCache');
  const displayWmo = document.getElementById('displayWmo');
  const sourceBadge = document.getElementById('weatherSourceBadge');

  async function fetchWeather(city) {
    if (!city || city.trim() === '') return;

    if (spinner && btnText && submitBtn) {
      spinner.classList.remove('d-none');
      btnText.textContent = 'Querying...';
      submitBtn.disabled = true;
    }

    try {
      const response = await fetch(`/api/weather?city=${encodeURIComponent(city.trim())}`);
      const data = await response.json();

      if (response.ok && data.success && data.data) {
        const w = data.data;

        if (displayCity) displayCity.textContent = w.city;
        if (displayCountry) displayCountry.textContent = w.country || '';
        if (displayCondition) displayCondition.textContent = w.condition;
        if (displayIcon) displayIcon.textContent = w.icon;
        if (displayTemp) displayTemp.textContent = `${w.temperature}°C`;
        if (displayTempF) displayTempF.textContent = `(${w.temperatureF}°F)`;
        if (displayHumidity) displayHumidity.textContent = `${w.humidity}%`;
        if (displayWind) displayWind.textContent = `${w.windSpeed} km/h`;
        if (displayWmo) displayWmo.textContent = w.weatherCode;
        if (sourceBadge) sourceBadge.textContent = w.source;

        if (displayCache) {
          if (w.cached) {
            displayCache.className = 'badge bg-success text-white';
            displayCache.textContent = 'Redis HIT';
          } else {
            displayCache.className = 'badge bg-secondary text-white';
            displayCache.textContent = 'API MISS';
          }
        }

        if (window.showToast) {
          window.showToast(`Retrieved live weather for ${w.city}. Cache: ${w.cached ? 'HIT' : 'MISS'}`);
        }
      } else {
        alert(data.message || 'Unable to retrieve weather for the specified city.');
      }
    } catch (err) {
      console.error('Weather fetch error:', err);
      alert('Network timeout or error connecting to weather service.');
    } finally {
      if (spinner && btnText && submitBtn) {
        spinner.classList.add('d-none');
        btnText.textContent = 'Fetch Weather';
        submitBtn.disabled = false;
      }
    }
  }

  if (form && cityInput) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      fetchWeather(cityInput.value);
    });
  }

  // Preset chips
  document.querySelectorAll('.city-chip').forEach((chip) => {
    chip.addEventListener('click', function () {
      const city = this.getAttribute('data-city');
      if (cityInput) cityInput.value = city;
      fetchWeather(city);
    });
  });
});
