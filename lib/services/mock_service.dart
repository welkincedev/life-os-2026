import 'package:flutter/foundation.dart';
import '../models/habit.dart';
import '../models/daily_log.dart';
import '../models/transaction.dart';
import '../models/journal_entry.dart';

class MockService extends ChangeNotifier {
  static final MockService _instance = MockService._internal();
  factory MockService() => _instance;

  MockService._internal() {
    _initDemoData();
  }

  // Auth State
  bool _isLoggedIn = false;
  String _userName = 'Adwaith';
  String _userEmail = 'adwaith@lifeos.app';

  bool get isLoggedIn => _isLoggedIn;
  String get userName => _userName;
  String get userEmail => _userEmail;

  // Tree Level & EXP
  int _treeLevel = 3;
  int _treeExp = 65; // %
  int get treeLevel => _treeLevel;
  int get treeExp => _treeExp;

  // Data Collections
  final List<Habit> _habits = [];
  final Map<String, DailyLog> _dailyLogs = {};
  final List<FinancialTransaction> _transactions = [];
  final List<JournalEntry> _journalEntries = [];

  List<Habit> get habits => List.unmodifiable(_habits);
  List<FinancialTransaction> get transactions => List.unmodifiable(_transactions);
  List<JournalEntry> get journalEntries => List.unmodifiable(_journalEntries);

  String get todayKey {
    final now = DateTime.now();
    return "${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}";
  }

  DailyLog get todayLog => _dailyLogs[todayKey] ?? DailyLog(date: todayKey);

  void loginDemo(String name, String email) {
    _userName = name.isNotEmpty ? name : 'Adwaith';
    _userEmail = email.isNotEmpty ? email : 'adwaith@lifeos.app';
    _isLoggedIn = true;
    notifyListeners();
  }

  void logout() {
    _isLoggedIn = false;
    notifyListeners();
  }

  // --- Habit Actions ---
  void toggleHabitToday(String habitId) {
    final index = _habits.indexWhere((h) => h.id == habitId);
    if (index != -1) {
      final habit = _habits[index];
      final dates = List<String>.from(habit.completedDates);
      if (dates.contains(todayKey)) {
        dates.remove(todayKey);
      } else {
        dates.add(todayKey);
      }
      _habits[index] = Habit(
        id: habit.id,
        name: habit.name,
        icon: habit.icon,
        category: habit.category,
        frequency: habit.frequency,
        completedDates: dates,
      );
      notifyListeners();
    }
  }

  void addHabit(String name, String icon, String category, String frequency) {
    final newHabit = Habit(
      id: 'h_${DateTime.now().millisecondsSinceEpoch}',
      name: name,
      icon: icon.isNotEmpty ? icon : '📌',
      category: category,
      frequency: frequency,
    );
    _habits.add(newHabit);
    notifyListeners();
  }

  void deleteHabit(String id) {
    _habits.removeWhere((h) => h.id == id);
    notifyListeners();
  }

  // --- Daily Log Actions ---
  void updateDailyLog({
    String? mood,
    String? energy,
    List<String>? feelings,
    String? task,
    String? note,
  }) {
    final current = todayLog;
    _dailyLogs[todayKey] = current.copyWith(
      mood: mood,
      energy: energy,
      feelings: feelings,
      task: task,
      note: note,
    );
    notifyListeners();
  }

  // --- Tree Action ---
  void waterTree() {
    _treeExp += 20;
    if (_treeExp >= 100) {
      _treeLevel += 1;
      _treeExp = _treeExp - 100;
    }
    notifyListeners();
  }

  // --- Financial Actions ---
  void addTransaction({
    required String type,
    required double amount,
    required String category,
    required String method,
    required String mood,
    required String note,
    required String date,
  }) {
    final txn = FinancialTransaction(
      id: 't_${DateTime.now().millisecondsSinceEpoch}',
      type: type,
      amount: amount,
      category: category,
      method: method,
      mood: mood,
      note: note,
      date: date.isNotEmpty ? date : todayKey,
    );
    _transactions.insert(0, txn);
    notifyListeners();
  }

  void deleteTransaction(String id) {
    _transactions.removeWhere((t) => t.id == id);
    notifyListeners();
  }

  // --- Journal Actions ---
  void addJournalEntry({
    required String type,
    required String title,
    required String content,
  }) {
    final entry = JournalEntry(
      id: 'j_${DateTime.now().millisecondsSinceEpoch}',
      type: type,
      title: title,
      content: content,
      date: todayKey,
    );
    _journalEntries.insert(0, entry);
    notifyListeners();
  }

  void deleteJournalEntry(String id) {
    _journalEntries.removeWhere((j) => j.id == id);
    notifyListeners();
  }

  // Demo initial data
  void _initDemoData() {
    // Habits
    final yesterday = DateTime.now().subtract(const Duration(days: 1));
    final yKey = "${yesterday.year}-${yesterday.month.toString().padLeft(2, '0')}-${yesterday.day.toString().padLeft(2, '0')}";

    _habits.addAll([
      Habit(id: 'h1', name: 'Gym & Workout', icon: '🏋️', category: 'health', completedDates: [yKey]),
      Habit(id: 'h2', name: 'Read 20 Pages', icon: '📖', category: 'study', completedDates: [yKey, todayKey]),
      Habit(id: 'h3', name: 'Morning Meditation', icon: '🧘', category: 'life', completedDates: [yKey]),
      Habit(id: 'h4', name: 'Code 1 Hour', icon: '💻', category: 'work', completedDates: [yKey, todayKey]),
    ]);

    // Initial Today Log
    _dailyLogs[todayKey] = DailyLog(
      date: todayKey,
      mood: 'happy',
      energy: 'high',
      feelings: ['calm', 'productive'],
      task: 'Build LifeOS 2.0 Flutter cross-platform experience',
      note: 'Feeling sharp and focused today!',
    );

    // Initial Transactions
    _transactions.addAll([
      FinancialTransaction(id: 't1', type: 'expense', amount: 420.0, category: 'food', method: 'upi', mood: 'happy', note: 'Healthy Lunch Salad', date: todayKey),
      FinancialTransaction(id: 't2', type: 'income', amount: 1200.0, category: 'salary', method: 'bank', mood: 'happy', note: 'Freelance Milestone', date: todayKey),
      FinancialTransaction(id: 't3', type: 'expense', amount: 150.0, category: 'transport', method: 'upi', mood: 'neutral', note: 'Metro Travel', date: yKey),
    ]);

    // Initial Journal
    _journalEntries.addAll([
      JournalEntry(id: 'j1', type: 'daily', title: 'Daily Reflection', content: 'Today was productive. Focused on clarity and clean design in LifeOS.', date: todayKey),
      JournalEntry(id: 'j2', type: 'idea', title: 'LifeOS Smart Nudge Engine', content: 'Use real-time health + habit correlation to nudge before burnout.', date: todayKey),
      JournalEntry(id: 'j3', type: 'letter', title: 'Letter to Future Self', content: 'Dear Future Adwaith,\n\nAlways protect your focus and balance work with peace.', date: yKey),
    ]);
  }
}
