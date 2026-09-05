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

  async function init() {
    // Cache DOM references
    UI.cacheRefs();

    // Load user preferences
    const prefs = Storage.getPreferences();
    state.unit = prefs.unit;
    state.theme = prefs.theme;

    // Apply preferences
    UI.setTheme(state.theme);
    UI.setUnit(state.unit);
    UI.applyAnimationsToggle(prefs.enableAnimations !== false);

    // Audio preferences
    AudioEngine.setVolume(prefs.soundVolume !== undefined ? prefs.soundVolume : 0.5);
    AudioEngine.setCueEnabled(prefs.playAudioCue !== false);
    AudioEngine.setMuted(!prefs.enableSound);
    UI.updateSoundButtonState(Boolean(prefs.enableSound));

    // Bind events
    _bindEvents();

    // Determine initial city based on defaultLocationMode preference
    if (prefs.defaultLocationMode === 'current') {
      try {
        const coords = await WeatherService.getCurrentLocation();
        await loadCoords(coords.lat, coords.lon);
        return;
      } catch (e) {
        console.warn('Startup geolocation failed, falling back to last city:', e.message);
      }
    } else if (prefs.defaultLocationMode === 'custom' && prefs.customDefaultCity) {
      state.currentCity = prefs.customDefaultCity;
      loadCity(state.currentCity);
      return;
    }

    state.currentCity = Storage.getLastCity() || 'New Delhi';
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

    // Sound toggle
    if (r.soundToggle) {
      r.soundToggle.addEventListener('click', _toggleSound);
    }

    // Settings Modal Events
    if (r.settingsBtn) r.settingsBtn.addEventListener('click', _openSettings);
    if (r.settingsCloseBtn) r.settingsCloseBtn.addEventListener('click', _closeSettings);
    if (r.settingsCancelBtn) r.settingsCancelBtn.addEventListener('click', _closeSettings);
    if (r.settingsModalBackdrop) {
      r.settingsModalBackdrop.addEventListener('click', (e) => {
        if (e.target === r.settingsModalBackdrop) _closeSettings();
      });
    }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && r.settingsModalBackdrop && r.settingsModalBackdrop.classList.contains('open')) {
        _closeSettings();
      }
    });

    if (r.settingsSaveBtn) r.settingsSaveBtn.addEventListener('click', _saveSettings);
    if (r.settingsResetDefaultsBtn) r.settingsResetDefaultsBtn.addEventListener('click', _resetSettings);
    if (r.settingClearSavedBtn) r.settingClearSavedBtn.addEventListener('click', _clearSavedLocations);

    if (r.settingUnitTemp) {
      r.settingUnitTemp.addEventListener('click', (e) => {
        const btn = e.target.closest('.segment-btn');
        if (btn) {
          r.settingUnitTemp.querySelectorAll('.segment-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        }
      });
    }

    if (r.settingSoundVolume) {
      r.settingSoundVolume.addEventListener('input', (e) => {
        const valPct = Number(e.target.value);
        if (r.settingVolumeValue) r.settingVolumeValue.textContent = `${valPct}%`;
        const normVol = Math.max(0, Math.min(1, valPct / 100));
        AudioEngine.setVolume(normVol);
      });
    }

    if (r.settingToggleSound) {
      r.settingToggleSound.addEventListener('change', (e) => {
        const isEnabled = e.target.checked;
        AudioEngine.setMuted(!isEnabled);
        UI.updateSoundButtonState(isEnabled);
        if (isEnabled && state.currentData) {
          AudioEngine.playWeatherSound(state.currentData.current.condition, state.currentData.current.isDay);
        }
      });
    }

    if (r.settingDefaultLocationMode) {
      r.settingDefaultLocationMode.addEventListener('change', (e) => {
        UI.updateCustomCityVisibility(e.target.value);
      });
    }

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

      // Audio engine update soundscape & indication cue
      AudioEngine.playWeatherSound(data.current.condition, data.current.isDay);
      AudioEngine.playAudioCue(data.current.condition);

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

      // Audio engine update soundscape & indication cue
      AudioEngine.playWeatherSound(data.current.condition, data.current.isDay);
      AudioEngine.playAudioCue(data.current.condition);

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

  function _toggleSound() {
    const isMuted = AudioEngine.toggleMute();
    const isEnabled = !isMuted;
    Storage.savePreferences({ enableSound: isEnabled });
    UI.updateSoundButtonState(isEnabled);

    if (isEnabled && state.currentData) {
      AudioEngine.playWeatherSound(state.currentData.current.condition, state.currentData.current.isDay);
      AudioEngine.playAudioCue(state.currentData.current.condition);
      UI.showToast(`🔊 Sound Effects Active: ${state.currentData.current.condition}`, 'info');
    } else {
      UI.showToast('🔇 Sound Effects Muted', 'info');
    }
  }

  /* ──────────────────────────────────────────
     SETTINGS MODAL HANDLERS
     ────────────────────────────────────────── */

  function _openSettings() {
    const prefs = Storage.getPreferences();
    const savedCount = Storage.getSavedLocations().length;
    UI.openSettingsModal(prefs, savedCount);
  }

  function _closeSettings() {
    UI.closeSettingsModal();
  }

  function _saveSettings() {
    const newPrefs = UI.getSettingsFormData();
    Storage.savePreferences(newPrefs);

    state.unit = newPrefs.unit;
    state.theme = newPrefs.theme;

    UI.setUnit(newPrefs.unit);
    UI.setTheme(newPrefs.theme);
    UI.applyAnimationsToggle(newPrefs.enableAnimations);

    // Audio preferences
    AudioEngine.setVolume(newPrefs.soundVolume);
    AudioEngine.setCueEnabled(newPrefs.playAudioCue);
    AudioEngine.setMuted(!newPrefs.enableSound);
    UI.updateSoundButtonState(newPrefs.enableSound);

    if (newPrefs.enableSound && state.currentData) {
      AudioEngine.playWeatherSound(state.currentData.current.condition, state.currentData.current.isDay);
    }

    UI.closeSettingsModal();

    // Re-render weather if data loaded
    if (state.currentData) {
      UI.renderAll(state.currentData, state.unit);
      ChartEngine.setData(state.currentData.hourly, state.unit);
      _bindChartTabs();
    }

    UI.showToast('Settings saved successfully!', 'success');
  }

  function _resetSettings() {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      const defaultPrefs = Storage.resetPreferences();
      state.unit = defaultPrefs.unit;
      state.theme = defaultPrefs.theme;

      UI.setUnit(defaultPrefs.unit);
      UI.setTheme(defaultPrefs.theme);
      UI.applyAnimationsToggle(defaultPrefs.enableAnimations);

      AudioEngine.setVolume(defaultPrefs.soundVolume);
      AudioEngine.setCueEnabled(defaultPrefs.playAudioCue);
      AudioEngine.setMuted(!defaultPrefs.enableSound);
      UI.updateSoundButtonState(defaultPrefs.enableSound);

      UI.populateSettingsForm(defaultPrefs, Storage.getSavedLocations().length);

      if (state.currentData) {
        UI.renderAll(state.currentData, state.unit);
        ChartEngine.setData(state.currentData.hourly, state.unit);
        _bindChartTabs();
      }

      UI.showToast('Settings reset to defaults.', 'info');
    }
  }

  function _clearSavedLocations() {
    if (confirm('Clear all saved locations?')) {
      Storage.clearSavedLocations();
      UI.renderSavedLocations(state.unit);
      if (state.currentData) {
        UI.renderHero(state.currentData, state.unit);
      }
      const countElem = document.getElementById('saved-locations-count');
      if (countElem) countElem.textContent = '0';
      UI.showToast('All saved locations cleared.', 'info');
    }
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
