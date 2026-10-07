class Habit {
  final String id;
  final String name;
  final String icon;
  final String category;
  final String frequency;
  final List<String> completedDates; // "YYYY-MM-DD"

  Habit({
    required this.id,
    required this.name,
    required this.icon,
    this.category = 'health',
    this.frequency = 'daily',
    List<String>? completedDates,
  }) : completedDates = completedDates ?? [];

  bool isCompletedOn(String dateKey) {
    return completedDates.contains(dateKey);
  }

  int get streak {
    if (completedDates.isEmpty) return 0;
    final sorted = List<String>.from(completedDates)..sort();
    final reversed = sorted.reversed.toList();
    
    final today = DateTime.now();
    final todayKey = "${today.year}-${today.month.toString().padLeft(2, '0')}-${today.day.toString().padLeft(2, '0')}";
    
    int streakCount = 0;
    DateTime checkDate = today;
    
    if (!reversed.contains(todayKey)) {
      checkDate = today.subtract(const Duration(days: 1));
    }
    
    for (int i = 0; i < 365; i++) {
      final key = "${checkDate.year}-${checkDate.month.toString().padLeft(2, '0')}-${checkDate.day.toString().padLeft(2, '0')}";
      if (reversed.contains(key)) {
        streakCount++;
        checkDate = checkDate.subtract(const Duration(days: 1));
      } else {
        break;
      }
    }
    return streakCount;
  }
}
