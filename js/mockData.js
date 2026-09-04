/* ============================================================
   WEATHER APP — Mock Data (Realistic Demo Data)
   ============================================================ */

const MockData = (() => {

  /* ──────────────────────────────────────────
     HELPER: Generate hourly forecast from base values
     ────────────────────────────────────────── */
  function _generateHourly(baseTemp, tempVariation, baseCondition, conditionChanges, baseRainChance, now) {
    const hours = [];
    for (let i = 0; i < 24; i++) {
      const time = new Date(now);
      time.setMinutes(0, 0, 0);
      time.setHours(time.getHours() + i);
      const hour = time.getHours();
      const isDay = hour >= 6 && hour < 19;

      // Temperature curve: cooler at night, warmer during day
      const nightDip = (hour >= 0 && hour < 6) ? -3 :
                       (hour >= 6 && hour < 10) ? -1 :
                       (hour >= 10 && hour < 15) ? 2 :
                       (hour >= 15 && hour < 19) ? 1 : -2;
      const temp = baseTemp + nightDip + (Math.random() * tempVariation - tempVariation / 2);

      // Condition changes at specified hours
      let condition = baseCondition;
      for (const change of conditionChanges) {
        if (i >= change.afterHour) condition = change.condition;
      }

      const rainChance = condition.toLowerCase().includes('rain')
        ? Math.min(90, baseRainChance + 20 + Math.floor(Math.random() * 20))
        : Math.max(0, baseRainChance - 10 + Math.floor(Math.random() * 15));

      hours.push({
        time: time.toISOString(),
        temp: Math.round(temp),
        condition,
        rainChance,
        isDay,
        windSpeed: 8 + Math.floor(Math.random() * 15),
        humidity: 40 + Math.floor(Math.random() * 40),
      });
    }
    return hours;
  }

  /* ──────────────────────────────────────────
     HELPER: Generate daily forecast
     ────────────────────────────────────────── */
  function _generateDaily(baseHigh, baseLow, conditions, now) {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      const condData = conditions[i % conditions.length];
      const variation = Math.floor(Math.random() * 3) - 1;
      days.push({
        date: date.toISOString(),
        high: baseHigh + variation + (i < 3 ? 0 : -1),
        low: baseLow + variation,
        condition: condData.condition,
        rainChance: condData.rainChance,
        description: condData.description,
        windSpeed: 8 + Math.floor(Math.random() * 18),
        humidity: 40 + Math.floor(Math.random() * 35),
      });
    }
    return days;
  }

  /* ──────────────────────────────────────────
     CITY DATA
     ────────────────────────────────────────── */

  const now = new Date();

  const CITIES = {
    'New Delhi': {
      city: 'New Delhi',
      country: 'India',
      state: 'Delhi',
      lat: 28.6139,
      lon: 77.2090,
      timezone: 'Asia/Kolkata',
      current: {
        temp: 30,
        feelsLike: 33,
        high: 33,
        low: 26,
        condition: 'Partly Cloudy',
        description: 'Partly cloudy skies with warm temperatures. Monsoon showers possible later tonight.',
        humidity: 72,
        windSpeed: 14,
        windDeg: 210,
        pressure: 1006,
        visibility: 8,
        uvIndex: 6,
        dewPoint: 24,
        cloudCover: 45,
        rainChance: 35,
        sunrise: (() => { const d = new Date(now); d.setHours(6, 5, 0); return d.toISOString(); })(),
        sunset: (() => { const d = new Date(now); d.setHours(18, 32, 0); return d.toISOString(); })(),
        isDay: now.getHours() >= 6 && now.getHours() < 19,
        lastUpdated: now.toISOString(),
      },
      hourly: _generateHourly(30, 3, 'Partly Cloudy', [
        { afterHour: 6, condition: 'Cloudy' },
        { afterHour: 10, condition: 'Light Rain' },
        { afterHour: 14, condition: 'Partly Cloudy' },
      ], 35, now),
      daily: _generateDaily(33, 26, [
        { condition: 'Partly Cloudy', rainChance: 35, description: 'Warm with passing clouds' },
        { condition: 'Rain', rainChance: 70, description: 'Monsoon showers expected' },
        { condition: 'Thunderstorm', rainChance: 85, description: 'Heavy rain with thunderstorms' },
        { condition: 'Cloudy', rainChance: 50, description: 'Overcast with light rain' },
        { condition: 'Partly Cloudy', rainChance: 30, description: 'Clearing skies' },
        { condition: 'Sunny', rainChance: 10, description: 'Hot and sunny' },
        { condition: 'Partly Cloudy', rainChance: 25, description: 'Pleasant with some clouds' },
      ], now),
      airQuality: {
        aqi: 142,
        pm25: 55.2,
        pm10: 98.4,
        co: 1.2,
        no2: 38.5,
        o3: 72.1,
        so2: 12.3,
      },
      alerts: [
        {
          type: 'warning',
          title: 'Heavy Rain Alert',
          description: 'Heavy monsoon rainfall expected tonight. Stay indoors and avoid waterlogged areas.',
          severity: 'moderate',
          time: (() => { const d = new Date(now); d.setHours(22, 0, 0); return d.toISOString(); })(),
          icon: '🌧️',
        },
      ],
    },

    'Mumbai': {
      city: 'Mumbai',
      country: 'India',
      state: 'Maharashtra',
      lat: 19.0760,
      lon: 72.8777,
      timezone: 'Asia/Kolkata',
      current: {
        temp: 28,
        feelsLike: 32,
        high: 30,
        low: 25,
        condition: 'Rain',
        description: 'Moderate monsoon rainfall. High humidity and warm temperatures throughout the day.',
        humidity: 88,
        windSpeed: 22,
        windDeg: 250,
        pressure: 1004,
        visibility: 4,
        uvIndex: 3,
        dewPoint: 25,
        cloudCover: 90,
        rainChance: 80,
        sunrise: (() => { const d = new Date(now); d.setHours(6, 22, 0); return d.toISOString(); })(),
        sunset: (() => { const d = new Date(now); d.setHours(18, 48, 0); return d.toISOString(); })(),
        isDay: now.getHours() >= 6 && now.getHours() < 19,
        lastUpdated: now.toISOString(),
      },
      hourly: _generateHourly(28, 2, 'Rain', [
        { afterHour: 4, condition: 'Heavy Rain' },
        { afterHour: 8, condition: 'Rain' },
        { afterHour: 16, condition: 'Cloudy' },
        { afterHour: 20, condition: 'Light Rain' },
      ], 80, now),
      daily: _generateDaily(30, 25, [
        { condition: 'Rain', rainChance: 80, description: 'Persistent monsoon rain' },
        { condition: 'Heavy Rain', rainChance: 90, description: 'Very heavy rainfall' },
        { condition: 'Rain', rainChance: 75, description: 'Moderate to heavy rain' },
        { condition: 'Cloudy', rainChance: 55, description: 'Overcast, occasional showers' },
        { condition: 'Rain', rainChance: 70, description: 'Rain continues' },
        { condition: 'Partly Cloudy', rainChance: 40, description: 'Brief respite from rain' },
        { condition: 'Rain', rainChance: 65, description: 'Showers return' },
      ], now),
      airQuality: {
        aqi: 88,
        pm25: 28.5,
        pm10: 52.3,
        co: 0.8,
        no2: 24.1,
        o3: 48.6,
        so2: 8.7,
      },
      alerts: [
        {
          type: 'danger',
          title: 'Flood Warning',
          description: 'Low-lying areas may experience waterlogging. Avoid unnecessary travel.',
          severity: 'high',
          time: now.toISOString(),
          icon: '⚠️',
        },
      ],
    },

    'Bengaluru': {
      city: 'Bengaluru',
      country: 'India',
      state: 'Karnataka',
      lat: 12.9716,
      lon: 77.5946,
      timezone: 'Asia/Kolkata',
      current: {
        temp: 24,
        feelsLike: 25,
        high: 27,
        low: 20,
        condition: 'Partly Cloudy',
        description: 'Pleasant weather with mild temperatures. Light breeze from the west.',
        humidity: 65,
        windSpeed: 12,
        windDeg: 270,
        pressure: 1012,
        visibility: 10,
        uvIndex: 4,
        dewPoint: 18,
        cloudCover: 40,
        rainChance: 25,
        sunrise: (() => { const d = new Date(now); d.setHours(6, 12, 0); return d.toISOString(); })(),
        sunset: (() => { const d = new Date(now); d.setHours(18, 22, 0); return d.toISOString(); })(),
        isDay: now.getHours() >= 6 && now.getHours() < 19,
        lastUpdated: now.toISOString(),
      },
      hourly: _generateHourly(24, 2, 'Partly Cloudy', [
        { afterHour: 8, condition: 'Cloudy' },
        { afterHour: 14, condition: 'Light Rain' },
        { afterHour: 18, condition: 'Partly Cloudy' },
      ], 25, now),
      daily: _generateDaily(27, 20, [
        { condition: 'Partly Cloudy', rainChance: 25, description: 'Pleasant day' },
        { condition: 'Cloudy', rainChance: 45, description: 'Overcast skies' },
        { condition: 'Rain', rainChance: 60, description: 'Afternoon showers likely' },
        { condition: 'Partly Cloudy', rainChance: 30, description: 'Clearing up' },
        { condition: 'Sunny', rainChance: 10, description: 'Bright and pleasant' },
        { condition: 'Partly Cloudy', rainChance: 20, description: 'Fair weather' },
        { condition: 'Cloudy', rainChance: 40, description: 'Clouds building up' },
      ], now),
      airQuality: {
        aqi: 65,
        pm25: 18.3,
        pm10: 38.7,
        co: 0.5,
        no2: 18.2,
        o3: 42.4,
        so2: 5.6,
      },
      alerts: [],
    },

    'Ahmedabad': {
      city: 'Ahmedabad',
      country: 'India',
      state: 'Gujarat',
      lat: 23.0225,
      lon: 72.5714,
      timezone: 'Asia/Kolkata',
      current: {
        temp: 32,
        feelsLike: 36,
        high: 35,
        low: 26,
        condition: 'Sunny',
        description: 'Warm and sunny day with light winds. High humidity in evening hours.',
        humidity: 60,
        windSpeed: 16,
        windDeg: 230,
        pressure: 1008,
        visibility: 9,
        uvIndex: 8,
        dewPoint: 22,
        cloudCover: 20,
        rainChance: 15,
        sunrise: (() => { const d = new Date(now); d.setHours(6, 18, 0); return d.toISOString(); })(),
        sunset: (() => { const d = new Date(now); d.setHours(18, 50, 0); return d.toISOString(); })(),
        isDay: now.getHours() >= 6 && now.getHours() < 19,
        lastUpdated: now.toISOString(),
      },
      hourly: _generateHourly(32, 4, 'Sunny', [
        { afterHour: 12, condition: 'Sunny' },
        { afterHour: 17, condition: 'Partly Cloudy' }
      ], 15, now),
      daily: _generateDaily(35, 26, [
        { condition: 'Sunny', rainChance: 15, description: 'Hot and sunny' },
        { condition: 'Partly Cloudy', rainChance: 25, description: 'Passing clouds' },
        { condition: 'Sunny', rainChance: 10, description: 'Clear skies' },
        { condition: 'Cloudy', rainChance: 30, description: 'Overcast afternoon' },
        { condition: 'Sunny', rainChance: 10, description: 'Sunny weather' },
        { condition: 'Partly Cloudy', rainChance: 20, description: 'Warm and pleasant' },
        { condition: 'Sunny', rainChance: 5, description: 'Clear sunny sky' }
      ], now),
      airQuality: { aqi: 110, pm25: 39.0, pm10: 75.0, co: 0.9, no2: 28.0, o3: 55.0, so2: 9.5 },
      alerts: []
    },

    'Jaipur': {
      city: 'Jaipur',
      country: 'India',
      state: 'Rajasthan',
      lat: 26.9124,
      lon: 75.7873,
      timezone: 'Asia/Kolkata',
      current: {
        temp: 31,
        feelsLike: 34,
        high: 34,
        low: 25,
        condition: 'Sunny',
        description: 'Sunny skies in the Pink City with mild afternoon breeze.',
        humidity: 55,
        windSpeed: 14,
        windDeg: 200,
        pressure: 1007,
        visibility: 10,
        uvIndex: 7,
        dewPoint: 20,
        cloudCover: 15,
        rainChance: 10,
        sunrise: (() => { const d = new Date(now); d.setHours(6, 10, 0); return d.toISOString(); })(),
        sunset: (() => { const d = new Date(now); d.setHours(18, 40, 0); return d.toISOString(); })(),
        isDay: now.getHours() >= 6 && now.getHours() < 19,
        lastUpdated: now.toISOString(),
      },
      hourly: _generateHourly(31, 3, 'Sunny', [], 10, now),
      daily: _generateDaily(34, 25, [
        { condition: 'Sunny', rainChance: 10, description: 'Bright pink sky' },
        { condition: 'Sunny', rainChance: 10, description: 'Warm and dry' },
        { condition: 'Partly Cloudy', rainChance: 20, description: 'Scattered clouds' },
        { condition: 'Sunny', rainChance: 5, description: 'Clear day' },
        { condition: 'Sunny', rainChance: 15, description: 'Pleasant day' },
        { condition: 'Partly Cloudy', rainChance: 25, description: 'Some clouds' },
        { condition: 'Sunny', rainChance: 10, description: 'Sunny weather' }
      ], now),
      airQuality: { aqi: 125, pm25: 45.0, pm10: 88.0, co: 1.0, no2: 32.0, o3: 60.0, so2: 11.0 },
      alerts: []
    },

    'Kolkata': {
      city: 'Kolkata',
      country: 'India',
      state: 'West Bengal',
      lat: 22.5726,
      lon: 88.3639,
      timezone: 'Asia/Kolkata',
      current: {
        temp: 31,
        feelsLike: 37,
        high: 33,
        low: 27,
        condition: 'Thunderstorm',
        description: 'Humid weather with thundershowers expected in the evening.',
        humidity: 82,
        windSpeed: 18,
        windDeg: 160,
        pressure: 1005,
        visibility: 6,
        uvIndex: 5,
        dewPoint: 26,
        cloudCover: 75,
        rainChance: 70,
        sunrise: (() => { const d = new Date(now); d.setHours(5, 20, 0); return d.toISOString(); })(),
        sunset: (() => { const d = new Date(now); d.setHours(17, 50, 0); return d.toISOString(); })(),
        isDay: now.getHours() >= 5 && now.getHours() < 18,
        lastUpdated: now.toISOString(),
      },
      hourly: _generateHourly(31, 3, 'Thunderstorm', [
        { afterHour: 10, condition: 'Rain' },
        { afterHour: 16, condition: 'Thunderstorm' }
      ], 70, now),
      daily: _generateDaily(33, 27, [
        { condition: 'Thunderstorm', rainChance: 70, description: 'Thundershowers' },
        { condition: 'Rain', rainChance: 80, description: 'Heavy monsoon rain' },
        { condition: 'Cloudy', rainChance: 50, description: 'Overcast' },
        { condition: 'Rain', rainChance: 65, description: 'Showers' },
        { condition: 'Partly Cloudy', rainChance: 35, description: 'Humid' },
        { condition: 'Rain', rainChance: 60, description: 'Scattered rain' },
        { condition: 'Thunderstorm', rainChance: 75, description: 'Storms' }
      ], now),
      airQuality: { aqi: 105, pm25: 37.0, pm10: 72.0, co: 0.9, no2: 30.0, o3: 50.0, so2: 10.0 },
      alerts: []
    },

    'Chennai': {
      city: 'Chennai',
      country: 'India',
      state: 'Tamil Nadu',
      lat: 13.0827,
      lon: 80.2707,
      timezone: 'Asia/Kolkata',
      current: {
        temp: 32,
        feelsLike: 38,
        high: 34,
        low: 27,
        condition: 'Partly Cloudy',
        description: 'Hot and humid sea breeze along the Coromandel coast.',
        humidity: 78,
        windSpeed: 20,
        windDeg: 140,
        pressure: 1008,
        visibility: 9,
        uvIndex: 7,
        dewPoint: 25,
        cloudCover: 35,
        rainChance: 30,
        sunrise: (() => { const d = new Date(now); d.setHours(6, 0, 0); return d.toISOString(); })(),
        sunset: (() => { const d = new Date(now); d.setHours(18, 15, 0); return d.toISOString(); })(),
        isDay: now.getHours() >= 6 && now.getHours() < 18,
        lastUpdated: now.toISOString(),
      },
      hourly: _generateHourly(32, 2, 'Partly Cloudy', [], 30, now),
      daily: _generateDaily(34, 27, [
        { condition: 'Partly Cloudy', rainChance: 30, description: 'Humid coastal weather' },
        { condition: 'Rain', rainChance: 50, description: 'Coastal rain showers' },
        { condition: 'Partly Cloudy', rainChance: 25, description: 'Warm and sunny' },
        { condition: 'Sunny', rainChance: 15, description: 'Hot day' },
        { condition: 'Rain', rainChance: 45, description: 'Evening showers' },
        { condition: 'Partly Cloudy', rainChance: 30, description: 'Passing clouds' },
        { condition: 'Sunny', rainChance: 20, description: 'Warm weather' }
      ], now),
      airQuality: { aqi: 75, pm25: 24.0, pm10: 48.0, co: 0.6, no2: 20.0, o3: 45.0, so2: 7.0 },
      alerts: []
    },

    'Hyderabad': {
      city: 'Hyderabad',
      country: 'India',
      state: 'Telangana',
      lat: 17.3850,
      lon: 78.4867,
      timezone: 'Asia/Kolkata',
      current: {
        temp: 29,
        feelsLike: 32,
        high: 31,
        low: 23,
        condition: 'Partly Cloudy',
        description: 'Pleasant weather with mild breeze across the Deccan plateau.',
        humidity: 68,
        windSpeed: 14,
        windDeg: 240,
        pressure: 1010,
        visibility: 10,
        uvIndex: 6,
        dewPoint: 21,
        cloudCover: 40,
        rainChance: 30,
        sunrise: (() => { const d = new Date(now); d.setHours(6, 8, 0); return d.toISOString(); })(),
        sunset: (() => { const d = new Date(now); d.setHours(18, 25, 0); return d.toISOString(); })(),
        isDay: now.getHours() >= 6 && now.getHours() < 18,
        lastUpdated: now.toISOString(),
      },
      hourly: _generateHourly(29, 3, 'Partly Cloudy', [], 30, now),
      daily: _generateDaily(31, 23, [
        { condition: 'Partly Cloudy', rainChance: 30, description: 'Pleasant day' },
        { condition: 'Rain', rainChance: 55, description: 'Monsoon drizzle' },
        { condition: 'Cloudy', rainChance: 40, description: 'Overcast' },
        { condition: 'Sunny', rainChance: 15, description: 'Bright day' },
        { condition: 'Partly Cloudy', rainChance: 25, description: 'Fair weather' },
        { condition: 'Rain', rainChance: 50, description: 'Light showers' },
        { condition: 'Partly Cloudy', rainChance: 20, description: 'Pleasant' }
      ], now),
      airQuality: { aqi: 90, pm25: 31.0, pm10: 60.0, co: 0.7, no2: 25.0, o3: 48.0, so2: 8.0 },
      alerts: []
    },

    'London': {
      city: 'London',
      country: 'United Kingdom',
      state: 'England',
      lat: 51.5074,
      lon: -0.1278,
      timezone: 'Europe/London',
      current: {
        temp: 18,
        feelsLike: 17,
        high: 20,
        low: 13,
        condition: 'Cloudy',
        description: 'Overcast skies typical of early autumn. Cool temperatures with a gentle breeze.',
        humidity: 75,
        windSpeed: 18,
        windDeg: 220,
        pressure: 1015,
        visibility: 12,
        uvIndex: 3,
        dewPoint: 14,
        cloudCover: 80,
        rainChance: 40,
        sunrise: (() => { const d = new Date(now); d.setHours(6, 18, 0); return d.toISOString(); })(),
        sunset: (() => { const d = new Date(now); d.setHours(19, 42, 0); return d.toISOString(); })(),
        isDay: now.getHours() >= 6 && now.getHours() < 20,
        lastUpdated: now.toISOString(),
      },
      hourly: _generateHourly(18, 2, 'Cloudy', [], 40, now),
      daily: _generateDaily(20, 13, [
        { condition: 'Cloudy', rainChance: 40, description: 'Grey and overcast' },
        { condition: 'Rain', rainChance: 65, description: 'Rain throughout day' },
        { condition: 'Partly Cloudy', rainChance: 30, description: 'Some sunshine' }
      ], now),
      airQuality: { aqi: 42, pm25: 10.2, pm10: 18.5, co: 0.3, no2: 15.1, o3: 35.2, so2: 3.4 },
      alerts: []
    }
  };

  /* ──────────────────────────────────────────
     AUTOCOMPLETE CITY LIST (Comprehensive Indian & International)
     ────────────────────────────────────────── */

  const ALL_CITIES = [
    // --- TOP INDIAN CITIES ---
    { city: 'New Delhi', country: 'India', state: 'Delhi', lat: 28.6139, lon: 77.2090 },
    { city: 'Mumbai', country: 'India', state: 'Maharashtra', lat: 19.0760, lon: 72.8777 },
    { city: 'Bengaluru', country: 'India', state: 'Karnataka', lat: 12.9716, lon: 77.5946 },
    { city: 'Ahmedabad', country: 'India', state: 'Gujarat', lat: 23.0225, lon: 72.5714 },
    { city: 'Surat', country: 'India', state: 'Gujarat', lat: 21.1702, lon: 72.8311 },
    { city: 'Vadodara', country: 'India', state: 'Gujarat', lat: 22.3072, lon: 73.1812 },
    { city: 'Rajkot', country: 'India', state: 'Gujarat', lat: 22.3039, lon: 70.8022 },
    { city: 'Chennai', country: 'India', state: 'Tamil Nadu', lat: 13.0827, lon: 80.2707 },
    { city: 'Kolkata', country: 'India', state: 'West Bengal', lat: 22.5726, lon: 88.3639 },
    { city: 'Hyderabad', country: 'India', state: 'Telangana', lat: 17.3850, lon: 78.4867 },
    { city: 'Pune', country: 'India', state: 'Maharashtra', lat: 18.5204, lon: 73.8567 },
    { city: 'Nagpur', country: 'India', state: 'Maharashtra', lat: 21.1458, lon: 79.0882 },
    { city: 'Thane', country: 'India', state: 'Maharashtra', lat: 19.2183, lon: 72.9781 },
    { city: 'Nashik', country: 'India', state: 'Maharashtra', lat: 20.0059, lon: 73.7898 },
    { city: 'Jaipur', country: 'India', state: 'Rajasthan', lat: 26.9124, lon: 75.7873 },
    { city: 'Jodhpur', country: 'India', state: 'Rajasthan', lat: 26.2389, lon: 73.0243 },
    { city: 'Udaipur', country: 'India', state: 'Rajasthan', lat: 24.5854, lon: 73.7125 },
    { city: 'Kota', country: 'India', state: 'Rajasthan', lat: 25.2138, lon: 75.8648 },
    { city: 'Lucknow', country: 'India', state: 'Uttar Pradesh', lat: 26.8467, lon: 80.9462 },
    { city: 'Kanpur', country: 'India', state: 'Uttar Pradesh', lat: 26.4499, lon: 80.3319 },
    { city: 'Agra', country: 'India', state: 'Uttar Pradesh', lat: 27.1767, lon: 78.0081 },
    { city: 'Varanasi', country: 'India', state: 'Uttar Pradesh', lat: 25.3176, lon: 82.9739 },
    { city: 'Prayagraj', country: 'India', state: 'Uttar Pradesh', lat: 25.4358, lon: 81.8463 },
    { city: 'Noida', country: 'India', state: 'Uttar Pradesh', lat: 28.5355, lon: 77.3910 },
    { city: 'Ghaziabad', country: 'India', state: 'Uttar Pradesh', lat: 28.6692, lon: 77.4538 },
    { city: 'Gurugram', country: 'India', state: 'Haryana', lat: 28.4595, lon: 77.0266 },
    { city: 'Chandigarh', country: 'India', state: 'Punjab & Haryana', lat: 30.7333, lon: 76.7794 },
    { city: 'Ludhiana', country: 'India', state: 'Punjab', lat: 30.9010, lon: 75.8573 },
    { city: 'Amritsar', country: 'India', state: 'Punjab', lat: 31.6340, lon: 74.8723 },
    { city: 'Dehradun', country: 'India', state: 'Uttarakhand', lat: 30.3165, lon: 78.0322 },
    { city: 'Shimla', country: 'India', state: 'Himachal Pradesh', lat: 31.1048, lon: 77.1734 },
    { city: 'Srinagar', country: 'India', state: 'Jammu & Kashmir', lat: 34.0837, lon: 74.7973 },
    { city: 'Jammu', country: 'India', state: 'Jammu & Kashmir', lat: 32.7266, lon: 74.8570 },
    { city: 'Patna', country: 'India', state: 'Bihar', lat: 25.5941, lon: 85.1376 },
    { city: 'Gaya', country: 'India', state: 'Bihar', lat: 24.7914, lon: 85.0002 },
    { city: 'Ranchi', country: 'India', state: 'Jharkhand', lat: 23.3441, lon: 85.3096 },
    { city: 'Jamshedpur', country: 'India', state: 'Jharkhand', lat: 22.8046, lon: 86.2029 },
    { city: 'Bhubaneswar', country: 'India', state: 'Odisha', lat: 20.2961, lon: 85.8245 },
    { city: 'Cuttack', country: 'India', state: 'Odisha', lat: 20.4625, lon: 85.8828 },
    { city: 'Guwahati', country: 'India', state: 'Assam', lat: 26.1445, lon: 91.7362 },
    { city: 'Shillong', country: 'India', state: 'Meghalaya', lat: 25.5788, lon: 91.8933 },
    { city: 'Gangtok', country: 'India', state: 'Sikkim', lat: 27.3389, lon: 88.6065 },
    { city: 'Bhopal', country: 'India', state: 'Madhya Pradesh', lat: 23.2599, lon: 77.4126 },
    { city: 'Indore', country: 'India', state: 'Madhya Pradesh', lat: 22.7196, lon: 75.8577 },
    { city: 'Gwalior', country: 'India', state: 'Madhya Pradesh', lat: 26.2183, lon: 78.1828 },
    { city: 'Raipur', country: 'India', state: 'Chhattisgarh', lat: 21.2514, lon: 81.6296 },
    { city: 'Kochi', country: 'India', state: 'Kerala', lat: 9.9312, lon: 76.2673 },
    { city: 'Thiruvananthapuram', country: 'India', state: 'Kerala', lat: 8.5241, lon: 76.9366 },
    { city: 'Kozhikode', country: 'India', state: 'Kerala', lat: 11.2588, lon: 75.7804 },
    { city: 'Coimbatore', country: 'India', state: 'Tamil Nadu', lat: 11.0168, lon: 76.9558 },
    { city: 'Madurai', country: 'India', state: 'Tamil Nadu', lat: 9.9252, lon: 78.1198 },
    { city: 'Mysore', country: 'India', state: 'Karnataka', lat: 12.2958, lon: 76.6394 },
    { city: 'Mangaluru', country: 'India', state: 'Karnataka', lat: 12.9141, lon: 74.8560 },
    { city: 'Visakhapatnam', country: 'India', state: 'Andhra Pradesh', lat: 17.6868, lon: 83.2185 },
    { city: 'Vijayawada', country: 'India', state: 'Andhra Pradesh', lat: 16.5062, lon: 80.6480 },
    { city: 'Puducherry', country: 'India', state: 'Puducherry', lat: 11.9416, lon: 79.8083 },

    // --- INTERNATIONAL CITIES ---
    { city: 'London', country: 'United Kingdom', state: 'England', lat: 51.5074, lon: -0.1278 },
    { city: 'New York', country: 'United States', state: 'New York', lat: 40.7128, lon: -74.0060 },
    { city: 'Tokyo', country: 'Japan', state: 'Kanto', lat: 35.6762, lon: 139.6503 },
    { city: 'Dubai', country: 'UAE', state: 'Dubai', lat: 25.2048, lon: 55.2708 },
    { city: 'Singapore', country: 'Singapore', state: '', lat: 1.3521, lon: 103.8198 },
    { city: 'Paris', country: 'France', state: 'Île-de-France', lat: 48.8566, lon: 2.3522 },
    { city: 'Sydney', country: 'Australia', state: 'New South Wales', lat: -33.8688, lon: 151.2093 },
    { city: 'Toronto', country: 'Canada', state: 'Ontario', lat: 43.6532, lon: -79.3832 },
  ];

  /* ──────────────────────────────────────────
     MOCK PINCODES (Worldwide pincode map)
     ────────────────────────────────────────── */

  const MOCK_PINCODES = {
    '110001': { exactPlace: 'Connaught Place', district: 'Central Delhi', city: 'Connaught Place, Central Delhi', country: 'India', state: 'Delhi', pincode: '110001', postOffices: ['Connaught Place H.O', 'Janpath', 'Parliament Street', 'Pragati Maidan'], lat: 28.6315, lon: 77.2167 },
    '400001': { exactPlace: 'Fort / Colaba', district: 'Mumbai City', city: 'Fort, Mumbai', country: 'India', state: 'Maharashtra', pincode: '400001', postOffices: ['Mumbai G.P.O.', 'Fort', 'Bazargate', 'Stock Exchange'], lat: 18.9333, lon: 72.8333 },
    '560001': { exactPlace: 'MG Road / Brigade Road', district: 'Bengaluru Urban', city: 'MG Road, Bengaluru', country: 'India', state: 'Karnataka', pincode: '560001', postOffices: ['Bangalore G.P.O.', 'Museum Road', 'Raj Bhavan'], lat: 12.9750, lon: 77.6083 },
    '700001': { exactPlace: 'BBD Bagh', district: 'Kolkata', city: 'BBD Bagh, Kolkata', country: 'India', state: 'West Bengal', pincode: '700001', postOffices: ['Kolkata G.P.O.', 'Dalhousie Square', 'Lalbazar'], lat: 22.5726, lon: 88.3510 },
    '600001': { exactPlace: 'George Town', district: 'Chennai', city: 'George Town, Chennai', country: 'India', state: 'Tamil Nadu', pincode: '600001', postOffices: ['Chennai G.P.O.', 'High Court', 'Muthialpet'], lat: 13.0889, lon: 80.2889 },
    '500001': { exactPlace: 'Abids / Nampally', district: 'Hyderabad', city: 'Abids, Hyderabad', country: 'India', state: 'Telangana', pincode: '500001', postOffices: ['Hyderabad G.P.O.', 'Abids', 'Gunfoundry'], lat: 17.3850, lon: 78.4867 },
    '302001': { exactPlace: 'Pink City / Johari Bazaar', district: 'Jaipur', city: 'Pink City, Jaipur', country: 'India', state: 'Rajasthan', pincode: '302001', postOffices: ['Jaipur G.P.O.', 'City Palace', 'Tripolia Bazaar'], lat: 26.9124, lon: 75.7873 },
    '208001': { exactPlace: 'Civil Lines', district: 'Kanpur Nagar', city: 'Civil Lines, Kanpur', country: 'India', state: 'Uttar Pradesh', pincode: '208001', postOffices: ['Kanpur H.O.', 'Civil Lines', 'Mall Road'], lat: 26.4499, lon: 80.3319 },
    '110016': { exactPlace: 'Hauz Khas / IIT Delhi', district: 'South Delhi', city: 'Hauz Khas, South Delhi', country: 'India', state: 'Delhi', pincode: '110016', postOffices: ['Hauz Khas', 'IIT Delhi', 'Green Park'], lat: 28.5494, lon: 77.2001 },
    '400050': { exactPlace: 'Bandra West', district: 'Mumbai Suburban', city: 'Bandra West, Mumbai', country: 'India', state: 'Maharashtra', pincode: '400050', postOffices: ['Bandra West', 'Pali Hill', 'Turner Road'], lat: 19.0596, lon: 72.8295 },
  };

  /* ──────────────────────────────────────────
     PUBLIC API
     ────────────────────────────────────────── */

  function getWeatherData(cityName) {
    const cleanName = (cityName || '').trim();
    // Check if pincode direct match
    const pinKey = Object.keys(MOCK_PINCODES).find(
      (k) => k.toLowerCase() === cleanName.toLowerCase()
    );
    if (pinKey) {
      const pinData = MOCK_PINCODES[pinKey];
      const baseData = _generateCityData(pinData);
      baseData.pincode = pinData.pincode;
      baseData.exactPlace = pinData.exactPlace;
      baseData.district = pinData.district;
      baseData.postOffices = pinData.postOffices;
      baseData.isIndianPin = true;
      return baseData;
    }

    const key = Object.keys(CITIES).find(
      (k) => k.toLowerCase() === cleanName.toLowerCase()
    );
    if (key) return CITIES[key];

    // For cities we don't have hand-crafted static data for, generate realistic dynamic data
    const cityInfo = ALL_CITIES.find(
      (c) => c.city.toLowerCase() === cleanName.toLowerCase()
    ) || { city: cleanName, country: 'India', state: '', lat: 20.5937, lon: 78.9629 };

    return _generateCityData(cityInfo);
  }

  function searchCities(query) {
    if (!query || query.length < 1) return [];
    const q = query.trim().toLowerCase();

    // Check pincode matches first
    const pincodeMatches = Object.values(MOCK_PINCODES).filter(
      (p) => p.pincode.toLowerCase().includes(q) || p.city.toLowerCase().includes(q)
    ).map(p => ({
      city: p.city,
      country: p.country,
      state: p.state,
      pincode: p.pincode,
      isPincode: true,
      lat: p.lat,
      lon: p.lon,
    }));

    const cityMatches = ALL_CITIES.filter(
      (c) =>
        c.city.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        c.state.toLowerCase().includes(q)
    ).slice(0, 8);

    return [...pincodeMatches, ...cityMatches].slice(0, 8);
  }

  function _generateCityData(cityInfo) {
    const isTropical = Math.abs(cityInfo.lat) < 25;
    const baseTemp = isTropical ? 28 + Math.floor(Math.random() * 5) : 22 + Math.floor(Math.random() * 8);
    const conditions = ['Partly Cloudy', 'Sunny', 'Cloudy', 'Rain', 'Partly Cloudy'];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];

    return {
      city: cityInfo.city,
      country: cityInfo.country,
      state: cityInfo.state || '',
      lat: cityInfo.lat,
      lon: cityInfo.lon,
      timezone: 'Asia/Kolkata',
      current: {
        temp: baseTemp,
        feelsLike: baseTemp + 3,
        high: baseTemp + 4,
        low: baseTemp - 5,
        condition: condition,
        description: `Current weather in ${cityInfo.city}, ${cityInfo.state || cityInfo.country}: ${condition.toLowerCase()} with warm conditions.`,
        humidity: 60 + Math.floor(Math.random() * 25),
        windSpeed: 10 + Math.floor(Math.random() * 12),
        windDeg: Math.floor(Math.random() * 360),
        pressure: 1008 + Math.floor(Math.random() * 10),
        visibility: 8 + Math.floor(Math.random() * 4),
        uvIndex: 5 + Math.floor(Math.random() * 4),
        dewPoint: baseTemp - 5,
        cloudCover: 20 + Math.floor(Math.random() * 60),
        rainChance: Math.floor(Math.random() * 45),
        sunrise: (() => { const d = new Date(); d.setHours(6, 15, 0); return d.toISOString(); })(),
        sunset: (() => { const d = new Date(); d.setHours(18, 35, 0); return d.toISOString(); })(),
        isDay: new Date().getHours() >= 6 && new Date().getHours() < 19,
        lastUpdated: new Date().toISOString(),
      },
      hourly: _generateHourly(baseTemp, 3, condition, [], 20, new Date()),
      daily: _generateDaily(baseTemp + 4, baseTemp - 5, [
        { condition: 'Partly Cloudy', rainChance: 25, description: 'Warm day with clouds' },
        { condition: 'Sunny', rainChance: 10, description: 'Clear bright day' },
        { condition: 'Cloudy', rainChance: 40, description: 'Overcast skies' },
        { condition: 'Rain', rainChance: 60, description: 'Rain showers expected' },
        { condition: 'Partly Cloudy', rainChance: 20, description: 'Pleasant weather' },
        { condition: 'Sunny', rainChance: 5, description: 'Sunny day' },
        { condition: 'Cloudy', rainChance: 35, description: 'Passing clouds' },
      ], new Date()),
      airQuality: {
        aqi: 70 + Math.floor(Math.random() * 60),
        pm25: 20 + Math.random() * 30,
        pm10: 40 + Math.random() * 50,
        co: 0.4 + Math.random() * 0.8,
        no2: 15 + Math.random() * 25,
        o3: 30 + Math.random() * 40,
        so2: 5 + Math.random() * 8,
      },
      alerts: [],
    };
  }

  return {
    getWeatherData,
    searchCities,
    ALL_CITIES,
  };
})();
