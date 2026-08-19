// ========================================
// weather-api.js
// Handles communication with Open-Meteo
// ========================================

const GEOCODING_API = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_API = "https://api.open-meteo.com/v1/forecast";


// Convert a city name into latitude and longitude
async function getCoordinates(location) {
  const url =
    `${GEOCODING_API}?name=${encodeURIComponent(location)}` +
    `&count=1&language=en&format=json`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Unable to search for this location.");
  }

  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    throw new Error("Location not found.");
  }

  const place = data.results[0];

  return {
    latitude: place.latitude,
    longitude: place.longitude,
    name: place.name,
    country: place.country || "",
    admin1: place.admin1 || "",
  };
}


// Get weather using latitude and longitude
async function getWeather(latitude, longitude) {
  const url =
    `${WEATHER_API}` +
    `?latitude=${latitude}` +
    `&longitude=${longitude}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
    `&hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m` +
    `&past_days=1` +
    `&forecast_days=2` +
    `&timezone=auto`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Unable to get weather data.");
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.reason || "Weather API error.");
  }

  return data;
}
