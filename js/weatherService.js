/* ============================================================
   WEATHER APP — Weather Service Layer (Open-Meteo Live + Mock Fallback)
   ============================================================ */

const WeatherService = (() => {
  /* ──────────────────────────────────────────
     CONFIGURATION
     ────────────────────────────────────────── */

  const CONFIG = {
    useMockData: false,   // Default to Live Open-Meteo API (Free, no API key needed)
    openMeteoGeoUrl: 'https://geocoding-api.open-meteo.com/v1/search',
    openMeteoForecastUrl: 'https://api.open-meteo.com/v1/forecast',
    openMeteoAirUrl: 'https://air-quality-api.open-meteo.com/v1/air-quality',
  };

  /* ──────────────────────────────────────────
     INTERNAL: API CALL HELPERS
     ────────────────────────────────────────── */

  async function _fetchJSON(url) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout
    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  function _simulateDelay(ms = 300) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /* Map WMO weather code to condition string & description */
  function _mapWMOCode(code) {
    switch (code) {
      case 0:
      case 1:
        return { condition: 'Sunny', description: 'Clear blue skies with bright sunshine.' };
      case 2:
        return { condition: 'Partly Cloudy', description: 'Partly cloudy with pleasant weather.' };
      case 3:
        return { condition: 'Cloudy', description: 'Overcast skies throughout the area.' };
      case 45:
      case 48:
        return { condition: 'Foggy', description: 'Foggy or hazy conditions reducing visibility.' };
      case 51:
      case 53:
      case 55:
        return { condition: 'Light Rain', description: 'Light rain drizzle in the area.' };
      case 61:
      case 63:
        return { condition: 'Rain', description: 'Moderate rain showers expected.' };
      case 65:
      case 80:
      case 81:
      case 82:
        return { condition: 'Heavy Rain', description: 'Heavy monsoon rainfall expected.' };
      case 71:
      case 73:
      case 75:
      case 77:
        return { condition: 'Snow', description: 'Snowfall and cold conditions.' };
      case 95:
      case 96:
      case 99:
        return { condition: 'Thunderstorm', description: 'Thunderstorms with heavy rain showers.' };
      default:
        return { condition: 'Partly Cloudy', description: 'Variable cloudiness.' };
    }
  }

  /* ──────────────────────────────────────────
     NORMALIZE: Transform Open-Meteo API response to App Format
     ────────────────────────────────────────── */

  function _normalizeOpenMeteoData(forecast, airData, cityInfo) {
    const cur = forecast.current_weather || {};
    const hourlyRaw = forecast.hourly || {};
    const dailyRaw = forecast.daily || {};

    const condInfo = _mapWMOCode(cur.weathercode || 0);
    const isDay = cur.is_day === 1;

    // Find current hour index
    const nowISO = new Date().toISOString().substring(0, 13);
    let curIndex = (hourlyRaw.time || []).findIndex(t => t.startsWith(nowISO));
    if (curIndex === -1) curIndex = 0;

    const humidity = hourlyRaw.relative_humidity_2m ? hourlyRaw.relative_humidity_2m[curIndex] || 65 : 65;
    const feelsLike = hourlyRaw.apparent_temperature ? Math.round(hourlyRaw.apparent_temperature[curIndex]) : Math.round(cur.temperature);
    const pressure = hourlyRaw.surface_pressure ? Math.round(hourlyRaw.surface_pressure[curIndex]) : 1010;
    const uvIndex = hourlyRaw.uv_index ? Math.round(hourlyRaw.uv_index[curIndex] || 5) : 5;
    const rainChance = hourlyRaw.precipitation_probability ? (hourlyRaw.precipitation_probability[curIndex] || 0) : 20;

    const high = dailyRaw.temperature_2m_max ? Math.round(dailyRaw.temperature_2m_max[0]) : Math.round(cur.temperature + 3);
    const low = dailyRaw.temperature_2m_min ? Math.round(dailyRaw.temperature_2m_min[0]) : Math.round(cur.temperature - 4);
    const sunrise = dailyRaw.sunrise && dailyRaw.sunrise[0] ? dailyRaw.sunrise[0] : new Date().toISOString();
    const sunset = dailyRaw.sunset && dailyRaw.sunset[0] ? dailyRaw.sunset[0] : new Date().toISOString();

    // 24 Hourly forecast items
    const hourly = [];
    const times = hourlyRaw.time || [];
    for (let i = curIndex; i < Math.min(times.length, curIndex + 24); i++) {
      const wCode = hourlyRaw.weathercode ? hourlyRaw.weathercode[i] : 0;
      const hourCond = _mapWMOCode(wCode).condition;
      const hTime = new Date(times[i]);
      hourly.push({
        time: hTime.toISOString(),
        temp: Math.round(hourlyRaw.temperature_2m ? hourlyRaw.temperature_2m[i] : cur.temperature),
        condition: hourCond,
        rainChance: hourlyRaw.precipitation_probability ? (hourlyRaw.precipitation_probability[i] || 0) : 10,
        isDay: hTime.getHours() >= 6 && hTime.getHours() < 19,
        windSpeed: Math.round(hourlyRaw.windspeed_10m ? hourlyRaw.windspeed_10m[i] : cur.windspeed),
        humidity: hourlyRaw.relative_humidity_2m ? hourlyRaw.relative_humidity_2m[i] : 60,
      });
    }

    // 7 Daily forecast items
    const daily = [];
    const dTimes = dailyRaw.time || [];
    for (let i = 0; i < Math.min(dTimes.length, 7); i++) {
      const wCode = dailyRaw.weathercode ? dailyRaw.weathercode[i] : 0;
      const dInfo = _mapWMOCode(wCode);
      daily.push({
        date: new Date(dTimes[i]).toISOString(),
        high: Math.round(dailyRaw.temperature_2m_max ? dailyRaw.temperature_2m_max[i] : high),
        low: Math.round(dailyRaw.temperature_2m_min ? dailyRaw.temperature_2m_min[i] : low),
        condition: dInfo.condition,
        rainChance: dailyRaw.precipitation_probability_max ? (dailyRaw.precipitation_probability_max[i] || 0) : 20,
        description: dInfo.description,
        windSpeed: Math.round(cur.windspeed || 12),
        humidity: 60,
      });
    }

    // Air Quality normalization
    let airQuality = null;
    if (airData && airData.current) {
      const cAir = airData.current;
      airQuality = {
        aqi: Math.round(cAir.us_aqi || 85),
        pm25: Number((cAir.pm2_5 || 25.0).toFixed(1)),
        pm10: Number((cAir.pm10 || 50.0).toFixed(1)),
        co: Number(((cAir.carbon_monoxide || 400) / 1000).toFixed(1)),
        no2: Number((cAir.nitrogen_dioxide || 25.0).toFixed(1)),
        o3: Number((cAir.ozone || 45.0).toFixed(1)),
        so2: Number((cAir.sulphur_dioxide || 8.0).toFixed(1)),
      };
    } else {
      airQuality = {
        aqi: 95,
        pm25: 32.0,
        pm10: 65.0,
        co: 0.8,
        no2: 26.0,
        o3: 50.0,
        so2: 9.0,
      };
    }

    return {
      city: cityInfo.name || cityInfo.city,
      country: cityInfo.country || 'India',
      state: cityInfo.state || '',
      lat: cityInfo.lat,
      lon: cityInfo.lon,
      timezone: forecast.timezone || 'Asia/Kolkata',
      current: {
        temp: Math.round(cur.temperature),
        feelsLike,
        high,
        low,
        condition: condInfo.condition,
        description: condInfo.description,
        humidity,
        windSpeed: Math.round(cur.windspeed || 10),
        windDeg: Math.round(cur.winddirection || 180),
        pressure,
        visibility: 9,
        uvIndex,
        dewPoint: Math.round(cur.temperature - ((100 - humidity) / 5)),
        cloudCover: 40,
        rainChance,
        sunrise,
        sunset,
        isDay,
        lastUpdated: new Date().toISOString(),
      },
      hourly,
      daily,
      airQuality,
      alerts: (condInfo.condition === 'Heavy Rain' || condInfo.condition === 'Thunderstorm') ? [
        {
          type: 'warning',
          title: `${condInfo.condition} Warning`,
          description: `${condInfo.description} Exercise caution when traveling outdoors.`,
          severity: 'moderate',
          time: new Date().toISOString(),
          icon: condInfo.condition === 'Thunderstorm' ? '⛈️' : '🌧️',
        }
      ] : [],
    };
  }

  /* ──────────────────────────────────────────
     PINCODE GEOLOCATION LOGIC (Worldwide Pincode Support)
     ────────────────────────────────────────── */

  function isPincodeQuery(query) {
    if (!query) return false;
    const clean = query.trim().replace(/^(pin|pincode|zip|zipcode|postalcode)\s*/i, '');
    // Indian 6-digit PIN (e.g. 110001)
    if (/^\d{6}$/.test(clean)) return true;
    // US 5-digit ZIP or 5+4 (e.g. 90210, 90210-1234)
    if (/^\d{5}(-\d{4})?$/.test(clean)) return true;
    // UK postcodes (e.g. SW1A 1AA, E1 6AN, M1 1AE)
    if (/^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i.test(clean)) return true;
    // Canadian postcodes (e.g. M5V 2T6)
    if (/^[A-Z]\d[A-Z]\s*\d[A-Z]\d$/i.test(clean)) return true;
    // Japan / Europe numeric postcodes (e.g. 100-0001, 75001, 10115, 2000)
    if (/^\d{3,5}(-\d{4})?$/.test(clean)) return true;
    // General numeric query (3 to 6 digits)
    if (/^\d{3,6}$/.test(clean)) return true;
    return false;
  }

  async function getPincodeLocation(query) {
    const rawPin = query.trim();
    const cleanPin = rawPin.replace(/^(pin|pincode|zip|zipcode|postalcode)\s*/i, '').trim();

    // 1. Try Indian Postal Pincode API (for 6-digit Indian PIN codes)
    if (/^\d{6}$/.test(cleanPin)) {
      try {
        const pinRes = await _fetchJSON(`https://api.postalpincode.in/pincode/${cleanPin}`);
        if (pinRes && pinRes[0] && pinRes[0].Status === 'Success' && pinRes[0].PostOffice && pinRes[0].PostOffice.length > 0) {
          const postOffices = pinRes[0].PostOffice;
          const po = postOffices[0];
          const locality = po.Name;
          const district = po.District || po.Division || '';
          const state = po.State || '';
          const country = po.Country || 'India';
          const poList = [...new Set(postOffices.map(p => p.Name))];
          const searchName = `${district || locality}, ${state}, India`;

          // Geocode district/locality to get lat/lon
          const geoUrl = `${CONFIG.openMeteoGeoUrl}?name=${encodeURIComponent(searchName)}&count=5&language=en&format=json`;
          const geoRes = await _fetchJSON(geoUrl).catch(() => null);
          let lat = 28.6139, lon = 77.2090;

          if (geoRes && geoRes.results && geoRes.results.length > 0) {
            lat = geoRes.results[0].latitude;
            lon = geoRes.results[0].longitude;
          }

          return {
            name: `${locality}, ${district}`,
            city: `${locality}, ${district}`,
            exactPlace: locality,
            district: district,
            pincode: cleanPin,
            state: state,
            country: country,
            postOffices: poList,
            lat,
            lon,
            isPincode: true,
            isIndianPin: true,
          };
        }
      } catch (e) {
        console.warn('Indian Post API lookup failed, falling back:', e.message);
      }
    }

    // 2. OpenStreetMap Nominatim Geocoding API (Worldwide Postal Codes)
    try {
      const nomUrl = `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(cleanPin)}&format=json&addressdetails=1&limit=5`;
      const nomResults = await _fetchJSON(nomUrl);
      if (nomResults && nomResults.length > 0) {
        const item = nomResults[0];
        const addr = item.address || {};
        const placeName = addr.city || addr.town || addr.village || addr.suburb || addr.county || item.display_name.split(',')[0];
        return {
          name: `${placeName} (${cleanPin})`,
          city: placeName,
          pincode: addr.postcode || cleanPin,
          state: addr.state || addr.region || '',
          country: addr.country || '',
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          isPincode: true,
        };
      }
    } catch (e) {
      console.warn('Nominatim postalcode lookup failed:', e.message);
    }

    // 3. Fallback: Search Nominatim query string with postal code
    try {
      const nomQUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanPin)}&format=json&addressdetails=1&limit=5`;
      const nomQResults = await _fetchJSON(nomQUrl);
      if (nomQResults && nomQResults.length > 0) {
        const item = nomQResults[0];
        const addr = item.address || {};
        const placeName = addr.city || addr.town || addr.village || addr.suburb || item.display_name.split(',')[0];
        return {
          name: `${placeName} (${cleanPin})`,
          city: placeName,
          pincode: addr.postcode || cleanPin,
          state: addr.state || '',
          country: addr.country || '',
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          isPincode: true,
        };
      }
    } catch (e) {
      console.warn('Nominatim query search failed:', e.message);
    }

    // 4. Fallback: Open-Meteo Geocoding Search
    try {
      const geoUrl = `${CONFIG.openMeteoGeoUrl}?name=${encodeURIComponent(cleanPin)}&count=5&language=en&format=json`;
      const geoRes = await _fetchJSON(geoUrl);
      if (geoRes && geoRes.results && geoRes.results.length > 0) {
        const item = geoRes.results[0];
        return {
          name: `${item.name} (${cleanPin})`,
          city: item.name,
          pincode: cleanPin,
          state: item.admin1 || '',
          country: item.country || (item.country_code === 'IN' ? 'India' : ''),
          lat: item.latitude,
          lon: item.longitude,
          isPincode: true,
        };
      }
    } catch (e) {
      console.warn('Open-Meteo pincode search failed:', e.message);
    }

    return null;
  }

  /* ──────────────────────────────────────────
     NORMALIZE: Transform Open-Meteo API response to App Format
     ────────────────────────────────────────── */

  function _normalizeOpenMeteoData(forecast, airData, cityInfo) {
    const cur = forecast.current_weather || {};
    const hourlyRaw = forecast.hourly || {};
    const dailyRaw = forecast.daily || {};

    const condInfo = _mapWMOCode(cur.weathercode || 0);
    const isDay = cur.is_day === 1;

    // Find current hour index
    const nowISO = new Date().toISOString().substring(0, 13);
    let curIndex = (hourlyRaw.time || []).findIndex(t => t.startsWith(nowISO));
    if (curIndex === -1) curIndex = 0;

    const humidity = hourlyRaw.relative_humidity_2m ? hourlyRaw.relative_humidity_2m[curIndex] || 65 : 65;
    const feelsLike = hourlyRaw.apparent_temperature ? Math.round(hourlyRaw.apparent_temperature[curIndex]) : Math.round(cur.temperature);
    const pressure = hourlyRaw.surface_pressure ? Math.round(hourlyRaw.surface_pressure[curIndex]) : 1010;
    const uvIndex = hourlyRaw.uv_index ? Math.round(hourlyRaw.uv_index[curIndex] || 5) : 5;
    const rainChance = hourlyRaw.precipitation_probability ? (hourlyRaw.precipitation_probability[curIndex] || 0) : 20;

    const high = dailyRaw.temperature_2m_max ? Math.round(dailyRaw.temperature_2m_max[0]) : Math.round(cur.temperature + 3);
    const low = dailyRaw.temperature_2m_min ? Math.round(dailyRaw.temperature_2m_min[0]) : Math.round(cur.temperature - 4);
    const sunrise = dailyRaw.sunrise && dailyRaw.sunrise[0] ? dailyRaw.sunrise[0] : new Date().toISOString();
    const sunset = dailyRaw.sunset && dailyRaw.sunset[0] ? dailyRaw.sunset[0] : new Date().toISOString();

    // 24 Hourly forecast items
    const hourly = [];
    const times = hourlyRaw.time || [];
    for (let i = curIndex; i < Math.min(times.length, curIndex + 24); i++) {
      const wCode = hourlyRaw.weathercode ? hourlyRaw.weathercode[i] : 0;
      const hourCond = _mapWMOCode(wCode).condition;
      const hTime = new Date(times[i]);
      hourly.push({
        time: hTime.toISOString(),
        temp: Math.round(hourlyRaw.temperature_2m ? hourlyRaw.temperature_2m[i] : cur.temperature),
        condition: hourCond,
        rainChance: hourlyRaw.precipitation_probability ? (hourlyRaw.precipitation_probability[i] || 0) : 10,
        isDay: hTime.getHours() >= 6 && hTime.getHours() < 19,
        windSpeed: Math.round(hourlyRaw.windspeed_10m ? hourlyRaw.windspeed_10m[i] : cur.windspeed),
        humidity: hourlyRaw.relative_humidity_2m ? hourlyRaw.relative_humidity_2m[i] : 60,
      });
    }

    // 7 Daily forecast items
    const daily = [];
    const dTimes = dailyRaw.time || [];
    for (let i = 0; i < Math.min(dTimes.length, 7); i++) {
      const wCode = dailyRaw.weathercode ? dailyRaw.weathercode[i] : 0;
      const dInfo = _mapWMOCode(wCode);
      daily.push({
        date: new Date(dTimes[i]).toISOString(),
        high: Math.round(dailyRaw.temperature_2m_max ? dailyRaw.temperature_2m_max[i] : high),
        low: Math.round(dailyRaw.temperature_2m_min ? dailyRaw.temperature_2m_min[i] : low),
        condition: dInfo.condition,
        rainChance: dailyRaw.precipitation_probability_max ? (dailyRaw.precipitation_probability_max[i] || 0) : 20,
        description: dInfo.description,
        windSpeed: Math.round(cur.windspeed || 12),
        humidity: 60,
      });
    }

    // Air Quality normalization
    let airQuality = null;
    if (airData && airData.current) {
      const cAir = airData.current;
      airQuality = {
        aqi: Math.round(cAir.us_aqi || 85),
        pm25: Number((cAir.pm2_5 || 25.0).toFixed(1)),
        pm10: Number((cAir.pm10 || 50.0).toFixed(1)),
        co: Number(((cAir.carbon_monoxide || 400) / 1000).toFixed(1)),
        no2: Number((cAir.nitrogen_dioxide || 25.0).toFixed(1)),
        o3: Number((cAir.ozone || 45.0).toFixed(1)),
        so2: Number((cAir.sulphur_dioxide || 8.0).toFixed(1)),
      };
    } else {
      airQuality = {
        aqi: 95,
        pm25: 32.0,
        pm10: 65.0,
        co: 0.8,
        no2: 26.0,
        o3: 50.0,
        so2: 9.0,
      };
    }

    return {
      city: cityInfo.name || cityInfo.city,
      exactPlace: cityInfo.exactPlace || cityInfo.name || cityInfo.city,
      district: cityInfo.district || '',
      pincode: cityInfo.pincode || null,
      postOffices: cityInfo.postOffices || [],
      isIndianPin: cityInfo.isIndianPin || (cityInfo.pincode && /^\d{6}$/.test(cityInfo.pincode)),
      country: cityInfo.country || 'India',
      state: cityInfo.state || '',
      lat: cityInfo.lat,
      lon: cityInfo.lon,
      timezone: forecast.timezone || 'Asia/Kolkata',
      current: {
        temp: Math.round(cur.temperature),
        feelsLike,
        high,
        low,
        condition: condInfo.condition,
        description: condInfo.description,
        humidity,
        windSpeed: Math.round(cur.windspeed || 10),
        windDeg: Math.round(cur.winddirection || 180),
        pressure,
        visibility: 9,
        uvIndex,
        dewPoint: Math.round(cur.temperature - ((100 - humidity) / 5)),
        cloudCover: 40,
        rainChance,
        sunrise,
        sunset,
        isDay,
        lastUpdated: new Date().toISOString(),
      },
      hourly,
      daily,
      airQuality,
      alerts: (condInfo.condition === 'Heavy Rain' || condInfo.condition === 'Thunderstorm') ? [
        {
          type: 'warning',
          title: `${condInfo.condition} Warning`,
          description: `${condInfo.description} Exercise caution when traveling outdoors.`,
          severity: 'moderate',
          time: new Date().toISOString(),
          icon: condInfo.condition === 'Thunderstorm' ? '⛈️' : '🌧️',
        }
      ] : [],
    };
  }

  function _isMockData() {
    try {
      const prefs = Storage.getPreferences();
      return Boolean(prefs.useMockData) || CONFIG.useMockData;
    } catch {
      return CONFIG.useMockData;
    }
  }

  /* ──────────────────────────────────────────
     PUBLIC: Get Weather by City Name or Pincode
     ────────────────────────────────────────── */

  async function getWeatherByCity(cityName) {
    if (_isMockData()) {
      await _simulateDelay(300);
      return MockData.getWeatherData(cityName);
    }

    try {
      // Check if query is a pincode
      if (isPincodeQuery(cityName)) {
        const pinLoc = await getPincodeLocation(cityName);
        if (pinLoc) {
          return await getWeatherByCoords(pinLoc.lat, pinLoc.lon, pinLoc);
        }
      }

      // Geocode City Name via Open-Meteo
      const geoUrl = `${CONFIG.openMeteoGeoUrl}?name=${encodeURIComponent(cityName)}&count=8&language=en&format=json`;
      const geoRes = await _fetchJSON(geoUrl);

      let location = null;
      if (geoRes && geoRes.results && geoRes.results.length > 0) {
        // Prioritize India match
        const indianMatch = geoRes.results.find(r => r.country_code === 'IN' || r.country === 'India');
        location = indianMatch || geoRes.results[0];
      }

      if (!location) {
        // Try pincode resolution fallback
        const pinLoc = await getPincodeLocation(cityName);
        if (pinLoc) {
          return await getWeatherByCoords(pinLoc.lat, pinLoc.lon, pinLoc);
        }
        return MockData.getWeatherData(cityName);
      }

      const cityInfo = {
        name: location.name,
        country: location.country || (location.country_code === 'IN' ? 'India' : ''),
        state: location.admin1 || '',
        lat: location.latitude,
        lon: location.longitude,
      };

      return await getWeatherByCoords(cityInfo.lat, cityInfo.lon, cityInfo);

    } catch (error) {
      console.warn('Live API fetch failed, resorting to mock fallback:', error.message);
      return MockData.getWeatherData(cityName);
    }
  }

  /* ──────────────────────────────────────────
     PUBLIC: Get Weather by Coordinates
     ────────────────────────────────────────── */

  async function getWeatherByCoords(lat, lon, cityInfo = null) {
    if (_isMockData()) {
      await _simulateDelay(300);
      const nearest = MockData.ALL_CITIES.reduce((best, city) => {
        const dist = Math.sqrt((city.lat - lat) ** 2 + (city.lon - lon) ** 2);
        return dist < best.dist ? { city, dist } : best;
      }, { city: null, dist: Infinity });

      if (nearest.city) {
        return MockData.getWeatherData(nearest.city.city);
      }
      return MockData.getWeatherData('New Delhi');
    }

    try {
      const forecastUrl = `${CONFIG.openMeteoForecastUrl}?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,weathercode,surface_pressure,windspeed_10m,winddirection_10m,uv_index&daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max&timezone=auto`;
      const airUrl = `${CONFIG.openMeteoAirUrl}?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,ozone,sulphur_dioxide`;

      const [forecast, airData] = await Promise.all([
        _fetchJSON(forecastUrl),
        _fetchJSON(airUrl).catch(() => null),
      ]);

      if (!cityInfo) {
        cityInfo = {
          name: 'Current Location',
          country: 'India',
          lat,
          lon,
        };
      }

      return _normalizeOpenMeteoData(forecast, airData, cityInfo);

    } catch (error) {
      console.warn('Coordinate forecast fetch failed, resorting to mock fallback:', error.message);
      const nearest = MockData.ALL_CITIES.reduce((best, city) => {
        const dist = Math.sqrt((city.lat - lat) ** 2 + (city.lon - lon) ** 2);
        return dist < best.dist ? { city, dist } : best;
      }, { city: null, dist: Infinity });

      if (nearest.city) {
        return MockData.getWeatherData(nearest.city.city);
      }
      return MockData.getWeatherData('New Delhi');
    }
  }

  /* ──────────────────────────────────────────
     PUBLIC: Search Cities & Pincodes
     ────────────────────────────────────────── */

  async function searchCities(query) {
    if (!query || query.trim().length < 1) return [];

    const clean = query.trim();

    // Check pincode queries
    if (isPincodeQuery(clean)) {
      try {
        const pinLoc = await getPincodeLocation(clean);
        if (pinLoc) {
          const results = [
            {
              city: pinLoc.city || pinLoc.name,
              country: pinLoc.country,
              state: pinLoc.state,
              pincode: pinLoc.pincode,
              isPincode: true,
              lat: pinLoc.lat,
              lon: pinLoc.lon,
            }
          ];

          // Also combine with city local matches if available
          const localMatches = MockData.searchCities(clean);
          return [...results, ...localMatches].slice(0, 8);
        }
      } catch (e) {
        console.warn('Pincode search error:', e.message);
      }
    }

    // Instant match from local database (60+ Indian cities and pincodes)
    const localMatches = MockData.searchCities(clean);
    if (localMatches.length > 0) {
      return localMatches;
    }

    try {
      const url = `${CONFIG.openMeteoGeoUrl}?name=${encodeURIComponent(clean)}&count=10&language=en&format=json`;
      const data = await _fetchJSON(url);

      if (data && data.results && data.results.length > 0) {
        const mapped = data.results.map((item) => ({
          city: item.name,
          country: item.country || (item.country_code === 'IN' ? 'India' : ''),
          state: item.admin1 || '',
          lat: item.latitude,
          lon: item.longitude,
        }));

        mapped.sort((a, b) => {
          if (a.country === 'India' && b.country !== 'India') return -1;
          if (a.country !== 'India' && b.country === 'India') return 1;
          return 0;
        });

        return mapped.slice(0, 8);
      }
    } catch (e) {
      // Fallback
    }

    return localMatches;
  }

  /* ──────────────────────────────────────────
     PUBLIC: Get User's Current Location
     ────────────────────────────────────────── */

  function getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              reject(new Error('Location permission denied. Please enable it in browser settings.'));
              break;
            case error.POSITION_UNAVAILABLE:
              reject(new Error('Location information unavailable.'));
              break;
            case error.TIMEOUT:
              reject(new Error('Location request timed out.'));
              break;
            default:
              reject(new Error('Location error occurred.'));
          }
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
      );
    });
  }

  /* ── Public API ── */
  return {
    getWeatherByCity,
    getWeatherByCoords,
    searchCities,
    getCurrentLocation,
    CONFIG,
  };
})();
