// ========================================
// app.js
// Handles UI and weather display
// ========================================


// -------------------------
// HTML Elements
// -------------------------

const searchForm = document.getElementById("searchForm");
const locationInput = document.getElementById("locationInput");

const refreshButton = document.getElementById("refreshButton");
const locationButton = document.getElementById("locationButton");

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


// Remember last searched location
let currentSearch = null;


// ========================================
// Weather Code Information
// ========================================

const weatherCodes = {
  0: {
    text: "Clear Sky",
    icon: "☀️",
  },

  1: {
    text: "Mainly Clear",
    icon: "🌤️",
  },

  2: {
    text: "Partly Cloudy",
    icon: "⛅",
  },

  3: {
    text: "Cloudy",
    icon: "☁️",
  },

  45: {
    text: "Fog",
    icon: "🌫️",
  },

  48: {
    text: "Fog",
    icon: "🌫️",
  },

  51: {
    text: "Light Drizzle",
    icon: "🌦️",
  },

  53: {
    text: "Drizzle",
    icon: "🌦️",
  },

  55: {
    text: "Heavy Drizzle",
    icon: "🌧️",
  },

  61: {
    text: "Light Rain",
    icon: "🌦️",
  },

  63: {
    text: "Rain",
    icon: "🌧️",
  },

  65: {
    text: "Heavy Rain",
    icon: "🌧️",
  },

  71: {
    text: "Light Snow",
    icon: "🌨️",
  },

  73: {
    text: "Snow",
    icon: "❄️",
  },

  75: {
    text: "Heavy Snow",
    icon: "❄️",
  },

  80: {
    text: "Rain Showers",
    icon: "🌦️",
  },

  81: {
    text: "Rain Showers",
    icon: "🌧️",
  },

  82: {
    text: "Heavy Rain Showers",
    icon: "🌧️",
  },

  95: {
    text: "Thunderstorm",
    icon: "⛈️",
  },

  96: {
    text: "Thunderstorm",
    icon: "⛈️",
  },

  99: {
    text: "Heavy Thunderstorm",
    icon: "⛈️",
  },
};


function getWeatherInfo(code) {
  return (
    weatherCodes[code] || {
      text: "Unknown Weather",
      icon: "🌤️",
    }
  );
}


// ========================================
// UI STATES
// ========================================

function showLoading(message = "Loading weather...") {
  if (statusPanel) {
    statusPanel.classList.remove("hidden");
    statusPanel.classList.remove("error");
  }

  if (loader) {
    loader.classList.remove("hidden");
  }

  if (statusMessage) {
    statusMessage.textContent = message;
  }

  if (weatherContent) {
    weatherContent.classList.add("hidden");
  }
}


function showError(message) {
  if (loader) {
    loader.classList.add("hidden");
  }

  if (statusPanel) {
    statusPanel.classList.remove("hidden");
    statusPanel.classList.add("error");
  }

  if (statusMessage) {
    statusMessage.textContent = message;
  }

  if (weatherContent) {
    weatherContent.classList.add("hidden");
  }
}


function showWeather() {
  if (loader) {
    loader.classList.add("hidden");
  }

  if (statusPanel) {
    statusPanel.classList.add("hidden");
  }

  if (weatherContent) {
    weatherContent.classList.remove("hidden");
  }
}


// ========================================
// HOURLY DATA
// ========================================

function createHourlyData(weather) {
  const hourly = weather.hourly;

  const hours = [];

  for (let i = 0; i < hourly.time.length; i++) {
    hours.push({
      time: hourly.time[i],

      temperature: hourly.temperature_2m[i],

      rainChance:
        hourly.precipitation_probability[i] ?? 0,

      weatherCode:
        hourly.weather_code[i],

      windSpeed:
        hourly.wind_speed_10m[i],
    });
  }

  return hours;
}


// ========================================
// PREVIOUS + FUTURE 24 HOURS
// ========================================

function splitHourlyWeather(weather) {
  const hours = createHourlyData(weather);

  // Current location time returned by the API
  const currentHour = weather.current.time.slice(0, 13);

  const previousHours = hours
    .filter((hour) => {
      return hour.time.slice(0, 13) < currentHour;
    })
    .slice(-24);

  const nextHours = hours
    .filter((hour) => {
      return hour.time.slice(0, 13) >= currentHour;
    })
    .slice(0, 24);

  return {
    previousHours,
    nextHours,
  };
}


// ========================================
// FORMAT TIME
// ========================================

function formatHour(time) {
  const timeSection = time.split("T")[1];

  const hour = Number(timeSection.slice(0, 2));

  const period = hour >= 12 ? "PM" : "AM";

  const displayHour = hour % 12 || 12;

  return `${displayHour} ${period}`;
}


// ========================================
// CREATE HOURLY CARD
// ========================================

function createHourCard(hour) {
  const info = getWeatherInfo(hour.weatherCode);

  const card = document.createElement("article");

  card.className = "hour-card";

  card.innerHTML = `
    <p class="hour-time">
      ${formatHour(hour.time)}
    </p>

    <div class="hour-icon">
      ${info.icon}
    </div>

    <p class="hour-temp">
      ${Math.round(hour.temperature)}°C
    </p>

    <p class="hour-condition">
      ${info.text}
    </p>

    <p class="hour-rain">
      Rain: ${Math.round(hour.rainChance)}%
    </p>
  `;

  return card;
}


// ========================================
// DISPLAY HOURLY CARDS
// ========================================

function displayHourlyWeather(container, hours) {
  if (!container) {
    return;
  }

  container.innerHTML = "";

  hours.forEach((hour) => {
    const card = createHourCard(hour);

    container.appendChild(card);
  });
}


// ========================================
// GET CURRENT RAIN CHANCE
// ========================================

function getCurrentRainChance(weather) {
  const hourlyData = createHourlyData(weather);

  const currentHour = weather.current.time.slice(0, 13);

  const currentHourlyWeather = hourlyData.find(
    (hour) => hour.time.slice(0, 13) === currentHour
  );

  if (!currentHourlyWeather) {
    return 0;
  }

  return currentHourlyWeather.rainChance;
}


// ========================================
// DISPLAY CURRENT WEATHER
// ========================================

function displayWeather(place, weather) {
  const current = weather.current;

  const weatherInfo = getWeatherInfo(
    current.weather_code
  );

  // Location
  if (resolvedLocation) {
    const locationParts = [
      place.name,
      place.admin1,
      place.country,
    ].filter(Boolean);

    resolvedLocation.textContent =
      locationParts.join(", ");
  }


  // Time
  if (currentTime) {
    currentTime.textContent =
      `Local time: ${current.time.replace("T", " ")}`;
  }


  // Weather icon
  if (weatherIcon) {
    weatherIcon.textContent =
      weatherInfo.icon;
  }


  // Temperature
  if (temperature) {
    temperature.textContent =
      `${Math.round(current.temperature_2m)}°C`;
  }


  // Condition
  if (conditions) {
    conditions.textContent =
      weatherInfo.text;
  }


  // Wind speed
  if (windSpeed) {
    windSpeed.textContent =
      `${Math.round(current.wind_speed_10m)} km/h`;
  }


  // Feels like
  if (feelsLike) {
    feelsLike.textContent =
      `${Math.round(current.apparent_temperature)}°C`;
  }


  // Humidity
  if (humidity) {
    humidity.textContent =
      `${Math.round(current.relative_humidity_2m)}%`;
  }


  // Rain probability
  if (rainChance) {
    rainChance.textContent =
      `${Math.round(
        getCurrentRainChance(weather)
      )}%`;
  }


  // Get previous / future hours
  const {
    previousHours,
    nextHours,
  } = splitHourlyWeather(weather);


  displayHourlyWeather(
    pastHours,
    previousHours
  );


  displayHourlyWeather(
    futureHours,
    nextHours
  );


  showWeather();
}


// ========================================
// SEARCH WEATHER
// ========================================

async function searchWeather(location) {
  try {
    showLoading(
      `Getting weather for ${location}...`
    );


    // Get latitude / longitude
    const place =
      await getCoordinates(location);


    // Fetch weather
    const weather =
      await getWeather(
        place.latitude,
        place.longitude
      );


    currentSearch = {
      type: "city",
      location: location,
    };


    displayWeather(
      place,
      weather
    );

  } catch (error) {
    console.error(error);

    showError(error.message);
  }
}


// ========================================
// SEARCH FORM
// ========================================

if (searchForm) {
  searchForm.addEventListener(
    "submit",
    function (event) {
      event.preventDefault();


      const location =
        locationInput.value.trim();


      if (!location) {
        showError(
          "Please enter a location."
        );

        return;
      }


      searchWeather(location);
    }
  );
}


// ========================================
// REFRESH WEATHER
// ========================================

if (refreshButton) {
  refreshButton.addEventListener(
    "click",
    function () {
      if (
        currentSearch &&
        currentSearch.type === "city"
      ) {
        searchWeather(
          currentSearch.location
        );

        return;
      }


      showError(
        "Search for a location first."
      );
    }
  );
}


// ========================================
// CURRENT LOCATION
// ========================================

if (locationButton) {
  locationButton.addEventListener(
    "click",
    function () {

      if (!navigator.geolocation) {
        showError(
          "Geolocation is not supported by your browser."
        );

        return;
      }


      showLoading(
        "Getting your location..."
      );


      navigator.geolocation.getCurrentPosition(
        async function (position) {
          try {

            const latitude =
              position.coords.latitude;

            const longitude =
              position.coords.longitude;


            const weather =
              await getWeather(
                latitude,
                longitude
              );


            const place = {
              name: "Current Location",
              admin1: "",
              country: "",
            };


            displayWeather(
              place,
              weather
            );

          } catch (error) {
            console.error(error);

            showError(
              error.message
            );
          }
        },

        function () {
          showError(
            "Location permission was denied."
          );
        }
      );
    }
  );
}
