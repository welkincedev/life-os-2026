import 'package:flutter/material.dart';
import '../services/mock_service.dart';

class LifeScoreData {
  final int score;
  final String statusLabel;
  final Color statusColor;
  final int habitPct;
  final int wellnessPct;
  final int financePct;
  final int reflectionPct;

  LifeScoreData({
    required this.score,
    required this.statusLabel,
    required this.statusColor,
    required this.habitPct,
    required this.wellnessPct,
    required this.financePct,
    required this.reflectionPct,
  });
}

class LifeNudge {
  final String icon;
  final String title;
  final String text;
  final String type;

  LifeNudge({
    required this.icon,
    required this.title,
    required this.text,
    required this.type,
  });
}

class LifeScoreService {
  static LifeScoreData calculate(MockService service) {
    final habits = service.habits;
    final todayLog = service.todayLog;
    final transactions = service.transactions;
    final journal = service.journalEntries;

    // 1. Habits Score (35%)
    int habitPct = 50;
    if (habits.isNotEmpty) {
      int doneCount = habits.where((h) => h.isCompletedOn(service.todayKey)).length;
      habitPct = ((doneCount / habits.length) * 100).round();
    }

    // 2. Wellness Score (25%)
    int wellnessPct = 60;
    int moodScore = todayLog.mood == 'happy' ? 90 : (todayLog.mood == 'neutral' ? 65 : 35);
    int energyScore = todayLog.energy == 'high' ? 90 : (todayLog.energy == 'medium' ? 65 : 35);
    wellnessPct = ((moodScore + energyScore) / 2).round();

    // 3. Finance Score (25%)
    int financePct = 70;
    double income = 0;
    double expense = 0;
    for (var t in transactions) {
      if (t.type == 'income') income += t.amount;
      else expense += t.amount;
    }
    if (income > 0) {
      double ratio = (income - expense) / income;
      financePct = (ratio * 100).clamp(0, 100).round();
    }

    // 4. Reflection Score (15%)
    int reflectionPct = journal.isNotEmpty ? 80 : 30;

    // Weighted Total Score
    int overall = ((habitPct * 0.35) + (wellnessPct * 0.25) + (financePct * 0.25) + (reflectionPct * 0.15)).round();

    String label = "Steady ⚖️";
    Color color = const Color(0xFFEAB308);

    if (overall >= 85) {
      label = "Thriving 🌱";
      color = const Color(0xFF22C55E);
    } else if (overall >= 70) {
      label = "On Track ⚡";
      color = const Color(0xFF3B82F6);
    } else if (overall >= 55) {
      label = "Balanced ⚖️";
      color = const Color(0xFFEAB308);
    } else {
      label = "Needs Recharge 🔋";
      color = const Color(0xFFF97316);
    }

    return LifeScoreData(
      score: overall,
      statusLabel: label,
      statusColor: color,
      habitPct: habitPct,
      wellnessPct: wellnessPct,
      financePct: financePct,
      reflectionPct: reflectionPct,
    );
  }

  static List<LifeNudge> getNudges(MockService service) {
    final nudges = <LifeNudge>[];
    final habits = service.habits;
    final log = service.todayLog;
    final txns = service.transactions;

    final doneHabits = habits.where((h) => h.isCompletedOn(service.todayKey)).length;
    if (habits.isNotEmpty) {
      if (doneHabits == habits.length) {
        nudges.add(LifeNudge(
          icon: "🏆",
          title: "All Habits Crushed Today!",
          text: "You've completed all $doneHabits habits today. Outstanding momentum!",
          type: "success",
        ));
      } else {
        nudges.add(LifeNudge(
          icon: "🎯",
          title: "Habit Progress ($doneHabits/${habits.length})",
          text: "Finish your remaining habits to keep your streak alive.",
          type: "focus",
        ));
      }
    }

    if (log.energy == 'low') {
      nudges.add(LifeNudge(
        icon: "🔋",
        title: "Low Energy Detected",
        text: "Take a 5-minute breather in Calm Zone or do a quick stretch.",
        type: "warning",
      ));
    } else if (log.mood == 'happy' && log.energy == 'high') {
      nudges.add(LifeNudge(
        icon: "⚡",
        title: "Peak Mental State",
        text: "High energy & positive mood. Great time to focus on your main goal!",
        type: "success",
      ));
    }

    if (txns.isNotEmpty) {
      double spentToday = txns
          .where((t) => t.date == service.todayKey && t.type == 'expense')
          .fold(0.0, (sum, t) => sum + t.amount);
      if (spentToday > 0) {
        nudges.add(LifeNudge(
          icon: "💸",
          title: "Money Tracked",
          text: "₹${spentToday.toStringAsFixed(0)} spent today. Good record keeping!",
          type: "finance",
        ));
      }
    }

    return nudges;
  }
}
