const GEOCODING_API = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_API = "https://api.open-meteo.com/v1/forecast";

async function geocodeLocation(locationName) {
  const url =
    `${GEOCODING_API}?name=${encodeURIComponent(locationName)}` +
    `&count=1&language=en&format=json`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Could not search for that location.");
  }

  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    throw new Error("Location not found. Try another city or place name.");
  }

  const result = data.results[0];

  return {
    latitude: result.latitude,
    longitude: result.longitude,
    name: result.name,
    admin1: result.admin1 || "",
    country: result.country || "",
    timezone: result.timezone
  };
}

async function fetchWeatherByCoordinates(latitude, longitude) {
  const currentVariables = [
    "temperature_2m",
    "relative_humidity_2m",
    "apparent_temperature",
    "precipitation",
    "rain",
    "weather_code",
    "wind_speed_10m"
  ].join(",");

  const hourlyVariables = [
    "temperature_2m",
    "relative_humidity_2m",
    "apparent_temperature",
    "precipitation_probability",
    "weather_code",
    "wind_speed_10m"
  ].join(",");

  const url =
    `${FORECAST_API}?latitude=${encodeURIComponent(latitude)}` +
    `&longitude=${encodeURIComponent(longitude)}` +
    `&current=${encodeURIComponent(currentVariables)}` +
    `&hourly=${encodeURIComponent(hourlyVariables)}` +
    `&past_days=1&forecast_days=2&timezone=auto`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Weather request failed with status ${response.status}.`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.reason || "Weather data could not be loaded.");
  }

  return data;
}

async function fetchWeatherForLocation(locationName) {
  const location = await geocodeLocation(locationName);

  const weather = await fetchWeatherByCoordinates(
    location.latitude,
    location.longitude
  );

  return { location, weather };
}

async function fetchWeatherForCoordinates(latitude, longitude) {
  const weather = await fetchWeatherByCoordinates(latitude, longitude);

  return {
    location: {
      latitude,
      longitude,
      name: "Current Location",
      admin1: "",
      country: "",
      timezone: weather.timezone
    },
    weather
  };
}
