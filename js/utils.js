/* ============================================================
   WEATHER APP — Utilities & Helpers
   ============================================================ */

const Utils = (() => {

  /* ──────────────────────────────────────────
     TEMPERATURE CONVERSION
     ────────────────────────────────────────── */

  function celsiusToFahrenheit(c) {
    return Math.round((c * 9) / 5 + 32);
  }

  function fahrenheitToCelsius(f) {
    return Math.round(((f - 32) * 5) / 9);
  }

  function formatTemp(value, unit = 'C') {
    if (unit === 'F') {
      return `${celsiusToFahrenheit(value)}°F`;
    }
    return `${Math.round(value)}°C`;
  }

  function formatTempValue(value, unit = 'C') {
    if (unit === 'F') return celsiusToFahrenheit(value);
    return Math.round(value);
  }

  /* ──────────────────────────────────────────
     DATE / TIME FORMATTING
     ────────────────────────────────────────── */

  function formatTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  function formatTimeShort(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      hour12: true,
    });
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }

  function formatDateShort(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  function formatDay(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }

  function formatFullDateTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }) + ' • ' + date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  /* ──────────────────────────────────────────
     GENERAL HELPERS
     ────────────────────────────────────────── */

  function debounce(fn, ms = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(null, args), ms);
    };
  }

  function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
  }

  function mapRange(value, inMin, inMax, outMin, outMax) {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
  }

  function getWindDirection(deg) {
    const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                  'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return dirs[Math.round(deg / 22.5) % 16];
  }

  function getUVLevel(uv) {
    if (uv <= 2) return { label: 'Low', color: '#10b981' };
    if (uv <= 5) return { label: 'Moderate', color: '#f59e0b' };
    if (uv <= 7) return { label: 'High', color: '#f97316' };
    if (uv <= 10) return { label: 'Very High', color: '#ef4444' };
    return { label: 'Extreme', color: '#7c3aed' };
  }

  function getAQILevel(aqi) {
    if (aqi <= 50) return { label: 'Good', color: '#10b981', desc: 'Air quality is satisfactory' };
    if (aqi <= 100) return { label: 'Moderate', color: '#f59e0b', desc: 'Acceptable air quality' };
    if (aqi <= 150) return { label: 'Unhealthy for Sensitive', color: '#f97316', desc: 'Sensitive groups may be affected' };
    if (aqi <= 200) return { label: 'Unhealthy', color: '#ef4444', desc: 'Everyone may experience effects' };
    if (aqi <= 300) return { label: 'Very Unhealthy', color: '#7c3aed', desc: 'Health alert: serious effects' };
    return { label: 'Hazardous', color: '#991b1b', desc: 'Emergency health warning' };
  }

  /* ──────────────────────────────────────────
     WEATHER BACKGROUND MAPPING
     ────────────────────────────────────────── */

  function getWeatherBackground(condition, isDay = true) {
    const c = condition.toLowerCase();
    if (c.includes('thunder') || c.includes('storm')) return 'storm';
    if (c.includes('snow') || c.includes('blizzard') || c.includes('sleet')) return 'snow';
    if (c.includes('rain') || c.includes('drizzle') || c.includes('shower')) return 'rain';
    if (c.includes('mist') || c.includes('fog') || c.includes('haze')) return 'mist';
    if (c.includes('cloud') || c.includes('overcast')) {
      return isDay ? 'cloudy' : 'night';
    }
    if (c.includes('partly')) return isDay ? 'partly-cloudy' : 'night';
    if (c.includes('clear') || c.includes('sunny')) {
      return isDay ? 'sunny' : 'night';
    }
    return isDay ? 'partly-cloudy' : 'night';
  }

  /* ──────────────────────────────────────────
     SVG WEATHER ICONS
     ────────────────────────────────────────── */

  const ICONS = {
    'clear-day': `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="12" fill="#FBBF24" stroke="#F59E0B" stroke-width="1.5"/>
      <g stroke="#FBBF24" stroke-width="2.5" stroke-linecap="round">
        <line x1="32" y1="6" x2="32" y2="14"/>
        <line x1="32" y1="50" x2="32" y2="58"/>
        <line x1="6" y1="32" x2="14" y2="32"/>
        <line x1="50" y1="32" x2="58" y2="32"/>
        <line x1="13.6" y1="13.6" x2="19.3" y2="19.3"/>
        <line x1="44.7" y1="44.7" x2="50.4" y2="50.4"/>
        <line x1="13.6" y1="50.4" x2="19.3" y2="44.7"/>
        <line x1="44.7" y1="19.3" x2="50.4" y2="13.6"/>
      </g>
    </svg>`,

    'clear-night': `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M38 12C28.6 12 21 19.6 21 29s7.6 17 17 17c3.7 0 7.1-1.2 9.9-3.2C45.4 47.7 40 51 34 51c-10.5 0-19-8.5-19-19s8.5-19 19-19c2.1 0 4.1.3 6 1C39.1 12.7 38.1 12 38 12z" fill="#C4B5FD" stroke="#A78BFA" stroke-width="1.5"/>
      <circle cx="44" cy="16" r="1.5" fill="#E2E8F0"/>
      <circle cx="50" cy="24" r="1" fill="#E2E8F0"/>
      <circle cx="48" cy="10" r="0.8" fill="#E2E8F0"/>
    </svg>`,

    'partly-cloudy-day': `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="22" r="9" fill="#FBBF24" stroke="#F59E0B" stroke-width="1"/>
      <g stroke="#FBBF24" stroke-width="2" stroke-linecap="round">
        <line x1="24" y1="5" x2="24" y2="10"/>
        <line x1="24" y1="34" x2="24" y2="36"/>
        <line x1="10" y1="22" x2="12" y2="22"/>
        <line x1="36" y1="22" x2="38" y2="22"/>
        <line x1="14" y1="12" x2="16" y2="14"/>
        <line x1="32" y1="30" x2="34" y2="32"/>
        <line x1="14" y1="32" x2="16" y2="30"/>
        <line x1="32" y1="14" x2="34" y2="12"/>
      </g>
      <path d="M22 44h28a8 8 0 10-3-15.4A12 12 0 0024 32a10 10 0 00-2 12z" fill="#E2E8F0" stroke="#CBD5E1" stroke-width="1.5"/>
    </svg>`,

    'partly-cloudy-night': `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M28 10c-5 0-9.5 3-11.4 7.5 2.5-1.5 5.4-2.5 8.4-2.5 8.8 0 16 7.2 16 16 0 1-.1 2-.3 3H28" fill="#C4B5FD" stroke="#A78BFA" stroke-width="1"/>
      <path d="M22 44h28a8 8 0 10-3-15.4A12 12 0 0024 32a10 10 0 00-2 12z" fill="#E2E8F0" stroke="#CBD5E1" stroke-width="1.5"/>
    </svg>`,

    'cloudy': `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 46h36a10 10 0 10-4-19.2A14 14 0 0020 32a12 12 0 00-4 14z" fill="#CBD5E1" stroke="#94A3B8" stroke-width="1.5"/>
      <path d="M12 40h8a6 6 0 10-2-11.5A9 9 0 0014 32a7 7 0 00-2 8z" fill="#E2E8F0" stroke="#CBD5E1" stroke-width="1"/>
    </svg>`,

    'rain': `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 38h32a9 9 0 10-3.5-17.3A13 13 0 0020 26a11 11 0 00-4 12z" fill="#94A3B8" stroke="#64748B" stroke-width="1.5"/>
      <g stroke="#60A5FA" stroke-width="2" stroke-linecap="round">
        <line x1="22" y1="44" x2="20" y2="52"/>
        <line x1="30" y1="44" x2="28" y2="52"/>
        <line x1="38" y1="44" x2="36" y2="52"/>
        <line x1="26" y1="50" x2="24" y2="56"/>
        <line x1="34" y1="50" x2="32" y2="56"/>
      </g>
    </svg>`,

    'heavy-rain': `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 36h36a9 9 0 10-3.5-17.3A13 13 0 0018 24a11 11 0 00-4 12z" fill="#64748B" stroke="#475569" stroke-width="1.5"/>
      <g stroke="#3B82F6" stroke-width="2.5" stroke-linecap="round">
        <line x1="20" y1="42" x2="16" y2="54"/>
        <line x1="28" y1="42" x2="24" y2="54"/>
        <line x1="36" y1="42" x2="32" y2="54"/>
        <line x1="44" y1="42" x2="40" y2="54"/>
        <line x1="24" y1="49" x2="21" y2="58"/>
        <line x1="32" y1="49" x2="29" y2="58"/>
        <line x1="40" y1="49" x2="37" y2="58"/>
      </g>
    </svg>`,

    'thunderstorm': `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 34h36a9 9 0 10-3.5-17.3A13 13 0 0018 22a11 11 0 00-4 12z" fill="#475569" stroke="#334155" stroke-width="1.5"/>
      <polygon points="30,36 26,48 32,48 28,60 38,44 32,44 36,36" fill="#FBBF24" stroke="#F59E0B" stroke-width="0.5"/>
      <g stroke="#60A5FA" stroke-width="1.5" stroke-linecap="round">
        <line x1="18" y1="40" x2="16" y2="48"/>
        <line x1="44" y1="40" x2="42" y2="48"/>
        <line x1="22" y1="48" x2="20" y2="54"/>
        <line x1="42" y1="46" x2="40" y2="52"/>
      </g>
    </svg>`,

    'snow': `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 38h32a9 9 0 10-3.5-17.3A13 13 0 0020 26a11 11 0 00-4 12z" fill="#CBD5E1" stroke="#94A3B8" stroke-width="1.5"/>
      <g fill="#BFDBFE">
        <circle cx="22" cy="46" r="2.5"/>
        <circle cx="32" cy="48" r="2"/>
        <circle cx="42" cy="45" r="2.5"/>
        <circle cx="27" cy="54" r="2"/>
        <circle cx="37" cy="55" r="2.5"/>
      </g>
    </svg>`,

    'mist': `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g stroke="#94A3B8" stroke-width="2.5" stroke-linecap="round">
        <line x1="12" y1="22" x2="52" y2="22"/>
        <line x1="16" y1="30" x2="48" y2="30"/>
        <line x1="10" y1="38" x2="54" y2="38"/>
        <line x1="18" y1="46" x2="46" y2="46"/>
      </g>
    </svg>`,

    'wind': `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <path d="M8 24h30a6 6 0 100-6" fill="none"/>
        <path d="M12 34h34a5 5 0 110 5" fill="none"/>
        <path d="M10 44h24a4 4 0 100-4" fill="none"/>
      </g>
    </svg>`,

    'humidity': `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 8L18 32a14 14 0 1028 0L32 8z" fill="#60A5FA" stroke="#3B82F6" stroke-width="1.5"/>
      <path d="M26 38a8 8 0 008 8" stroke="#93C5FD" stroke-width="2" stroke-linecap="round" fill="none"/>
    </svg>`,

    'pressure': `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="34" r="20" stroke="currentColor" stroke-width="2" fill="none"/>
      <line x1="32" y1="34" x2="40" y2="22" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="32" cy="34" r="3" fill="currentColor"/>
      <g fill="currentColor">
        <circle cx="32" cy="16" r="1.5"/>
        <circle cx="48" cy="34" r="1.5"/>
        <circle cx="16" cy="34" r="1.5"/>
        <circle cx="43" cy="21" r="1.5"/>
        <circle cx="21" cy="21" r="1.5"/>
      </g>
    </svg>`,

    'visibility': `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 32s10-16 26-16 26 16 26 16-10 16-26 16S6 32 6 32z" stroke="currentColor" stroke-width="2" fill="none"/>
      <circle cx="32" cy="32" r="8" stroke="currentColor" stroke-width="2" fill="none"/>
      <circle cx="32" cy="32" r="3" fill="currentColor"/>
    </svg>`,

    'uv': `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="10" fill="#FBBF24" stroke="#F59E0B" stroke-width="1.5"/>
      <g stroke="#F59E0B" stroke-width="2.5" stroke-linecap="round">
        <line x1="32" y1="8" x2="32" y2="16"/>
        <line x1="32" y1="48" x2="32" y2="56"/>
        <line x1="8" y1="32" x2="16" y2="32"/>
        <line x1="48" y1="32" x2="56" y2="32"/>
      </g>
      <text x="32" y="36" text-anchor="middle" font-size="10" font-weight="700" fill="#92400E" font-family="Inter, sans-serif">UV</text>
    </svg>`,

    'sunrise': `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="8" y1="46" x2="56" y2="46" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M18 46a14 14 0 0128 0" stroke="#FBBF24" stroke-width="2" fill="none"/>
      <circle cx="32" cy="36" r="6" fill="#FBBF24"/>
      <g stroke="#FBBF24" stroke-width="2" stroke-linecap="round">
        <line x1="32" y1="18" x2="32" y2="24"/>
        <line x1="18" y1="26" x2="22" y2="30"/>
        <line x1="46" y1="26" x2="42" y2="30"/>
      </g>
      <path d="M28 20l4-6 4 6" stroke="#FBBF24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </svg>`,

    'sunset': `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="8" y1="46" x2="56" y2="46" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M18 46a14 14 0 0128 0" stroke="#F97316" stroke-width="2" fill="none"/>
      <circle cx="32" cy="36" r="6" fill="#F97316"/>
      <g stroke="#F97316" stroke-width="2" stroke-linecap="round">
        <line x1="32" y1="18" x2="32" y2="24"/>
        <line x1="18" y1="26" x2="22" y2="30"/>
        <line x1="46" y1="26" x2="42" y2="30"/>
      </g>
      <path d="M28 24l4 6 4-6" stroke="#F97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </svg>`,

    'precipitation': `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 8L20 34a12 12 0 1024 0L32 8z" fill="#60A5FA" stroke="#3B82F6" stroke-width="1.5"/>
      <text x="32" y="40" text-anchor="middle" font-size="10" font-weight="700" fill="#ffffff" font-family="Inter, sans-serif">%</text>
    </svg>`,

    'location': `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 6C22.1 6 14 14.1 14 24c0 14 18 34 18 34s18-20 18-34C50 14.1 41.9 6 32 6z" fill="currentColor" opacity="0.2" stroke="currentColor" stroke-width="2"/>
      <circle cx="32" cy="24" r="7" fill="none" stroke="currentColor" stroke-width="2"/>
    </svg>`,

    'search': `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/>
      <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>`,

    'star': `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="12,2 15.1,8.3 22,9.3 17,14.1 18.2,21 12,17.8 5.8,21 7,14.1 2,9.3 8.9,8.3" fill="currentColor"/>
    </svg>`,

    'star-outline': `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="12,2 15.1,8.3 22,9.3 17,14.1 18.2,21 12,17.8 5.8,21 7,14.1 2,9.3 8.9,8.3" stroke="currentColor" stroke-width="1.5" fill="none"/>
    </svg>`,

    'alert': `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L1 21h22L12 2z" fill="currentColor" opacity="0.15" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
      <line x1="12" y1="9" x2="12" y2="14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <circle cx="12" cy="17" r="1" fill="currentColor"/>
    </svg>`,

    'settings': `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" stroke-width="1.5"/>
    </svg>`,

    'moon': `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill="currentColor"/>
    </svg>`,

    'sun-theme': `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="5" fill="currentColor"/>
      <g stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <line x1="12" y1="1" x2="12" y2="4"/>
        <line x1="12" y1="20" x2="12" y2="23"/>
        <line x1="1" y1="12" x2="4" y2="12"/>
        <line x1="20" y1="12" x2="23" y2="12"/>
        <line x1="4.2" y1="4.2" x2="6.3" y2="6.3"/>
        <line x1="17.7" y1="17.7" x2="19.8" y2="19.8"/>
        <line x1="4.2" y1="19.8" x2="6.3" y2="17.7"/>
        <line x1="17.7" y1="6.3" x2="19.8" y2="4.2"/>
      </g>
    </svg>`,

    'crosshair': `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
      <line x1="12" y1="1" x2="12" y2="5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="1" y1="12" x2="5" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="19" y1="12" x2="23" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>`,

    'plus': `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>`,

    'x': `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>`,

    'refresh': `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 4v6h6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M3.51 15a9 9 0 105.34-9.34L1 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,

    'trash': `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  };

  function getIcon(name, size = 24, className = '') {
    const svg = ICONS[name] || ICONS['cloudy'];
    const sizeAttr = `width="${size}" height="${size}"`;
    const classAttr = className ? `class="${className}"` : '';
    return svg
      .replace('<svg', `<svg ${sizeAttr} ${classAttr}`)
      .replace(/\n\s*/g, '');
  }

  function getWeatherIcon(condition, isDay = true, size = 24, className = '') {
    const c = condition.toLowerCase();
    let name;
    if (c.includes('thunder') || c.includes('storm')) name = 'thunderstorm';
    else if (c.includes('heavy rain') || c.includes('downpour')) name = 'heavy-rain';
    else if (c.includes('snow') || c.includes('blizzard') || c.includes('sleet')) name = 'snow';
    else if (c.includes('rain') || c.includes('drizzle') || c.includes('shower')) name = 'rain';
    else if (c.includes('mist') || c.includes('fog') || c.includes('haze')) name = 'mist';
    else if (c.includes('partly') || c.includes('few clouds')) {
      name = isDay ? 'partly-cloudy-day' : 'partly-cloudy-night';
    }
    else if (c.includes('cloud') || c.includes('overcast')) name = 'cloudy';
    else if (c.includes('clear') || c.includes('sunny')) {
      name = isDay ? 'clear-day' : 'clear-night';
    }
    else name = isDay ? 'partly-cloudy-day' : 'partly-cloudy-night';

    return getIcon(name, size, className);
  }

  /* ── Public API ── */
  return {
    celsiusToFahrenheit,
    fahrenheitToCelsius,
    formatTemp,
    formatTempValue,
    formatTime,
    formatTimeShort,
    formatDate,
    formatDateShort,
    formatDay,
    formatFullDateTime,
    debounce,
    clamp,
    mapRange,
    getWindDirection,
    getUVLevel,
    getAQILevel,
    getWeatherBackground,
    getIcon,
    getWeatherIcon,
  };
})();
