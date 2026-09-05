/* ============================================================
   WEATHER APP — UI Rendering Layer
   ============================================================ */

const UI = (() => {

  /* ──────────────────────────────────────────
     REFERENCES (cached on init)
     ────────────────────────────────────────── */
  let refs = {};

  function cacheRefs() {
    refs = {
      body: document.body,
      html: document.documentElement,
      heroCard: document.getElementById('hero-card'),
      pincodeInfoSection: document.getElementById('pincode-info-section'),
      detailsGrid: document.getElementById('details-grid'),
      hourlyScroll: document.getElementById('hourly-scroll'),
      dailyList: document.getElementById('daily-list'),
      aqiCard: document.getElementById('aqi-card'),
      mapContainer: document.getElementById('map-container'),
      savedList: document.getElementById('saved-list'),
      alertsSection: document.getElementById('alerts-section'),
      toastContainer: document.getElementById('toast-container'),
      searchInput: document.getElementById('search-input'),
      autocompleteDropdown: document.getElementById('autocomplete-dropdown'),
      unitCelsius: document.getElementById('unit-celsius'),
      unitFahrenheit: document.getElementById('unit-fahrenheit'),
      themeToggle: document.getElementById('theme-toggle'),
      settingsBtn: document.getElementById('settings-btn'),
      settingsModalBackdrop: document.getElementById('settings-modal-backdrop'),
      settingsModal: document.getElementById('settings-modal'),
      settingsCloseBtn: document.getElementById('settings-close-btn'),
      settingsSaveBtn: document.getElementById('settings-save-btn'),
      settingsCancelBtn: document.getElementById('settings-cancel-btn'),
      settingsResetDefaultsBtn: document.getElementById('setting-reset-defaults-btn'),
      settingClearSavedBtn: document.getElementById('setting-clear-saved-btn'),
      settingUnitTemp: document.getElementById('setting-unit-temp'),
      settingUnitWind: document.getElementById('setting-unit-wind'),
      settingUnitPressure: document.getElementById('setting-unit-pressure'),
      settingUnitPrecip: document.getElementById('setting-unit-precip'),
      settingTheme: document.getElementById('setting-theme'),
      settingToggleAnimations: document.getElementById('setting-toggle-animations'),
      settingToggleAlerts: document.getElementById('setting-toggle-alerts'),
      soundToggle: document.getElementById('sound-toggle'),
      settingToggleSound: document.getElementById('setting-toggle-sound'),
      settingToggleAudioCue: document.getElementById('setting-toggle-audio-cue'),
      settingSoundVolume: document.getElementById('setting-sound-volume'),
      settingVolumeValue: document.getElementById('setting-volume-value'),
      settingDefaultLocationMode: document.getElementById('setting-default-location-mode'),
      settingCustomCityWrapper: document.getElementById('setting-custom-city-wrapper'),
      settingCustomDefaultCity: document.getElementById('setting-custom-default-city'),
      settingDataMode: document.getElementById('setting-data-mode'),
      savedLocationsCount: document.getElementById('saved-locations-count'),
      mainContent: document.getElementById('main-content'),
    };
  }

  /* ──────────────────────────────────────────
     THEME
     ────────────────────────────────────────── */

  function setTheme(theme) {
    let activeTheme = theme;
    if (theme === 'auto') {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      activeTheme = prefersDark ? 'dark' : 'light';
    }
    refs.html.setAttribute('data-theme', activeTheme);
    const themeIcon = refs.themeToggle;
    if (themeIcon) {
      themeIcon.innerHTML = activeTheme === 'dark'
        ? Utils.getIcon('sun-theme', 20)
        : Utils.getIcon('moon', 20);
      themeIcon.setAttribute('aria-label', activeTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }
  }

  /* ──────────────────────────────────────────
     UNIT TOGGLE
     ────────────────────────────────────────── */

  function setUnit(unit) {
    if (refs.unitCelsius && refs.unitFahrenheit) {
      refs.unitCelsius.classList.toggle('active', unit === 'C');
      refs.unitFahrenheit.classList.toggle('active', unit === 'F');
    }
  }

  /* ──────────────────────────────────────────
     WEATHER BACKGROUND
     ────────────────────────────────────────── */

  function setWeatherBackground(condition, isDay) {
    const bg = Utils.getWeatherBackground(condition, isDay);
    refs.html.setAttribute('data-weather', bg);
  }

  /* ──────────────────────────────────────────
     HERO CARD
     ────────────────────────────────────────── */

  function renderHero(data, unit) {
    const { current, city, country, pincode, exactPlace, district } = data;
    const isSaved = Storage.isLocationSaved(city);
    const prefs = Storage.getPreferences();
    const formattedWind = Utils.formatWindSpeed(current.windSpeed, prefs.windUnit);

    // Display title
    const mainTitle = exactPlace || city;

    refs.heroCard.innerHTML = `
      <button class="hero-save-btn ${isSaved ? 'saved' : ''}"
              id="hero-save-btn"
              aria-label="${isSaved ? 'Remove from saved locations' : 'Save location'}"
              title="${isSaved ? 'Remove from saved' : 'Save location'}">
        ${isSaved ? Utils.getIcon('star', 18) : Utils.getIcon('star-outline', 18)}
      </button>

      <div class="hero-header-badges">
        <span class="hero-live-badge">
          <span class="live-dot"></span> LIVE FORECAST
        </span>
        ${pincode ? `<span class="hero-pincode-tag">📮 PIN: ${pincode}</span>` : ''}
      </div>

      <div class="hero-main-content">
        <div class="hero-info">
          <div class="hero-location">
            <h1 class="hero-city">${mainTitle}</h1>
            <span class="hero-country">• ${district ? district + ', ' : (data.state ? data.state + ', ' : '')}${country}</span>
          </div>
          <div class="hero-datetime">🗓️ ${Utils.formatFullDateTime(current.lastUpdated)}</div>

          <div class="hero-temp-row">
            <div class="hero-temp temp-value">${Utils.formatTemp(current.temp, unit)}</div>
            <div class="hero-temp-details">
              <div class="hero-condition">${current.condition}</div>
              <div class="hero-feels-like">Feels like <strong>${Utils.formatTemp(current.feelsLike, unit)}</strong></div>
              <div class="hero-high-low">
                <span class="hl-high">↑ H: ${Utils.formatTemp(current.high, unit)}</span>
                <span class="hl-low">↓ L: ${Utils.formatTemp(current.low, unit)}</span>
              </div>
            </div>
          </div>

          <!-- Embedded Quick Stats Pill Bar -->
          <div class="hero-quick-stats">
            <div class="hero-stat-pill">
              <span class="stat-icon">💧</span>
              <span class="stat-label">Humidity</span>
              <span class="stat-val">${current.humidity}%</span>
            </div>
            <div class="hero-stat-pill">
              <span class="stat-icon">💨</span>
              <span class="stat-label">Wind</span>
              <span class="stat-val">${formattedWind}</span>
            </div>
            <div class="hero-stat-pill">
              <span class="stat-icon">☀️</span>
              <span class="stat-label">UV Index</span>
              <span class="stat-val">${current.uvIndex}</span>
            </div>
            <div class="hero-stat-pill">
              <span class="stat-icon">🌧️</span>
              <span class="stat-label">Rain</span>
              <span class="stat-val">${current.rainChance}%</span>
            </div>
          </div>
        </div>

        <div class="hero-visual">
          <div class="hero-weather-aura" aria-hidden="true"></div>
          <div class="hero-weather-icon anim-float">
            ${Utils.getWeatherIcon(current.condition, current.isDay, 180, 'weather-icon-main')}
          </div>
          <div class="hero-description">${current.description}</div>
        </div>
      </div>
    `;
    refs.heroCard.classList.add('anim-fade-in-up');
  }

  /* ──────────────────────────────────────────
     INDIAN POSTAL DETAILS CARD
     ────────────────────────────────────────── */

  function renderPincodeInfo(data) {
    if (!refs.pincodeInfoSection) return;
    const { pincode, exactPlace, district, state, country, postOffices } = data;

    if (!pincode) {
      refs.pincodeInfoSection.style.display = 'none';
      refs.pincodeInfoSection.innerHTML = '';
      return;
    }

    refs.pincodeInfoSection.style.display = 'block';
    const placeName = exactPlace || data.city;
    const poTags = (postOffices && postOffices.length > 0)
      ? postOffices.map(po => `<span class="po-chip">📮 ${po}</span>`).join('')
      : `<span class="po-chip">📮 ${placeName}</span>`;

    refs.pincodeInfoSection.innerHTML = `
      <div class="pincode-info-card glass anim-fade-in-up">
        <div class="pincode-info-header">
          <div class="pincode-info-title">
            <span class="pincode-flag">🇮🇳</span>
            <span>Indian Postal Location Details</span>
          </div>
          <span class="pincode-highlight">PIN CODE: ${pincode}</span>
        </div>
        <div class="pincode-info-grid">
          <div class="pincode-info-item">
            <div class="pincode-info-label">📍 Exact Place / Area Name</div>
            <div class="pincode-info-value">${placeName}</div>
          </div>
          <div class="pincode-info-item">
            <div class="pincode-info-label">🏛️ District / Division</div>
            <div class="pincode-info-value">${district || 'Central District'}</div>
          </div>
          <div class="pincode-info-item">
            <div class="pincode-info-label">🗺️ State & Country</div>
            <div class="pincode-info-value">${state ? state + ', ' : ''}${country || 'India'}</div>
          </div>
        </div>
        ${postOffices && postOffices.length > 0 ? `
          <div class="pincode-po-list">
            <div class="pincode-info-label">📫 Post Offices / Sub-Areas Covered Under PIN ${pincode}:</div>
            <div class="po-chips-container">${poTags}</div>
          </div>
        ` : ''}
      </div>
    `;
  }

  /* ──────────────────────────────────────────
     DETAILS GRID
     ────────────────────────────────────────── */

  function renderDetails(data, unit) {
    const { current } = data;
    const prefs = Storage.getPreferences();
    const uvInfo = Utils.getUVLevel(current.uvIndex);
    const windDir = Utils.getWindDirection(current.windDeg);
    const formattedWind = Utils.formatWindSpeed(current.windSpeed, prefs.windUnit);
    const formattedPressure = Utils.formatPressure(current.pressure, prefs.pressureUnit);

    const details = [
      {
        icon: 'humidity',
        label: 'Humidity',
        value: `${current.humidity}%`,
        extra: `Dew point: ${Utils.formatTemp(current.dewPoint, unit)}`,
        progress: current.humidity,
        barColor: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
      },
      {
        icon: 'wind',
        label: 'Wind Speed',
        value: formattedWind,
        extra: `Direction: ${windDir} (${current.windDeg}°)`,
        progress: Math.min(100, (current.windSpeed / 60) * 100),
        barColor: 'linear-gradient(90deg, #10b981, #34d399)',
      },
      {
        icon: 'pressure',
        label: 'Pressure',
        value: formattedPressure,
        extra: current.pressure > 1013 ? 'High pressure' : 'Normal / Low',
        progress: Math.min(100, Math.max(0, ((current.pressure - 970) / 70) * 100)),
        barColor: 'linear-gradient(90deg, #a855f7, #c084fc)',
      },
      {
        icon: 'visibility',
        label: 'Visibility',
        value: `${current.visibility} km`,
        extra: current.visibility >= 10 ? 'Excellent clarity' : current.visibility >= 5 ? 'Good clarity' : 'Poor visibility',
        progress: Math.min(100, (current.visibility / 10) * 100),
        barColor: 'linear-gradient(90deg, #06b6d4, #22d3ee)',
      },
      {
        icon: 'uv',
        label: 'UV Index',
        value: current.uvIndex,
        extra: `<span style="color: ${uvInfo.color}">${uvInfo.label} Risk</span>`,
        progress: Math.min(100, (current.uvIndex / 11) * 100),
        barColor: `linear-gradient(90deg, ${uvInfo.color}, #f59e0b)`,
      },
      {
        icon: 'precipitation',
        label: 'Rain Chance',
        value: `${current.rainChance}%`,
        extra: current.rainChance > 50 ? 'Carry an umbrella ☔' : 'Low precipitation',
        progress: current.rainChance,
        barColor: 'linear-gradient(90deg, #3b82f6, #818cf8)',
      },
      {
        icon: 'sunrise',
        label: 'Sunrise',
        value: Utils.formatTime(current.sunrise),
        extra: 'Morning dawn',
        progress: 100,
        barColor: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
      },
      {
        icon: 'sunset',
        label: 'Sunset',
        value: Utils.formatTime(current.sunset),
        extra: 'Evening dusk',
        progress: 100,
        barColor: 'linear-gradient(90deg, #f97316, #ef4444)',
      },
    ];

    refs.detailsGrid.innerHTML = details.map((d, i) => `
      <div class="detail-card glass" style="animation-delay: ${i * 40}ms">
        <div class="detail-card-header">
          <div class="detail-card-icon-wrap">${Utils.getIcon(d.icon, 20)}</div>
          <div class="detail-card-label">${d.label}</div>
        </div>
        <div class="detail-card-value">${d.value}</div>
        <div class="detail-card-bar">
          <div class="detail-bar-fill" style="width: ${d.progress}%; background: ${d.barColor}"></div>
        </div>
        <div class="detail-card-extra">${d.extra}</div>
      </div>
    `).join('');

    refs.detailsGrid.classList.add('stagger-children');
  }

  /* ──────────────────────────────────────────
     HOURLY FORECAST
     ────────────────────────────────────────── */

  function renderHourly(data, unit) {
    const hourly = data.hourly.slice(0, 24);

    refs.hourlyScroll.innerHTML = hourly.map((h, i) => `
      <div class="hourly-card ${i === 0 ? 'current' : ''}" style="animation-delay: ${i * 30}ms">
        <div class="hourly-time">${i === 0 ? 'Now' : Utils.formatTimeShort(h.time)}</div>
        <div class="hourly-icon">${Utils.getWeatherIcon(h.condition, h.isDay, 32)}</div>
        <div class="hourly-temp">${Utils.formatTemp(h.temp, unit)}</div>
        ${h.rainChance > 10 ? `<div class="hourly-rain">💧 ${h.rainChance}%</div>` : ''}
      </div>
    `).join('');
  }

  /* ──────────────────────────────────────────
     DAILY FORECAST
     ────────────────────────────────────────── */

  function renderDaily(data, unit) {
    const daily = data.daily;

    // Calculate global min/max for temperature bar
    const allLows = daily.map((d) => d.low);
    const allHighs = daily.map((d) => d.high);
    const globalMin = Math.min(...allLows);
    const globalMax = Math.max(...allHighs);
    const tempRange = globalMax - globalMin || 1;

    refs.dailyList.innerHTML = `
      <div class="daily-card-wrapper">
        ${daily.map((d, i) => {
          const leftPct = ((d.low - globalMin) / tempRange) * 100;
          const widthPct = ((d.high - d.low) / tempRange) * 100;
          return `
            <div class="daily-row" style="animation-delay: ${i * 60}ms">
              <div class="daily-day">${Utils.formatDay(d.date)}</div>
              <div class="daily-icon">${Utils.getWeatherIcon(d.condition, true, 28)}</div>
              <div class="daily-condition">${d.condition}</div>
              <div class="daily-rain">${d.rainChance > 0 ? `💧${d.rainChance}%` : ''}</div>
              <div class="daily-temp-bar">
                <div class="daily-temp-bar-fill progress-bar-fill"
                     style="left: ${leftPct}%; width: ${widthPct}%; animation-delay: ${i * 100 + 300}ms"></div>
              </div>
              <div class="daily-low">${Utils.formatTempValue(d.low, unit)}°</div>
              <div class="daily-high">${Utils.formatTempValue(d.high, unit)}°</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  /* ──────────────────────────────────────────
     AIR QUALITY
     ────────────────────────────────────────── */

  function renderAQI(data) {
    const { airQuality } = data;
    if (!airQuality) {
      refs.aqiCard.innerHTML = '<div class="empty-state">Air quality data not available</div>';
      return;
    }

    const aqiInfo = Utils.getAQILevel(airQuality.aqi);
    const circumference = 2 * Math.PI * 32;
    const fillPct = Math.min(airQuality.aqi / 300, 1);
    const dashOffset = circumference * (1 - fillPct);

    refs.aqiCard.innerHTML = `
      <div class="aqi-card">
        <div class="aqi-header">
          <div>
            <div class="aqi-value" style="color: ${aqiInfo.color}">${airQuality.aqi}</div>
            <div class="aqi-label" style="color: ${aqiInfo.color}">${aqiInfo.label}</div>
            <div class="aqi-description">${aqiInfo.desc}</div>
          </div>
          <div class="aqi-gauge">
            <svg viewBox="0 0 72 72">
              <circle class="aqi-gauge-bg" cx="36" cy="36" r="32"
                      stroke-dasharray="${circumference}" stroke-dashoffset="0"/>
              <circle class="aqi-gauge-fill" cx="36" cy="36" r="32"
                      stroke="${aqiInfo.color}"
                      stroke-dasharray="${circumference}"
                      stroke-dashoffset="${dashOffset}"/>
            </svg>
          </div>
        </div>
        <div class="aqi-pollutants">
          <div class="aqi-pollutant">
            <div class="aqi-pollutant-value">${airQuality.pm25.toFixed(1)}</div>
            <div class="aqi-pollutant-label">PM2.5</div>
          </div>
          <div class="aqi-pollutant">
            <div class="aqi-pollutant-value">${airQuality.pm10.toFixed(1)}</div>
            <div class="aqi-pollutant-label">PM10</div>
          </div>
          <div class="aqi-pollutant">
            <div class="aqi-pollutant-value">${airQuality.co.toFixed(1)}</div>
            <div class="aqi-pollutant-label">CO</div>
          </div>
          <div class="aqi-pollutant">
            <div class="aqi-pollutant-value">${airQuality.no2.toFixed(1)}</div>
            <div class="aqi-pollutant-label">NO₂</div>
          </div>
          <div class="aqi-pollutant">
            <div class="aqi-pollutant-value">${airQuality.o3.toFixed(1)}</div>
            <div class="aqi-pollutant-label">O₃</div>
          </div>
          <div class="aqi-pollutant">
            <div class="aqi-pollutant-value">${airQuality.so2.toFixed(1)}</div>
            <div class="aqi-pollutant-label">SO₂</div>
          </div>
        </div>
      </div>
    `;
  }

  /* ──────────────────────────────────────────
     MAP
     ────────────────────────────────────────── */

  function renderMap(data) {
    const { city, pincode, lat, lon, current } = data;

    refs.mapContainer.innerHTML = `
      <div class="map-card">
        <div class="map-placeholder">
          <div class="map-placeholder-bg"></div>
          <div class="map-grid"></div>
          <div class="map-marker-pulse"></div>
          <div class="map-marker">
            <div class="map-marker-pin"></div>
            <div class="map-marker-label">
              ${city}${pincode ? ` (${pincode})` : ''} • ${Utils.formatTemp(current.temp, Storage.getUnit())}
            </div>
          </div>
          <div class="map-coords">${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E</div>
        </div>
      </div>
    `;
  }

  /* ──────────────────────────────────────────
     SAVED LOCATIONS
     ────────────────────────────────────────── */

  function renderSavedLocations(unit) {
    const locations = Storage.getSavedLocations();

    refs.savedList.innerHTML = locations.map((loc) => {
      const weatherData = MockData.getWeatherData(loc.city);
      const temp = weatherData ? Utils.formatTemp(weatherData.current.temp, unit) : '--';
      const condition = weatherData ? weatherData.current.condition : 'Unknown';
      const isDay = weatherData ? weatherData.current.isDay : true;

      return `
        <div class="saved-card" data-city="${loc.city}" tabindex="0" role="button" 
             aria-label="View weather for ${loc.city}">
          <div class="saved-card-icon">
            ${Utils.getWeatherIcon(condition, isDay, 40)}
          </div>
          <div class="saved-card-info">
            <div class="saved-card-city">${loc.city}</div>
            <div class="saved-card-temp">${temp} • ${condition}</div>
          </div>
          <button class="saved-card-remove" data-city="${loc.city}"
                  aria-label="Remove ${loc.city}" title="Remove">
            ${Utils.getIcon('x', 14)}
          </button>
        </div>
      `;
    }).join('');

    if (locations.length === 0) {
      refs.savedList.innerHTML = `
        <div class="empty-state">
          <p>No saved locations yet.</p>
          <p style="margin-top: 4px;">Click the ⭐ on the weather card to save a city.</p>
        </div>
      `;
    }
  }

  /* ──────────────────────────────────────────
     ALERTS
     ────────────────────────────────────────── */

  function renderAlerts(data) {
    const { alerts } = data;
    const prefs = Storage.getPreferences();

    if (!prefs.showAlerts || !alerts || alerts.length === 0) {
      refs.alertsSection.innerHTML = '';
      return;
    }

    refs.alertsSection.innerHTML = alerts.map((alert, i) => `
      <div class="alert-card ${alert.type || 'warning'}" style="animation-delay: ${i * 100}ms">
        <div class="alert-icon">${alert.icon}</div>
        <div class="alert-content">
          <div class="alert-title">${alert.title}</div>
          <div class="alert-description">${alert.description}</div>
        </div>
        <button class="alert-dismiss" aria-label="Dismiss alert" data-index="${i}">
          ${Utils.getIcon('x', 14)}
        </button>
      </div>
    `).join('');
  }

  /* ──────────────────────────────────────────
     AUTOCOMPLETE
     ────────────────────────────────────────── */

  function renderAutocomplete(results) {
    if (!results || results.length === 0) {
      hideAutocomplete();
      return;
    }

    refs.autocompleteDropdown.innerHTML = results.map((r, i) => {
      const searchTarget = r.pincode || r.city;
      return `
        <div class="autocomplete-item" data-city="${searchTarget}" data-index="${i}"
             role="option" tabindex="-1">
          <div class="city-icon">${Utils.getIcon('location', 18)}</div>
          <div class="city-info">
            <div class="city-name">${r.city}</div>
            <div class="city-country">
              ${r.pincode ? `<span class="pincode-badge">📮 PIN: ${r.pincode}</span>` : ''}
              <span>${r.state ? r.state + ', ' : ''}${r.country}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    refs.autocompleteDropdown.classList.add('visible');
  }

  function hideAutocomplete() {
    refs.autocompleteDropdown.classList.remove('visible');
  }

  /* ──────────────────────────────────────────
     LOADING SKELETON
     ────────────────────────────────────────── */

  function showLoading() {
    refs.heroCard.innerHTML = '<div class="skeleton skeleton-hero"></div>';
    refs.heroCard.className = 'hero-card';

    refs.detailsGrid.innerHTML = Array(8).fill(
      '<div class="skeleton skeleton-detail"></div>'
    ).join('');
    refs.detailsGrid.className = 'details-grid';

    refs.hourlyScroll.innerHTML = `
      <div class="skeleton-hourly">
        ${Array(12).fill('<div class="skeleton skeleton-hourly-item"></div>').join('')}
      </div>
    `;

    refs.dailyList.innerHTML = '<div class="skeleton skeleton-card" style="height:300px"></div>';
    refs.aqiCard.innerHTML = '<div class="skeleton skeleton-card" style="height:200px"></div>';
    refs.mapContainer.innerHTML = '<div class="skeleton skeleton-card" style="height:280px"></div>';
  }

  /* ──────────────────────────────────────────
     ERROR STATE
     ────────────────────────────────────────── */

  function showError(message) {
    if (refs.heroCard) {
      refs.heroCard.className = 'hero-card anim-scale-in';
      refs.heroCard.innerHTML = `
        <div class="error-card">
          <div class="error-icon">🌦️</div>
          <div class="error-title">Weather Unavailable</div>
          <div class="error-message">${message}</div>
          <button class="error-retry-btn" id="error-retry-btn">
            ${Utils.getIcon('refresh', 16)}
            Try Again
          </button>
        </div>
      `;
    }
  }

  /* ──────────────────────────────────────────
     TOAST NOTIFICATIONS
     ────────────────────────────────────────── */

  function showToast(message, type = 'info', duration = 4000) {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
    };

    const toast = document.createElement('div');
    toast.className = 'toast toast-enter';
    toast.innerHTML = `
      <div class="toast-icon">${icons[type] || icons.info}</div>
      <div class="toast-message">${message}</div>
      <button class="toast-close" aria-label="Close notification">
        ${Utils.getIcon('x', 12)}
      </button>
    `;

    refs.toastContainer.appendChild(toast);

    // Close handler
    toast.querySelector('.toast-close').addEventListener('click', () => _dismissToast(toast));

    // Auto dismiss
    if (duration > 0) {
      setTimeout(() => _dismissToast(toast), duration);
    }
  }

  function _dismissToast(toast) {
    toast.classList.remove('toast-enter');
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 300);
  }

  /* ──────────────────────────────────────────
     SETTINGS MODAL CONTROLLER
     ────────────────────────────────────────── */

  function openSettingsModal(prefs, savedCount = 0) {
    populateSettingsForm(prefs, savedCount);
    if (refs.settingsModalBackdrop) {
      refs.settingsModalBackdrop.classList.add('open');
      refs.settingsModalBackdrop.setAttribute('aria-hidden', 'false');
    }
  }

  function closeSettingsModal() {
    if (refs.settingsModalBackdrop) {
      refs.settingsModalBackdrop.classList.remove('open');
      refs.settingsModalBackdrop.setAttribute('aria-hidden', 'true');
    }
  }

  function updateCustomCityVisibility(mode) {
    if (refs.settingCustomCityWrapper) {
      refs.settingCustomCityWrapper.style.display = mode === 'custom' ? 'flex' : 'none';
    }
  }

  function updateSoundButtonState(isSoundActive) {
    if (refs.soundToggle) {
      refs.soundToggle.classList.toggle('sound-active', isSoundActive);
      refs.soundToggle.classList.toggle('sound-muted', !isSoundActive);
      refs.soundToggle.setAttribute('aria-label', isSoundActive ? 'Mute weather sound effects' : 'Unmute weather sound effects');
      refs.soundToggle.setAttribute('title', isSoundActive ? 'Mute sound effects' : 'Enable sound effects');
    }
  }

  function populateSettingsForm(prefs, savedCount = 0) {
    if (refs.savedLocationsCount) {
      refs.savedLocationsCount.textContent = savedCount;
    }

    if (refs.settingUnitTemp) {
      const buttons = refs.settingUnitTemp.querySelectorAll('.segment-btn');
      buttons.forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-value') === prefs.unit);
      });
    }

    if (refs.settingUnitWind) refs.settingUnitWind.value = prefs.windUnit || 'km/h';
    if (refs.settingUnitPressure) refs.settingUnitPressure.value = prefs.pressureUnit || 'hPa';
    if (refs.settingUnitPrecip) refs.settingUnitPrecip.value = prefs.precipUnit || 'mm';
    if (refs.settingTheme) refs.settingTheme.value = prefs.theme || 'dark';
    if (refs.settingToggleAnimations) refs.settingToggleAnimations.checked = prefs.enableAnimations !== false;
    if (refs.settingToggleAlerts) refs.settingToggleAlerts.checked = prefs.showAlerts !== false;
    if (refs.settingToggleSound) refs.settingToggleSound.checked = Boolean(prefs.enableSound);
    if (refs.settingToggleAudioCue) refs.settingToggleAudioCue.checked = prefs.playAudioCue !== false;
    if (refs.settingSoundVolume) {
      const volPct = Math.round((prefs.soundVolume !== undefined ? prefs.soundVolume : 0.5) * 100);
      refs.settingSoundVolume.value = volPct;
      if (refs.settingVolumeValue) refs.settingVolumeValue.textContent = `${volPct}%`;
    }
    if (refs.settingDefaultLocationMode) {
      refs.settingDefaultLocationMode.value = prefs.defaultLocationMode || 'last';
      updateCustomCityVisibility(refs.settingDefaultLocationMode.value);
    }
    if (refs.settingCustomDefaultCity) refs.settingCustomDefaultCity.value = prefs.customDefaultCity || '';
    if (refs.settingDataMode) refs.settingDataMode.value = prefs.useMockData ? 'mock' : 'live';
  }

  function getSettingsFormData() {
    let tempUnit = 'C';
    if (refs.settingUnitTemp) {
      const activeBtn = refs.settingUnitTemp.querySelector('.segment-btn.active');
      if (activeBtn) tempUnit = activeBtn.getAttribute('data-value');
    }

    return {
      unit: tempUnit,
      windUnit: refs.settingUnitWind ? refs.settingUnitWind.value : 'km/h',
      pressureUnit: refs.settingUnitPressure ? refs.settingUnitPressure.value : 'hPa',
      precipUnit: refs.settingUnitPrecip ? refs.settingUnitPrecip.value : 'mm',
      theme: refs.settingTheme ? refs.settingTheme.value : 'dark',
      enableAnimations: refs.settingToggleAnimations ? refs.settingToggleAnimations.checked : true,
      showAlerts: refs.settingToggleAlerts ? refs.settingToggleAlerts.checked : true,
      enableSound: refs.settingToggleSound ? refs.settingToggleSound.checked : false,
      playAudioCue: refs.settingToggleAudioCue ? refs.settingToggleAudioCue.checked : true,
      soundVolume: refs.settingSoundVolume ? (Number(refs.settingSoundVolume.value) / 100) : 0.5,
      defaultLocationMode: refs.settingDefaultLocationMode ? refs.settingDefaultLocationMode.value : 'last',
      customDefaultCity: refs.settingCustomDefaultCity ? refs.settingCustomDefaultCity.value.trim() : '',
      useMockData: refs.settingDataMode ? refs.settingDataMode.value === 'mock' : false,
    };
  }

  function applyAnimationsToggle(enable) {
    const orbContainer = document.querySelector('.ambient-mesh-glow');
    if (orbContainer) {
      orbContainer.style.display = enable ? 'block' : 'none';
    }
    if (refs.body) {
      refs.body.classList.toggle('disable-animations', !enable);
    }
  }

  /* ──────────────────────────────────────────
     RENDER ALL
     ────────────────────────────────────────── */

  function renderAll(data, unit) {
    const prefs = Storage.getPreferences();
    applyAnimationsToggle(prefs.enableAnimations !== false);
    setTheme(prefs.theme);
    setWeatherBackground(data.current.condition, data.current.isDay);
    renderHero(data, unit);
    renderPincodeInfo(data);
    renderDetails(data, unit);
    renderHourly(data, unit);
    renderDaily(data, unit);
    renderAQI(data);
    renderMap(data);
    renderAlerts(data);
    renderSavedLocations(unit);
  }

  /* ── Public API ── */
  return {
    cacheRefs,
    setTheme,
    setUnit,
    setWeatherBackground,
    renderHero,
    renderDetails,
    renderHourly,
    renderDaily,
    renderAQI,
    renderMap,
    renderAlerts,
    renderAutocomplete,
    hideAutocomplete,
    renderSavedLocations,
    showLoading,
    showError,
    showToast,
    openSettingsModal,
    closeSettingsModal,
    populateSettingsForm,
    getSettingsFormData,
    updateCustomCityVisibility,
    applyAnimationsToggle,
    updateSoundButtonState,
    renderAll,
    refs: () => refs,
  };
})();
