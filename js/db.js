/**
 * db.js — Firestore Database Module for LifeOS
 * 
 * Firestore Structure:
 * ┌─ users/{uid}
 * │   ├─ displayName, email, photoURL, createdAt, lastLogin
 * │   │
 * │   ├─ habits/{habitId}
 * │   │   ├─ name, icon, frequency, createdAt
 * │   │   └─ completedDates[] (array of "YYYY-MM-DD" strings)
 * │   │
 * │   ├─ dailyLogs/{YYYY-MM-DD}
 * │   │   ├─ date, mood, energy, feelings[], task, note
 * │   │   ├─ habitsCompleted[], createdAt, updatedAt
 * │   │   
 * │   ├─ transactions/{txnId}
 * │   │   ├─ type, amount, description, category, date, createdAt
 * │   │   
 * │   └─ journalEntries/{entryId}
 * │       ├─ title, content, tags[], mood, createdAt, updatedAt
 * 
 * Loaded as type="module" in HTML.
 */

import { db, auth } from "./firebase.js";
import {
    doc, setDoc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
    collection, query, where, orderBy, limit,
    Timestamp, serverTimestamp, arrayUnion, arrayRemove
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ============================
// HELPERS
// ============================

/** Get today's date as "YYYY-MM-DD" */
function getTodayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Get current user UID or throw */
function getUid() {
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");
    return user.uid;
}

/** Reference to a user subcollection */
function userCollection(subcollection) {
    return collection(db, "users", getUid(), subcollection);
}

/** Reference to a specific user document */
function userDoc(subcollection, docId) {
    return doc(db, "users", getUid(), subcollection, docId);
}

// ============================
// USER PROFILE
// ============================

/**
 * Create or update the user profile document.
 * Called on every login to keep profile data fresh.
 */
export async function saveUserProfile(user) {
    try {
        const ref = doc(db, "users", user.uid);
        await setDoc(ref, {
            displayName: user.displayName || null,
            email: user.email || null,
            photoURL: user.photoURL || null,
            lastLogin: serverTimestamp()
        }, { merge: true }); // merge: true = create if missing, update if exists
        console.log("✅ User profile saved");
    } catch (err) {
        console.error("❌ Error saving user profile:", err);
    }
}

// ============================
// DAILY LOGS
// ============================

/**
 * Save a daily log for today.
 * Uses the date as the document ID so there's exactly one per day.
 * 
 * @param {Object} data
 * @param {string} data.mood       — "happy" | "neutral" | "sad"
 * @param {string} data.energy     — "low" | "medium" | "high"
 * @param {string[]} data.feelings — ["calm", "busy", "productive", "heavy"]
 * @param {string} data.task       — single task for today
 * @param {string} data.note       — quick note
 * @param {string[]} data.habitsCompleted — habit IDs completed today
 */
export async function saveDailyLog(data) {
    try {
        const dateKey = getTodayKey();
        const ref = userDoc("dailyLogs", dateKey);

        await setDoc(ref, {
            date: dateKey,
            mood: data.mood || null,
            energy: data.energy || null,
            feelings: data.feelings || [],
            task: data.task || "",
            note: data.note || "",
            habitsCompleted: data.habitsCompleted || [],
            updatedAt: serverTimestamp()
        }, { merge: true });

        // Set createdAt only on first write (merge won't overwrite)
        const snap = await getDoc(ref);
        if (!snap.data()?.createdAt) {
            await updateDoc(ref, { createdAt: serverTimestamp() });
        }

        console.log("✅ Daily log saved for", dateKey);
        return { success: true, dateKey };
    } catch (err) {
        console.error("❌ Error saving daily log:", err);
        return { success: false, error: err.message };
    }
}

/**
 * Get daily log for a specific date (defaults to today).
 * 
 * @param {string} [dateKey] — "YYYY-MM-DD", defaults to today
 * @returns {Object|null} — the log data or null if no entry
 */
export async function getDailyLog(dateKey) {
    try {
        const key = dateKey || getTodayKey();
        const ref = userDoc("dailyLogs", key);
        const snap = await getDoc(ref);

        if (snap.exists()) {
            console.log("📋 Loaded daily log for", key);
            return { id: snap.id, ...snap.data() };
        }

        console.log("📋 No daily log found for", key);
        return null;
    } catch (err) {
        console.error("❌ Error getting daily log:", err);
        return null;
    }
}

/**
 * Get recent daily logs (for insights/history).
 * 
 * @param {number} [count=7] — how many recent logs to fetch
 * @returns {Object[]}
 */
export async function getRecentDailyLogs(count = 7) {
    try {
        const q = query(
            userCollection("dailyLogs"),
            orderBy("date", "desc"),
            limit(count)
        );
        const snap = await getDocs(q);
        const logs = [];
        snap.forEach(d => logs.push({ id: d.id, ...d.data() }));
        console.log(`📋 Loaded ${logs.length} recent daily logs`);
        return logs;
    } catch (err) {
        console.error("❌ Error getting recent logs:", err);
        return [];
    }
}

// ============================
// HABITS
// ============================

/**
 * Add a new habit.
 * 
 * @param {Object} data
 * @param {string} data.name      — "Gym", "Study", "Read"
 * @param {string} data.icon      — emoji icon "🏋️"
 * @param {string} data.frequency — "daily" | "weekdays" | "weekly"
 * @param {string} [data.timeOfDay] — "morning" | "afternoon" | "evening"
 * @returns {Object} — { success, id }
 */
export async function addHabit(data) {
    try {
        const ref = await addDoc(userCollection("habits"), {
            name: data.name,
            icon: data.icon || "📌",
            frequency: data.frequency || "daily",
            timeOfDay: data.timeOfDay || null,
            completedDates: [],
            createdAt: serverTimestamp()
        });

        console.log("✅ Habit added:", data.name, ref.id);
        return { success: true, id: ref.id };
    } catch (err) {
        console.error("❌ Error adding habit:", err);
        return { success: false, error: err.message };
    }
}

/**
 * Toggle habit completion for today.
 * If today's date is in completedDates → remove it (un-check).
 * If not → add it (check).
 * 
 * @param {string} habitId
 * @returns {Object} — { success, completed }
 */
export async function toggleHabitCompletion(habitId) {
    try {
        const today = getTodayKey();
        const ref = userDoc("habits", habitId);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
            return { success: false, error: "Habit not found" };
        }

        const data = snap.data();
        const dates = data.completedDates || [];
        const isCompleted = dates.includes(today);

        if (isCompleted) {
            // Un-check: remove today from array
            await updateDoc(ref, {
                completedDates: arrayRemove(today)
            });
            console.log("⬜ Habit unchecked:", habitId);
            return { success: true, completed: false };
        } else {
            // Check: add today to array
            await updateDoc(ref, {
                completedDates: arrayUnion(today)
            });
            console.log("✅ Habit checked:", habitId);
            return { success: true, completed: true };
        }
    } catch (err) {
        console.error("❌ Error toggling habit:", err);
        return { success: false, error: err.message };
    }
}

/**
 * Get all habits for the current user.
 * 
 * @returns {Object[]} — array of habit objects with id
 */
export async function getHabits() {
    try {
        const q = query(
            userCollection("habits"),
            orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        const habits = [];
        snap.forEach(d => habits.push({ id: d.id, ...d.data() }));
        console.log(`📋 Loaded ${habits.length} habits`);
        return habits;
    } catch (err) {
        console.error("❌ Error getting habits:", err);
        return [];
    }
}

/**
 * Delete a habit.
 * 
 * @param {string} habitId
 */
export async function deleteHabit(habitId) {
    try {
        await deleteDoc(userDoc("habits", habitId));
        console.log("🗑️ Habit deleted:", habitId);
        return { success: true };
    } catch (err) {
        console.error("❌ Error deleting habit:", err);
        return { success: false, error: err.message };
    }
}

/**
 * Calculate streak for a habit.
 * Counts consecutive days (backwards from today) that exist in completedDates.
 * 
 * @param {string[]} completedDates — array of "YYYY-MM-DD" strings
 * @returns {number}
 */
export function calculateStreak(completedDates) {
    if (!completedDates?.length) return 0;

    const sortedDates = [...completedDates].sort().reverse();
    const today = getTodayKey();
    let streak = 0;
    let checkDate = new Date();

    // If today isn't completed, start from yesterday
    if (!sortedDates.includes(today)) {
        checkDate.setDate(checkDate.getDate() - 1);
    }

    for (let i = 0; i < 365; i++) {
        const key = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;

        if (sortedDates.includes(key)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }

    return streak;
}

// ============================
// TRANSACTIONS
// ============================

/**
 * Add a financial transaction.
 * 
 * @param {Object} data
 * @param {string} data.type        — "income" | "expense"
 * @param {number} data.amount
 * @param {string} data.description — short description / note
 * @param {string} data.category
 * @param {string} data.method      — "upi" | "cash" | "card"
 * @param {string} data.mood        — "happy" | "neutral" | "regret"
 * @param {string} data.note        — additional note
 * @param {string} data.date        — "YYYY-MM-DD" (user-selected date)
 */
export async function addTransaction(data) {
    try {
        const ref = await addDoc(userCollection("transactions"), {
            type: data.type,
            amount: data.amount,
            description: data.description || "",
            category: data.category || "other",
            method: data.method || "cash",
            mood: data.mood || "neutral",
            note: data.note || "",
            date: data.date || getTodayKey(),
            createdAt: serverTimestamp()
        });
        console.log("✅ Transaction added:", ref.id);
        return { success: true, id: ref.id };
    } catch (err) {
        console.error("❌ Error adding transaction:", err);
        return { success: false, error: err.message };
    }
}

/**
 * Get transactions for a date range.
 * 
 * @param {string} [startDate] — "YYYY-MM-DD"
 * @param {string} [endDate]   — "YYYY-MM-DD"
 * @returns {Object[]}
 */
export async function getTransactions(startDate, endDate) {
    try {
        let q;
        if (startDate && endDate) {
            q = query(
                userCollection("transactions"),
                where("date", ">=", startDate),
                where("date", "<=", endDate),
                orderBy("date", "desc")
            );
        } else {
            q = query(
                userCollection("transactions"),
                orderBy("createdAt", "desc"),
                limit(50)
            );
        }

        const snap = await getDocs(q);
        const txns = [];
        snap.forEach(d => txns.push({ id: d.id, ...d.data() }));
        console.log(`📋 Loaded ${txns.length} transactions`);
        return txns;
    } catch (err) {
        console.error("❌ Error getting transactions:", err);
        return [];
    }
}

// ============================
// JOURNAL ENTRIES
// ============================

/**
 * Save a journal entry.
 * 
 * @param {Object} data
 * @param {string} data.title
 * @param {string} data.content
 * @param {string[]} data.tags
 * @param {string} [data.mood]
 */
export async function saveJournalEntry(data) {
    try {
        const ref = await addDoc(userCollection("journalEntries"), {
            title: data.title || "Untitled",
            content: data.content || "",
            tags: data.tags || [],
            mood: data.mood || null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        console.log("✅ Journal entry saved:", ref.id);
        return { success: true, id: ref.id };
    } catch (err) {
        console.error("❌ Error saving journal entry:", err);
        return { success: false, error: err.message };
    }
}

/**
 * Get journal entries, most recent first.
 * 
 * @param {number} [count=20]
 * @returns {Object[]}
 */
export async function getJournalEntries(count = 20) {
    try {
        const q = query(
            userCollection("journalEntries"),
            orderBy("createdAt", "desc"),
            limit(count)
        );
        const snap = await getDocs(q);
        const entries = [];
        snap.forEach(d => entries.push({ id: d.id, ...d.data() }));
        console.log(`📋 Loaded ${entries.length} journal entries`);
        return entries;
    } catch (err) {
        console.error("❌ Error getting journal entries:", err);
        return [];
    }
}

// ============================
// EXPOSE GLOBALLY
// ============================
window.LifeOSDB = {
    // Daily Logs
    saveDailyLog,
    getDailyLog,
    getRecentDailyLogs,
    // Habits
    addHabit,
    toggleHabitCompletion,
    getHabits,
    deleteHabit,
    calculateStreak,
    // Transactions
    addTransaction,
    getTransactions,
    // Journal
    saveJournalEntry,
    getJournalEntries,
    // User
    saveUserProfile,
    // Helpers
    getTodayKey
};

console.log("🗄️ LifeOS Database module loaded");
