/* ============================================================
   WEATHER APP — Storage Layer (LocalStorage)
   ============================================================ */

const Storage = (() => {
  const KEYS = {
    SAVED_LOCATIONS: 'weather_app_saved_locations',
    PREFERENCES: 'weather_app_preferences',
    LAST_CITY: 'weather_app_last_city',
  };

  const DEFAULTS = {
    locations: [
      { city: 'New Delhi', country: 'India', lat: 28.6139, lon: 77.2090 },
      { city: 'Mumbai', country: 'India', lat: 19.0760, lon: 72.8777 },
      { city: 'London', country: 'United Kingdom', lat: 51.5074, lon: -0.1278 },
    ],
    preferences: {
      unit: 'C',        // 'C' or 'F'
      theme: 'dark',    // 'dark' or 'light'
    },
    lastCity: 'New Delhi',
  };

  /* ── Helpers ── */

  function _get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function _set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('Storage: Failed to save', key, e);
    }
  }

  /* ── Saved Locations ── */

  function getSavedLocations() {
    return _get(KEYS.SAVED_LOCATIONS, DEFAULTS.locations);
  }

  function saveLocation(location) {
    const locations = getSavedLocations();
    const exists = locations.some(
      (loc) => loc.city.toLowerCase() === location.city.toLowerCase()
    );
    if (exists) return false;
    locations.push(location);
    _set(KEYS.SAVED_LOCATIONS, locations);
    return true;
  }

  function removeLocation(cityName) {
    const locations = getSavedLocations().filter(
      (loc) => loc.city.toLowerCase() !== cityName.toLowerCase()
    );
    _set(KEYS.SAVED_LOCATIONS, locations);
    return locations;
  }

  function isLocationSaved(cityName) {
    return getSavedLocations().some(
      (loc) => loc.city.toLowerCase() === cityName.toLowerCase()
    );
  }

  /* ── Preferences ── */

  function getPreferences() {
    return _get(KEYS.PREFERENCES, DEFAULTS.preferences);
  }

  function savePreferences(prefs) {
    const current = getPreferences();
    _set(KEYS.PREFERENCES, { ...current, ...prefs });
  }

  function getUnit() {
    return getPreferences().unit;
  }

  function setUnit(unit) {
    savePreferences({ unit });
  }

  function getTheme() {
    return getPreferences().theme;
  }

  function setTheme(theme) {
    savePreferences({ theme });
  }

  /* ── Last City ── */

  function getLastCity() {
    return _get(KEYS.LAST_CITY, DEFAULTS.lastCity);
  }

  function setLastCity(city) {
    _set(KEYS.LAST_CITY, city);
  }

  /* ── Public API ── */
  return {
    getSavedLocations,
    saveLocation,
    removeLocation,
    isLocationSaved,
    getPreferences,
    savePreferences,
    getUnit,
    setUnit,
    getTheme,
    setTheme,
    getLastCity,
    setLastCity,
  };
})();
