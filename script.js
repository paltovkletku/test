let cities = [];
let activeCity = null;

const citiesEl = document.getElementById('cities');
const weatherEl = document.getElementById('weather');
const cityInput = document.getElementById('cityInput');
const cityError = document.getElementById('cityError');
const addCitySection = document.getElementById('add-city');
const suggestionsEl = document.getElementById('suggestions');
const toggleAddCityBtn = document.getElementById('toggleAddCity');

let lastSearchResults = [];

/* ================= STORAGE ================= */

function saveToStorage() {
  localStorage.setItem('cities', JSON.stringify(cities));
}

function loadFromStorage() {
  const saved = localStorage.getItem('cities');

  if (saved) {
    cities = JSON.parse(saved);
    activeCity = cities[0];
    renderCities();
    loadWeather(activeCity);
  } else {
    requestGeolocation();
  }
}

/* ================= GEOLOCATION ================= */

function requestGeolocation() {
  if (!navigator.geolocation) {
    addCitySection.style.display = 'block';
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const city = {
        name: 'Current location',
        lat: pos.coords.latitude,
        lon: pos.coords.longitude
      };

      cities.push(city);
      activeCity = city;
      saveToStorage();
      renderCities();
      loadWeather(city);
    },
    () => {
      addCitySection.style.display = 'block';
      weatherEl.innerHTML =
        '<p>Please add a city or allow geolocation access</p>';
    }
  );
}

/* ================= CITIES ================= */

function renderCities() {
  citiesEl.innerHTML = '';

  cities.forEach((city, index) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'city-item';

    const name = document.createElement('span');
    name.textContent = city.name;

    if (city === activeCity) {
      name.style.fontWeight = 'bold';
    }

    name.onclick = () => {
      activeCity = city;
      renderCities();
      loadWeather(city);
    };

    wrapper.appendChild(name);

    if (city.name !== 'Current location') {
      const removeBtn = document.createElement('button');
      removeBtn.textContent = '×';

      removeBtn.onclick = () => {
        cities.splice(index, 1);
        activeCity = cities[0] || null;
        saveToStorage();
        renderCities();
        if (activeCity) loadWeather(activeCity);
      };

      wrapper.appendChild(removeBtn);
    }

    citiesEl.appendChild(wrapper);
  });
}

/* ================= WEATHER ================= */

function getWeatherDescription(code) {
  if (code === 0) return 'Clear sky';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 48) return 'Fog';
  if (code <= 57) return 'Drizzle';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Rain showers';
  if (code <= 99) return 'Thunderstorm';
  return 'Unknown';
}

function loadWeather(city) {
  weatherEl.innerHTML = '<p class="loader">Loading...</p>';

  fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`
  )
    .then(res => res.json())
    .then(data => renderWeather(data))
    .catch(() => {
      weatherEl.innerHTML = '<p class="error">Error loading weather</p>';
    });
}

function renderWeather(data) {
  let html = `<h2>${activeCity.name}</h2>`;

  for (let i = 0; i < 3; i++) {
    html += `
      <div class="day">
        <p><strong>${i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : 'Day after tomorrow'}</strong></p>
        <p>Weather:</p><p>${getWeatherDescription(data.daily.weathercode[i])}</p>
        <p>Max:</p><p>${data.daily.temperature_2m_max[i]} °C</p>
        <p>Min:</p><p>${data.daily.temperature_2m_min[i]} °C</p>
      </div>
    `;
  }

  weatherEl.innerHTML = html;
}

/* ================= AUTOCOMPLETE ================= */

cityInput.addEventListener('input', () => {
  const value = cityInput.value.trim();
  suggestionsEl.innerHTML = '';
  cityError.textContent = '';

  if (value.length < 2) return;

  fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${value}&count=5`)
    .then(res => res.json())
    .then(data => {
      if (!data.results) return;

      lastSearchResults = data.results;

      data.results.forEach(city => {
        const li = document.createElement('li');
        li.textContent = `${city.name}, ${city.country}`;
        li.onclick = () => {
          cityInput.value = city.name;
          suggestionsEl.innerHTML = '';
        };
        suggestionsEl.appendChild(li);
      });
    });
});

/* ================= ADD CITY ================= */

document.getElementById('addCityBtn').addEventListener('click', () => {
  const name = cityInput.value.trim();

  const match = lastSearchResults.find(
    c => c.name.toLowerCase() === name.toLowerCase()
  );

  if (!match) {
    cityError.textContent = 'Select city from the list';
    return;
  }

  const city = {
    name: match.name,
    lat: match.latitude,
    lon: match.longitude
  };

  cities.push(city);
  activeCity = city;
  saveToStorage();
  renderCities();
  loadWeather(city);

  cityInput.value = '';
  suggestionsEl.innerHTML = '';
  addCitySection.style.display = 'none';
});

/* ================= UI ================= */

toggleAddCityBtn.addEventListener('click', () => {
  addCitySection.style.display =
    addCitySection.style.display === 'none' ? 'block' : 'none';
});

document.getElementById('refreshBtn').addEventListener('click', () => {
  if (activeCity) loadWeather(activeCity);
});

/* ================= INIT ================= */

loadFromStorage();
