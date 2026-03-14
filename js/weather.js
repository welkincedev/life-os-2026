/**
 * weather.js — Weather Display Module for LifeOS
 * 
 * Uses OpenWeather API to show city + temperature + emoji.
 * Location priority: Geolocation → IP-based lookup → Fallback city.
 * Caches in localStorage for 15 minutes.
 */



// Fallback if all location methods fail
const FALLBACK_CITY = "Alappuzha";
const CACHE_KEY = "lifeos_weather";
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

// WMO Weather Codes → Emoji mapping
// Ref: https://open-meteo.com/en/docs
const wmoToEmoji = (code) => {
    if (code === 0) return "☀️"; // Clear sky
    if (code >= 1 && code <= 3) return "⛅"; // Mainly clear, partly cloudy, and overcast
    if (code >= 45 && code <= 48) return "🌫️"; // Fog
    if (code >= 51 && code <= 55) return "🌦️"; // Drizzle
    if (code >= 61 && code <= 65) return "🌧️"; // Rain
    if (code >= 66 && code <= 67) return "🌨️"; // Freezing Rain
    if (code >= 71 && code <= 77) return "❄️"; // Snow
    if (code >= 80 && code <= 82) return "🌧️"; // Rain showers
    if (code >= 85 && code <= 86) return "❄️"; // Snow showers
    if (code === 95) return "⛈️"; // Thunderstorm
    if (code >= 96 && code <= 99) return "⛈️"; // Thunderstorm with hail
    return "🌡️";
};

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
        // Step 1: Try getting coordinates
        let lat, lon, city;

        // Try browser geolocation
        const coords = await getBrowserLocation();
        if (coords) {
            console.log("📍 Got geolocation:", coords.lat, coords.lon);
            lat = coords.lat;
            lon = coords.lon;
            city = "Current Location"; // Or fetch name via reverse geocoding if needed
        } else {
            // Fallback: Try IP-based location
            console.log("📍 Geolocation unavailable, trying IP lookup...");
            const ipData = await getIPData();
            lat = ipData?.lat || 9.4981; // Alappuzha fallback
            lon = ipData?.lon || 76.3329;
            city = ipData?.city || FALLBACK_CITY;
        }

        // Step 2: Fetch weather from Open-Meteo (No API key required!)
        console.log("🌐 Fetching weather from Open-Meteo...");
        const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;
        
        const res = await fetch(apiUrl);
        const data = await res.json();

        if (!res.ok) throw new Error("Weather API error");

        const current = data.current_weather;
        const weather = {
            city: city,
            temp: `${Math.round(current.temperature)}°C`,
            icon: wmoToEmoji(current.weathercode),
            description: `Wind: ${current.windspeed} km/h`
        };

        cacheWeather(weather);
        updateUI(weather);
        console.log(`✅ Weather: ${weather.icon} ${weather.city} • ${weather.temp}`);

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
async function getIPData() {
    try {
        // Using extreme-ip-lookup or ipapi.co
        const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(3000) });
        if (!res.ok) return null;
        const data = await res.json();
        return {
            city: data.city,
            lat: data.latitude,
            lon: data.longitude
        };
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

// Global hook for components to refresh weather UI after injection
window.refreshWeatherUI = function() {
    const cached = getCachedWeather();
    if (cached) updateUI(cached);
};

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
