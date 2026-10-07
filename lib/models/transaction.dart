class FinancialTransaction {
  final String id;
  final String type; // "income" or "expense"
  final double amount;
  final String category;
  final String method; // "upi", "cash", "card"
  final String mood; // "happy", "neutral", "regret"
  final String note;
  final String date; // "YYYY-MM-DD"

  FinancialTransaction({
    required this.id,
    required this.type,
    required this.amount,
    required this.category,
    this.method = 'cash',
    this.mood = 'neutral',
    this.note = '',
    required this.date,
  });
}
