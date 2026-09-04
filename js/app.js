/* ============================================================
   WEATHER APP — Application Orchestrator
   ============================================================ */

const App = (() => {

  /* ──────────────────────────────────────────
     STATE
     ────────────────────────────────────────── */

  const state = {
    currentCity: null,
    currentData: null,
    unit: 'C',
    theme: 'dark',
    isLoading: false,
    searchQuery: '',
    activeAutocompleteIndex: -1,
  };

  /* ──────────────────────────────────────────
     INITIALIZATION
     ────────────────────────────────────────── */

  function init() {
    // Cache DOM references
    UI.cacheRefs();

    // Load user preferences
    state.unit = Storage.getUnit();
    state.theme = Storage.getTheme();
    state.currentCity = Storage.getLastCity() || 'New Delhi';

    // Apply preferences
    UI.setTheme(state.theme);
    UI.setUnit(state.unit);

    // Bind events
    _bindEvents();

    // Load initial weather
    loadCity(state.currentCity);
  }

  /* ──────────────────────────────────────────
     EVENT BINDING
     ────────────────────────────────────────── */

  function _bindEvents() {
    const r = UI.refs();

    // Search
    r.searchInput.addEventListener('input', Utils.debounce(_onSearchInput, 250));
    r.searchInput.addEventListener('focus', _onSearchFocus);
    r.searchInput.addEventListener('keydown', _onSearchKeydown);
    document.addEventListener('click', _onDocumentClick);

    // Location button
    const locationBtn = document.getElementById('location-btn');
    if (locationBtn) locationBtn.addEventListener('click', _onLocationClick);

    // Pincode quick chips
    const pincodeChips = document.getElementById('pincode-chips-bar');
    if (pincodeChips) {
      pincodeChips.addEventListener('click', (e) => {
        const chip = e.target.closest('.pincode-chip-btn');
        if (chip) {
          const pincode = chip.getAttribute('data-pincode');
          if (pincode) {
            loadCity(pincode);
          }
        }
      });
    }

    // Unit toggle
    r.unitCelsius.addEventListener('click', () => _setUnit('C'));
    r.unitFahrenheit.addEventListener('click', () => _setUnit('F'));

    // Theme toggle
    r.themeToggle.addEventListener('click', _toggleTheme);

    // Delegated events on main content
    document.getElementById('main-content').addEventListener('click', _onMainClick);

    // Saved locations
    r.savedList.addEventListener('click', _onSavedClick);

    // Alerts
    r.alertsSection.addEventListener('click', _onAlertClick);

    // Chart tabs
    document.querySelectorAll('.chart-tab').forEach((tab) => {
      tab.addEventListener('click', _onChartTabClick);
    });
  }

  /* ──────────────────────────────────────────
     LOAD CITY
     ────────────────────────────────────────── */

  async function loadCity(cityName) {
    if (state.isLoading) return;
    state.isLoading = true;

    UI.showLoading();
    UI.hideAutocomplete();
    UI.refs().searchInput.value = '';

    try {
      const data = await WeatherService.getWeatherByCity(cityName);
      state.currentCity = data.city;
      state.currentData = data;

      Storage.setLastCity(data.city);

      UI.renderAll(data, state.unit);

      // Initialize chart
      ChartEngine.init('weather-chart');
      ChartEngine.setData(data.hourly, state.unit);

      // Re-bind chart tabs (they are in the static HTML, no need to re-render)
      _bindChartTabs();

    } catch (error) {
      console.error('Failed to load weather:', error);
      UI.showError(error.message || 'Failed to fetch weather data. Please try again.');
      _bindRetryButton();
    }

    state.isLoading = false;
  }

  async function loadCoords(lat, lon) {
    if (state.isLoading) return;
    state.isLoading = true;
    UI.showLoading();

    try {
      const data = await WeatherService.getWeatherByCoords(lat, lon);
      state.currentCity = data.city;
      state.currentData = data;

      Storage.setLastCity(data.city);

      UI.renderAll(data, state.unit);
      ChartEngine.init('weather-chart');
      ChartEngine.setData(data.hourly, state.unit);
      _bindChartTabs();

    } catch (error) {
      console.error('Failed to load weather:', error);
      UI.showError(error.message);
      _bindRetryButton();
    }

    state.isLoading = false;
  }

  /* ──────────────────────────────────────────
     SEARCH HANDLING
     ────────────────────────────────────────── */

  async function _onSearchInput(e) {
    const query = e.target.value.trim();
    state.searchQuery = query;
    state.activeAutocompleteIndex = -1;

    if (query.length < 2) {
      UI.hideAutocomplete();
      return;
    }

    try {
      const results = await WeatherService.searchCities(query);
      // Only render if query hasn't changed
      if (state.searchQuery === query) {
        UI.renderAutocomplete(results);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  }

  function _onSearchFocus() {
    const query = UI.refs().searchInput.value.trim();
    if (query.length >= 2) {
      _onSearchInput({ target: { value: query } });
    }
  }

  function _onSearchKeydown(e) {
    const dropdown = UI.refs().autocompleteDropdown;
    const items = dropdown.querySelectorAll('.autocomplete-item');

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        state.activeAutocompleteIndex = Math.min(state.activeAutocompleteIndex + 1, items.length - 1);
        _updateAutocompleteHighlight(items);
        break;

      case 'ArrowUp':
        e.preventDefault();
        state.activeAutocompleteIndex = Math.max(state.activeAutocompleteIndex - 1, -1);
        _updateAutocompleteHighlight(items);
        break;

      case 'Enter':
        e.preventDefault();
        if (state.activeAutocompleteIndex >= 0 && items[state.activeAutocompleteIndex]) {
          const city = items[state.activeAutocompleteIndex].getAttribute('data-city');
          loadCity(city);
        } else if (UI.refs().searchInput.value.trim()) {
          loadCity(UI.refs().searchInput.value.trim());
        }
        break;

      case 'Escape':
        UI.hideAutocomplete();
        UI.refs().searchInput.blur();
        break;
    }
  }

  function _updateAutocompleteHighlight(items) {
    items.forEach((item, i) => {
      item.classList.toggle('active', i === state.activeAutocompleteIndex);
    });
  }

  function _onDocumentClick(e) {
    if (!e.target.closest('.search-container')) {
      UI.hideAutocomplete();
    }

    // Handle autocomplete item click
    const item = e.target.closest('.autocomplete-item');
    if (item) {
      const city = item.getAttribute('data-city');
      loadCity(city);
    }
  }

  /* ──────────────────────────────────────────
     LOCATION
     ────────────────────────────────────────── */

  async function _onLocationClick() {
    try {
      UI.showToast('Getting your location...', 'info', 2000);
      const coords = await WeatherService.getCurrentLocation();
      await loadCoords(coords.lat, coords.lon);
      UI.showToast('Location updated!', 'success');
    } catch (error) {
      UI.showToast(error.message, 'error');
    }
  }

  /* ──────────────────────────────────────────
     UNIT / THEME
     ────────────────────────────────────────── */

  function _setUnit(unit) {
    if (state.unit === unit) return;
    state.unit = unit;
    Storage.setUnit(unit);
    UI.setUnit(unit);

    // Re-render with new unit
    if (state.currentData) {
      UI.renderAll(state.currentData, unit);
      ChartEngine.setData(state.currentData.hourly, unit);
      _bindChartTabs();
    }
  }

  function _toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    Storage.setTheme(state.theme);
    UI.setTheme(state.theme);

    // Redraw chart for theme change
    setTimeout(() => ChartEngine.redraw(), 100);
  }

  /* ──────────────────────────────────────────
     MAIN CONTENT CLICK DELEGATION
     ────────────────────────────────────────── */

  function _onMainClick(e) {
    // Save button
    const saveBtn = e.target.closest('#hero-save-btn');
    if (saveBtn && state.currentData) {
      _toggleSaveLocation();
      return;
    }
  }

  function _toggleSaveLocation() {
    const { city, country, lat, lon } = state.currentData;
    const isSaved = Storage.isLocationSaved(city);

    if (isSaved) {
      Storage.removeLocation(city);
      UI.showToast(`${city} removed from saved locations`, 'info');
    } else {
      Storage.saveLocation({ city, country, lat, lon });
      UI.showToast(`${city} saved!`, 'success');
    }

    // Re-render hero and saved list
    UI.renderHero(state.currentData, state.unit);
    UI.renderSavedLocations(state.unit);
  }

  /* ──────────────────────────────────────────
     SAVED LOCATIONS
     ────────────────────────────────────────── */

  function _onSavedClick(e) {
    // Remove button
    const removeBtn = e.target.closest('.saved-card-remove');
    if (removeBtn) {
      e.stopPropagation();
      const city = removeBtn.getAttribute('data-city');
      Storage.removeLocation(city);
      UI.renderSavedLocations(state.unit);
      // Update hero if viewing removed city
      if (state.currentData && state.currentData.city === city) {
        UI.renderHero(state.currentData, state.unit);
      }
      UI.showToast(`${city} removed`, 'info');
      return;
    }

    // Card click → switch city
    const card = e.target.closest('.saved-card');
    if (card) {
      const city = card.getAttribute('data-city');
      if (city && city !== state.currentCity) {
        loadCity(city);
      }
    }
  }

  /* ──────────────────────────────────────────
     ALERTS
     ────────────────────────────────────────── */

  function _onAlertClick(e) {
    const dismissBtn = e.target.closest('.alert-dismiss');
    if (dismissBtn) {
      const alertCard = dismissBtn.closest('.alert-card');
      if (alertCard) {
        alertCard.style.animation = 'slideOutRight 300ms ease forwards';
        setTimeout(() => alertCard.remove(), 300);
      }
    }
  }

  /* ──────────────────────────────────────────
     CHART TABS
     ────────────────────────────────────────── */

  function _bindChartTabs() {
    document.querySelectorAll('.chart-tab').forEach((tab) => {
      tab.addEventListener('click', _onChartTabClick);
    });
  }

  function _onChartTabClick(e) {
    const tab = e.target.closest('.chart-tab');
    if (!tab) return;

    const type = tab.getAttribute('data-type');
    if (!type) return;

    // Update active tab
    document.querySelectorAll('.chart-tab').forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');

    // Update chart
    ChartEngine.setType(type);
  }

  /* ──────────────────────────────────────────
     ERROR RETRY
     ────────────────────────────────────────── */

  function _bindRetryButton() {
    // Use timeout to ensure button exists
    setTimeout(() => {
      const retryBtn = document.getElementById('error-retry-btn');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => {
          loadCity(state.currentCity || 'New Delhi');
        });
      }
    }, 100);
  }

  /* ── Public API ── */
  return { init, loadCity };
})();

/* ──────────────────────────────────────────
   BOOT
   ────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => App.init());
