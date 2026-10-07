class JournalEntry {
  final String id;
  final String type; // "daily", "idea", "letter"
  final String title;
  final String content;
  final String date; // "YYYY-MM-DD"
  final DateTime createdAt;

  JournalEntry({
    required this.id,
    required this.type,
    required this.title,
    required this.content,
    required this.date,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();
}
