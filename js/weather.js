/**
 * weather.js — Weather Display Module for LifeOS
 * 
 * Uses OpenWeather API to show city + temperature + emoji.
 * Location priority: Geolocation → IP-based lookup → Fallback city.
 * Caches in localStorage for 15 minutes.
 */

// 🔑 Your OpenWeather API key
const OPENWEATHER_API_KEY = CONFIG.weatherKey;

// Fallback if all location methods fail
const FALLBACK_CITY = "Alappuzha";
const CACHE_KEY = "lifeos_weather";
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

// Weather condition → emoji
const weatherEmojis = {
    "Clear": "☀️", "Clouds": "☁️", "Rain": "🌧️", "Drizzle": "🌦️",
    "Thunderstorm": "⛈️", "Snow": "❄️", "Mist": "🌫️", "Haze": "🌫️",
    "Fog": "🌫️", "Smoke": "🌫️", "Dust": "🌪️", "Sand": "🌪️",
    "Tornado": "🌪️", "Squall": "💨", "Ash": "🌋"
};

function getEmoji(main, iconCode) {
    const isNight = iconCode?.endsWith("n");
    if (main === "Clear") return isNight ? "🌙" : "☀️";
    if (main === "Clouds" && (iconCode === "02d" || iconCode === "02n")) return "⛅";
    return weatherEmojis[main] || "🌡️";
}

// ==========================================
// MAIN FETCH
// ==========================================
async function fetchWeather() {
    // Check cache
    const cached = getCachedWeather();
    if (cached) {
        console.log("🌤️ Weather (cached):", cached.city, cached.temp);
        updateUI(cached);
        return;
    }

    // Show loading
    updateUI({ city: "Loading", temp: "...", icon: "⏳", description: "" });

    try {
        // Step 1: Try getting location
        let apiUrl = null;

        // Try browser geolocation
        const coords = await getBrowserLocation();
        if (coords) {
            console.log("📍 Got geolocation:", coords.lat, coords.lon);
            apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&units=metric&appid=${OPENWEATHER_API_KEY}`;
        }

        // Fallback: Try IP-based location
        if (!apiUrl) {
            console.log("📍 Geolocation unavailable, trying IP lookup...");
            const ipCity = await getIPCity();
            const city = ipCity || FALLBACK_CITY;
            console.log("📍 Using city:", city);
            apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${OPENWEATHER_API_KEY}`;
        }

        // Step 2: Fetch weather
        console.log("🌐 Fetching weather...");
        const res = await fetch(apiUrl);
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || `API error ${res.status}`);
        }

        const weather = {
            city: data.name || FALLBACK_CITY,
            temp: `${Math.round(data.main.temp)}°C`,
            icon: getEmoji(data.weather[0]?.main, data.weather[0]?.icon),
            description: data.weather[0]?.description || ""
        };

        cacheWeather(weather);
        updateUI(weather);
        console.log(`✅ Weather: ${weather.icon} ${weather.city} • ${weather.temp} (${weather.description})`);

    } catch (err) {
        console.error("❌ Weather failed:", err.message);
        // Show error state with city name
        updateUI({
            city: FALLBACK_CITY,
            temp: "—",
            icon: "⚠️",
            description: err.message
        });
    }
}

// ==========================================
// LOCATION: Browser Geolocation
// ==========================================
function getBrowserLocation() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            console.log("📍 Geolocation API not available");
            resolve(null);
            return;
        }

        // Check if we're on file:// (geolocation often blocked)
        if (window.location.protocol === "file:") {
            console.log("📍 Skipping geolocation on file:// protocol");
            resolve(null);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
            (err) => {
                console.log("📍 Geolocation denied:", err.message);
                resolve(null);
            },
            { timeout: 5000, maximumAge: 600000 }
        );
    });
}

// ==========================================
// LOCATION: IP-based fallback
// ==========================================
async function getIPCity() {
    try {
        const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(3000) });
        if (!res.ok) return null;
        const data = await res.json();
        return data.city || null;
    } catch {
        return null;
    }
}

// ==========================================
// UPDATE UI
// ==========================================
function updateUI(weather) {
    // Dashboard header: #weather-icon, #weather-city, #weather-temp
    setText("weather-icon", weather.icon);
    setText("weather-temp", weather.temp);
    setText("weather-city", weather.city);

    // Navbar: #nav-weather-text
    const navEl = document.getElementById("nav-weather-text");
    if (navEl) navEl.textContent = `${weather.icon} ${weather.city} • ${weather.temp}`;

    // Class-based selectors (for any additional weather elements)
    document.querySelectorAll(".weather-icon").forEach(el => el.textContent = weather.icon);
    document.querySelectorAll(".weather-temp").forEach(el => el.textContent = weather.temp);
    document.querySelectorAll(".weather-city").forEach(el => el.textContent = weather.city);
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

// ==========================================
// CACHE (localStorage)
// ==========================================
function cacheWeather(data) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
    } catch (e) { /* storage blocked */ }
}

function getCachedWeather() {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (Date.now() - parsed.timestamp > CACHE_DURATION) {
            localStorage.removeItem(CACHE_KEY);
            return null;
        }
        return parsed.data;
    } catch (e) {
        return null;
    }
}

// ==========================================
// AUTO-INIT
// ==========================================
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fetchWeather);
} else {
    fetchWeather();
}

// Manual refresh: clears cache and re-fetches
window.refreshWeather = function () {
    localStorage.removeItem(CACHE_KEY);
    fetchWeather();
};
