/**
 * calm.js — Calm Space Logic
 * 
 * Handles:
 * - Ambient sound toggle (Rain, Forest, Ocean) with individual volume
 * - Focus timer (Pomodoro-style with preset durations)
 * - Breathing exercise animation
 */

// ==========================================
// AMBIENT SOUND PLAYERS
// ==========================================
const soundState = {
    rain: false,
    forest: false,
    ocean: false
};

window.toggleSound = function (name) {
    const audio = document.getElementById(`audio-${name}`);
    const card = document.getElementById(`card-${name}`);
    const wave = document.getElementById(`wave-${name}`);
    const status = document.getElementById(`status-${name}`);
    if (!audio) return;

    if (soundState[name]) {
        // Pause
        audio.pause();
        soundState[name] = false;
        card?.classList.remove("playing");
        if (wave) wave.classList.add("hidden");
        if (status) {
            status.textContent = "Tap to play";
            status.classList.remove("bg-accent/10", "text-accent", "border-accent/20");
            status.classList.add("bg-base", "border-border", "text-textMuted");
        }
    } else {
        // Play
        audio.play().catch(() => {});
        soundState[name] = true;
        card?.classList.add("playing");
        if (wave) wave.classList.remove("hidden");
        if (status) {
            status.textContent = "▶ Playing";
            status.classList.add("bg-accent/10", "text-accent", "border-accent/20");
            status.classList.remove("bg-base", "border-border", "text-textMuted");
        }
    }
};

window.setVolume = function (name, val) {
    const audio = document.getElementById(`audio-${name}`);
    if (audio) audio.volume = val / 100;
};

// Set initial volume from sliders
document.addEventListener("DOMContentLoaded", () => {
    ["rain", "forest", "ocean"].forEach(name => {
        const slider = document.getElementById(`vol-${name}`);
        const audio = document.getElementById(`audio-${name}`);
        if (slider && audio) audio.volume = slider.value / 100;
    });
});


// ==========================================
// FOCUS TIMER
// ==========================================
let timerDuration = 25 * 60; // seconds
let timerRemaining = 25 * 60;
let timerInterval = null;
let timerRunning = false;

const RING_CIRCUMFERENCE = 2 * Math.PI * 88; // ~553

function updateTimerDisplay() {
    const mins = Math.floor(timerRemaining / 60);
    const secs = timerRemaining % 60;
    const display = document.getElementById("timer-display");
    if (display) display.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    // Update ring
    const ring = document.getElementById("timer-ring");
    if (ring) {
        const progress = 1 - (timerRemaining / timerDuration);
        ring.setAttribute("stroke-dashoffset", RING_CIRCUMFERENCE * (1 - progress));
    }
}

window.setTimerDuration = function (minutes) {
    if (timerRunning) return; // Don't change while running

    timerDuration = minutes * 60;
    timerRemaining = timerDuration;
    updateTimerDisplay();

    // Update preset buttons
    document.querySelectorAll(".timer-preset").forEach(btn => {
        btn.classList.remove("active-preset", "bg-accent/10", "border-accent/30", "text-accent");
        btn.classList.add("bg-base", "border-border", "text-textSecondary");
    });
    const activeBtn = document.querySelector(`.timer-preset[onclick="setTimerDuration(${minutes})"]`);
    if (activeBtn) {
        activeBtn.classList.add("active-preset", "bg-accent/10", "border-accent/30", "text-accent");
        activeBtn.classList.remove("bg-base", "border-border", "text-textSecondary");
    }
};

window.toggleTimer = function () {
    const btn = document.getElementById("timer-start-btn");
    const phase = document.getElementById("timer-phase");

    if (timerRunning) {
        // Pause
        clearInterval(timerInterval);
        timerRunning = false;
        if (btn) btn.innerHTML = "▶ Resume";
        if (phase) phase.textContent = "Paused";
    } else {
        // Start
        timerRunning = true;
        if (btn) btn.innerHTML = "⏸ Pause";
        if (phase) phase.textContent = "Focusing...";

        timerInterval = setInterval(() => {
            timerRemaining--;
            updateTimerDisplay();

            if (timerRemaining <= 0) {
                clearInterval(timerInterval);
                timerRunning = false;
                if (btn) btn.innerHTML = "▶ Start Focus";
                if (phase) phase.textContent = "🎉 Complete!";

                // Notification sound (browser beep)
                try {
                    const ctx = new (window.AudioContext || window.webkitAudioContext)();
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.frequency.value = 528;
                    osc.type = "sine";
                    gain.gain.value = 0.3;
                    osc.start();
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
                    osc.stop(ctx.currentTime + 1.5);
                } catch (e) {}
            }
        }, 1000);
    }
};

window.resetTimer = function () {
    clearInterval(timerInterval);
    timerRunning = false;
    timerRemaining = timerDuration;
    updateTimerDisplay();

    const btn = document.getElementById("timer-start-btn");
    const phase = document.getElementById("timer-phase");
    if (btn) btn.innerHTML = "▶ Start Focus";
    if (phase) phase.textContent = "Focus Time";
};


// ==========================================
// BREATHING EXERCISE
// ==========================================
(function initBreathing() {
    const startBtn = document.getElementById("start-breathing");
    const circle = document.getElementById("breathing-circle");
    const text = document.getElementById("breathing-text");
    if (!startBtn || !circle || !text) return;

    let breathingActive = false;
    let breathingTimeout = null;

    function runPhase(phase) {
        if (!breathingActive) return;

        if (phase === "inhale") {
            text.textContent = "Inhale...";
            circle.classList.remove("breathing-shrinking");
            circle.classList.add("breathing-expanding");
            breathingTimeout = setTimeout(() => runPhase("hold"), 4000);
        } else if (phase === "hold") {
            text.textContent = "Hold...";
            breathingTimeout = setTimeout(() => runPhase("exhale"), 4000);
        } else {
            text.textContent = "Exhale...";
            circle.classList.remove("breathing-expanding");
            circle.classList.add("breathing-shrinking");
            breathingTimeout = setTimeout(() => runPhase("inhale"), 4000);
        }
    }

    startBtn.addEventListener("click", () => {
        if (breathingActive) {
            // Stop
            breathingActive = false;
            clearTimeout(breathingTimeout);
            circle.classList.remove("breathing-expanding", "breathing-shrinking");
            text.textContent = "Start";
            startBtn.textContent = "🌬️ Begin Breathing";
        } else {
            // Start
            breathingActive = true;
            startBtn.textContent = "⏹ Stop";
            runPhase("inhale");
        }
    });
})();

// Init timer display on load
document.addEventListener("DOMContentLoaded", () => {
    updateTimerDisplay();
});
