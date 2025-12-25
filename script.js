let cities = [];
let activeCity = null;

const citiesEl = document.getElementById('cities');
const weatherEl = document.getElementById('weather');
const cityInput = document.getElementById('cityInput');
const cityError = document.getElementById('cityError');
const addCitySection = document.getElementById('add-city');

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
    addCitySection.style.display = 'block';
  } else {
    requestGeolocation();
  }
}

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
      addCitySection.style.display = 'block';
    },
    () => {
      addCitySection.style.display = 'block';
      weatherEl.innerHTML = '<p>Please add a city</p>';
    }
  );
}



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

        if (activeCity === city) {
          activeCity = cities[0] || null;
          if (activeCity) loadWeather(activeCity);
        }

        saveToStorage();
        renderCities();
      };

      wrapper.appendChild(removeBtn);
    }

    citiesEl.appendChild(wrapper);
  });
}

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
  weatherEl.innerHTML = '<p>Loading...</p>';

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`;

  fetch(url)
    .then(res => res.json())
    .then(data => renderWeather(data))
    .catch(() => {
      weatherEl.innerHTML = '<p>Error loading weather</p>';
    });
}

function getDayLabel(index, dateStr) {
  const date = new Date(dateStr);
  const options = { weekday: 'short', day: '2-digit', month: '2-digit' };
  const formatted = date.toLocaleDateString('en-US', options);

  if (index === 0) return `Today (${formatted})`;
  if (index === 1) return `Tomorrow (${formatted})`;
  return `Day after tomorrow (${formatted})`;
}

function renderWeather(data) {
  let html = `<h2>${activeCity.name}</h2>`;

  for (let i = 0; i < 3; i++) {
  html += `
    <div class="day">
      <p><strong>${getDayLabel(i, data.daily.time[i])}</strong></p>
      <p>Weather: ${getWeatherDescription(data.daily.weathercode[i])}</p>
      <p>Max: ${data.daily.temperature_2m_max[i]} °C</p>
      <p>Min: ${data.daily.temperature_2m_min[i]} °C</p>
    </div>
  `;
}

  weatherEl.innerHTML = html;
}

document.getElementById('addCityBtn').addEventListener('click', () => {
  const name = cityInput.value.trim();
  cityError.textContent = '';

  if (!name) {
    cityError.textContent = 'Enter city name';
    return;
  }

  fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${name}`)
    .then(res => res.json())
    .then(data => {
      if (!data.results) {
        cityError.textContent = 'City not found';
        return;
      }

      const city = {
        name: data.results[0].name,
        lat: data.results[0].latitude,
        lon: data.results[0].longitude
      };

      cities.push(city);
      activeCity = city;
      saveToStorage();
      renderCities();
      loadWeather(city);
      cityInput.value = '';
    });
});

document.getElementById('refreshBtn').addEventListener('click', () => {
  if (activeCity) {
    loadWeather(activeCity);
  }
});

loadFromStorage();
