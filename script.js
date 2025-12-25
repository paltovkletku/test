let cities = [];
let activeCity = null;

const citiesEl = document.getElementById('cities');
const weatherEl = document.getElementById('weather');
const cityInput = document.getElementById('cityInput');
const cityError = document.getElementById('cityError');

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
    getUserLocation();
  }
}

function getUserLocation() {
  if (!navigator.geolocation) {
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const city = {
        name: 'Текущее местоположение',
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
      document.getElementById('add-city').style.display = 'block';
    }
  );
}

function renderCities() {
  citiesEl.innerHTML = '';
  cities.forEach(city => {
    const btn = document.createElement('button');
    btn.textContent = city.name;
    if (city === activeCity) {
      btn.classList.add('active');
    }
    btn.onclick = () => {
      activeCity = city;
      renderCities();
      loadWeather(city);
    };
    citiesEl.appendChild(btn);
  });
}

function loadWeather(city) {
  weatherEl.innerHTML = '<p>Загрузка...</p>';

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      renderWeather(data);
    })
    .catch(() => {
      weatherEl.innerHTML = '<p>Ошибка загрузки данных</p>';
    });
}

function renderWeather(data) {
  let html = `<h2>${activeCity.name}</h2>`;

  for (let i = 0; i < 3; i++) {
    html += `
      <div class="day">
        <p><strong>День ${i + 1}</strong></p>
        <p>Максимум: ${data.daily.temperature_2m_max[i]} °C</p>
        <p>Минимум: ${data.daily.temperature_2m_min[i]} °C</p>
      </div>
    `;
  }

  weatherEl.innerHTML = html;
}

document.getElementById('addCityBtn').addEventListener('click', () => {
  const name = cityInput.value.trim();
  cityError.textContent = '';

  if (!name) {
    cityError.textContent = 'Введите название города';
    return;
  }

  fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${name}`)
    .then(res => res.json())
    .then(data => {
      if (!data.results) {
        cityError.textContent = 'Город не найден';
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
