import 'package:flutter/material.dart';
import '../services/mock_service.dart';
import '../theme/app_theme.dart';

class MoneyView extends StatefulWidget {
  const MoneyView({Key? key}) : super(key: key);

  @override
  State<MoneyView> createState() => _MoneyViewState();
}

class _MoneyViewState extends State<MoneyView> {
  final _amountController = TextEditingController();
  final _noteController = TextEditingController();
  String _selectedType = 'expense';
  String _selectedCategory = 'food';

  @override
  void dispose() {
    _amountController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  void _showAddTxnDialog(BuildContext context) {
    _amountController.clear();
    _noteController.clear();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Add Transaction', style: TextStyle(fontWeight: FontWeight.bold)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  Expanded(
                    child: ChoiceChip(
                      label: const Text('Expense 💸'),
                      selected: _selectedType == 'expense',
                      onSelected: (val) => setState(() => _selectedType = 'expense'),
                      selectedColor: Colors.red.withOpacity(0.2),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ChoiceChip(
                      label: const Text('Income 💰'),
                      selected: _selectedType == 'income',
                      onSelected: (val) => setState(() => _selectedType = 'income'),
                      selectedColor: AppTheme.accent.withOpacity(0.2),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              TextField(
                controller: _amountController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Amount (₹)', hintText: '0'),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: _selectedCategory,
                decoration: const InputDecoration(labelText: 'Category'),
                items: const [
                  DropdownMenuItem(value: 'food', child: Text('🍔 Food')),
                  DropdownMenuItem(value: 'transport', child: Text('🚗 Transport')),
                  DropdownMenuItem(value: 'shopping', child: Text('🛍️ Shopping')),
                  DropdownMenuItem(value: 'bills', child: Text('📄 Bills')),
                  DropdownMenuItem(value: 'salary', child: Text('💰 Salary')),
                  DropdownMenuItem(value: 'other', child: Text('📦 Other')),
                ],
                onChanged: (val) => setState(() => _selectedCategory = val ?? 'food'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _noteController,
                decoration: const InputDecoration(labelText: 'Note', hintText: 'What was this for?'),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel', style: TextStyle(color: AppTheme.textMuted)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.accent,
              foregroundColor: AppTheme.base,
            ),
            onPressed: () {
              final amt = double.tryParse(_amountController.text);
              if (amt == null || amt <= 0) return;
              MockService().addTransaction(
                type: _selectedType,
                amount: amt,
                category: _selectedCategory,
                method: 'upi',
                mood: 'happy',
                note: _noteController.text.trim(),
                date: MockService().todayKey,
              );
              Navigator.of(context).pop();
            },
            child: const Text('Save Transaction', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final service = MockService();

    return AnimatedBuilder(
      animation: service,
      builder: (context, _) {
        final txns = service.transactions;

        double income = 0;
        double expenses = 0;
        for (var t in txns) {
          if (t.type == 'income') income += t.amount;
          else expenses += t.amount;
        }
        double balance = income - expenses;

        return SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Text(
                        'Money Tracker',
                        style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                      ),
                      SizedBox(height: 2),
                      Text('Track your spending, master your wealth.', style: TextStyle(fontSize: 12, color: AppTheme.textMuted)),
                    ],
                  ),
                  ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.accent,
                      foregroundColor: AppTheme.base,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: () => _showAddTxnDialog(context),
                    icon: const Icon(Icons.add, size: 18),
                    label: const Text('Add Txn', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Summary Cards
              Row(
                children: [
                  _buildSummaryCard(
                    'Net Balance',
                    '₹${balance.toStringAsFixed(0)}',
                    balance >= 0 ? AppTheme.accent : Colors.red,
                  ),
                  const SizedBox(width: 10),
                  _buildSummaryCard(
                    'Income',
                    '₹${income.toStringAsFixed(0)}',
                    AppTheme.accent,
                  ),
                  const SizedBox(width: 10),
                  _buildSummaryCard(
                    'Spent',
                    '₹${expenses.toStringAsFixed(0)}',
                    Colors.redAccent,
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Transaction History
              const Text('RECENT TRANSACTIONS', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.textMuted, letterSpacing: 1.2)),
              const SizedBox(height: 10),

              if (txns.isEmpty)
                const Center(child: Text('No transactions recorded.', style: TextStyle(color: AppTheme.textMuted)))
              else
                ...txns.map((t) {
                  final isIncome = t.type == 'income';
                  return Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppTheme.card,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppTheme.border),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 42,
                          height: 42,
                          decoration: BoxDecoration(
                            color: isIncome ? AppTheme.accent.withOpacity(0.12) : Colors.red.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Center(
                            child: Text(
                              t.category == 'food' ? '🍔' : (t.category == 'transport' ? '🚗' : (t.category == 'salary' ? '💰' : '📦')),
                              style: const TextStyle(fontSize: 20),
                            ),
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                t.note.isNotEmpty ? t.note : t.category.toUpperCase(),
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                              ),
                              const SizedBox(height: 2),
                              Text('${t.category} • ${t.date}', style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                            ],
                          ),
                        ),
                        Text(
                          '${isIncome ? '+' : '-'}₹${t.amount.toStringAsFixed(0)}',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
                            color: isIncome ? AppTheme.accent : Colors.redAccent,
                          ),
                        ),
                        const SizedBox(width: 6),
                        IconButton(
                          icon: const Icon(Icons.delete_outline, color: AppTheme.textMuted, size: 18),
                          onPressed: () => service.deleteTransaction(t.id),
                        ),
                      ],
                    ),
                  );
                }),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSummaryCard(String title, String val, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppTheme.card,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: AppTheme.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
            const SizedBox(height: 6),
            Text(val, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: color)),
          ],
        ),
      ),
    );
  }
}
