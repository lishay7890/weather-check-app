// Get HTML elements
const searchForm = document.getElementById("searchForm");
const locationInput = document.getElementById("locationInput");
const locationButton = document.getElementById("locationButton");
const refreshButton = document.getElementById("refreshButton");

const statusPanel = document.getElementById("statusPanel");
const statusMessage = document.getElementById("statusMessage");
const loader = document.getElementById("loader");

const weatherContent = document.getElementById("weatherContent");

const resolvedLocation = document.getElementById("resolvedLocation");
const currentTime = document.getElementById("currentTime");
const weatherIcon = document.getElementById("weatherIcon");
const temperature = document.getElementById("temperature");
const conditions = document.getElementById("conditions");

const windSpeed = document.getElementById("windSpeed");
const rainChance = document.getElementById("rainChance");
const feelsLike = document.getElementById("feelsLike");
const humidity = document.getElementById("humidity");

const pastHours = document.getElementById("pastHours");
const futureHours = document.getElementById("futureHours");


// Store last searched location
let lastLatitude = null;
let lastLongitude = null;
let lastLocationName = "";


// Weather condition information
function getWeatherInfo(code) {
  if (code === 0) {
    return { text: "Clear Sky", icon: "☀️" };
  }

  if (code === 1 || code === 2) {
    return { text: "Partly Cloudy", icon: "🌤️" };
  }

  if (code === 3) {
    return { text: "Overcast", icon: "☁️" };
  }

  if (code === 45 || code === 48) {
    return { text: "Foggy", icon: "🌫️" };
  }

  if (code >= 51 && code <= 57) {
    return { text: "Drizzle", icon: "🌦️" };
  }

  if (code >= 61 && code <= 67) {
    return { text: "Rain", icon: "🌧️" };
  }

  if (code >= 71 && code <= 77) {
    return { text: "Snow", icon: "❄️" };
  }

  if (code >= 80 && code <= 82) {
    return { text: "Rain Showers", icon: "🌦️" };
  }

  if (code >= 95) {
    return { text: "Thunderstorm", icon: "⛈️" };
  }

  return { text: "Unknown", icon: "🌤️" };
}


// Show loading message
function showLoading(message) {
  loader.classList.remove("hidden");
  statusPanel.classList.remove("error");
  statusMessage.textContent = message;
}


// Show error message
function showError(message) {
  loader.classList.add("hidden");
  statusPanel.classList.add("error");
  statusMessage.textContent = message;
}


// Search weather
async function searchWeather(location) {
  if (!location) {
    showError("Please enter a city name.");
    return;
  }

  showLoading("Loading weather...");

  try {
    const place = await getCoordinates(location);

    const weather = await getWeather(
      place.latitude,
      place.longitude
    );

    lastLatitude = place.latitude;
    lastLongitude = place.longitude;
    lastLocationName = place.name;

    displayWeather(weather, place);

    loader.classList.add("hidden");
    statusPanel.classList.remove("error");

  } catch (error) {
    showError(error.message);
  }
}


// Display current weather
function displayWeather(weather, place) {
  const current = weather.current;

  const info = getWeatherInfo(current.weather_code);

  resolvedLocation.textContent =
    `${place.name}, ${place.country || ""}`;

  currentTime.textContent =
    formatDateTime(current.time);

  weatherIcon.textContent = info.icon;

  temperature.textContent =
    `${Math.round(current.temperature_2m)}°C`;

  conditions.textContent = info.text;

  windSpeed.textContent =
    `${Math.round(current.wind_speed_10m)} km/h`;

  rainChance.textContent =
    `${current.precipitation_probability || 0}%`;

  feelsLike.textContent =
    `${Math.round(current.apparent_temperature)}°C`;

  humidity.textContent =
    `${current.relative_humidity_2m}%`;

  createHourlyCards(weather);

  weatherContent.classList.remove("hidden");
}


// Create previous and future hour cards
function createHourlyCards(weather) {
  pastHours.innerHTML = "";
  futureHours.innerHTML = "";

  const hourly = weather.hourly;

  const now = new Date();

  let currentIndex = 0;
  let closestTime = Infinity;

  for (let i = 0; i < hourly.time.length; i++) {
    const time = new Date(hourly.time[i]);

    const difference = Math.abs(
      time.getTime() - now.getTime()
    );

    if (difference < closestTime) {
      closestTime = difference;
      currentIndex = i;
    }
  }

  const pastStart = Math.max(0, currentIndex - 24);

  for (let i = pastStart; i < currentIndex; i++) {
    createHourCard(pastHours, hourly, i);
  }

  const futureEnd = Math.min(
    hourly.time.length,
    currentIndex + 25
  );

  for (let i = currentIndex + 1; i < futureEnd; i++) {
    createHourCard(futureHours, hourly, i);
  }
}


// Create one hour card
function createHourCard(container, hourly, index) {
  const info = getWeatherInfo(
    hourly.weather_code[index]
  );

  const card = document.createElement("article");
  card.className = "hour-card";

  card.innerHTML = `
    <p class="hour-time">
      ${formatHour(hourly.time[index])}
    </p>

    <div class="hour-icon">
      ${info.icon}
    </div>

    <p class="hour-temp">
      ${Math.round(hourly.temperature_2m[index])}°C
    </p>

    <p class="hour-condition">
      ${info.text}
    </p>

    <p class="hour-rain">
      Rain: ${hourly.precipitation_probability[index] || 0}%
    </p>
  `;

  container.appendChild(card);
}


// Format date and time
function formatDateTime(dateString) {
  const date = new Date(dateString);

  return date.toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}


// Format hour
function formatHour(dateString) {
  const date = new Date(dateString);

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
}


// Search form
searchForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const location = locationInput.value.trim();

  searchWeather(location);
});


// Use user's location
locationButton.addEventListener("click", function () {

  if (!navigator.geolocation) {
    showError("Geolocation is not supported by your browser.");
    return;
  }

  showLoading("Getting your location...");

  navigator.geolocation.getCurrentPosition(
    async function (position) {

      try {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        const weather = await getWeather(
          latitude,
          longitude
        );

        lastLatitude = latitude;
        lastLongitude = longitude;
        lastLocationName = "Your Location";

        const place = {
          name: "Your Location",
          country: ""
        };

        displayWeather(weather, place);

        loader.classList.add("hidden");

      } catch (error) {
        showError("Unable to get weather.");
      }
    },

    function () {
      showError(
        "Location permission was denied."
      );
    }
  );
});


// Refresh button
refreshButton.addEventListener("click", async function () {

  if (lastLatitude === null) {
    showError("Please search for a location first.");
    return;
  }

  showLoading("Refreshing weather...");

  try {
    const weather = await getWeather(
      lastLatitude,
      lastLongitude
    );

    const place = {
      name: lastLocationName,
      country: ""
    };

    displayWeather(weather, place);

    loader.classList.add("hidden");

  } catch (error) {
    showError("Unable to refresh weather.");
  }
});