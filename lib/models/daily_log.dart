class DailyLog {
  final String date; // "YYYY-MM-DD"
  final String? mood; // "happy", "neutral", "sad"
  final String? energy; // "low", "medium", "high"
  final List<String> feelings; // ["calm", "busy", "productive", "heavy"]
  final String task;
  final String note;
  final List<String> habitsCompleted;

  DailyLog({
    required this.date,
    this.mood,
    this.energy,
    List<String>? feelings,
    this.task = '',
    this.note = '',
    List<String>? habitsCompleted,
  })  : feelings = feelings ?? [],
        habitsCompleted = habitsCompleted ?? [];

  DailyLog copyWith({
    String? mood,
    String? energy,
    List<String>? feelings,
    String? task,
    String? note,
    List<String>? habitsCompleted,
  }) {
    return DailyLog(
      date: date,
      mood: mood ?? this.mood,
      energy: energy ?? this.energy,
      feelings: feelings ?? this.feelings,
      task: task ?? this.task,
      note: note ?? this.note,
      habitsCompleted: habitsCompleted ?? this.habitsCompleted,
    );
  }
}
