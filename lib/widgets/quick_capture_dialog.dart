import 'package:flutter/material.dart';
import '../services/mock_service.dart';
import '../theme/app_theme.dart';

class QuickCaptureDialog extends StatefulWidget {
  const QuickCaptureDialog({Key? key}) : super(key: key);

  static void show(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => const QuickCaptureDialog(),
    );
  }

  @override
  State<QuickCaptureDialog> createState() => _QuickCaptureDialogState();
}

class _QuickCaptureDialogState extends State<QuickCaptureDialog> {
  int _activeTab = 0; // 0: Idea, 1: Expense, 2: Mood

  // Idea fields
  final _ideaTitleController = TextEditingController();
  final _ideaContentController = TextEditingController();

  // Expense fields
  final _expAmountController = TextEditingController();
  final _expNoteController = TextEditingController();
  String _expCategory = 'food';

  // Mood fields
  String _selectedMood = 'happy';
  String _selectedEnergy = 'high';

  @override
  void dispose() {
    _ideaTitleController.dispose();
    _ideaContentController.dispose();
    _expAmountController.dispose();
    _expNoteController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      child: Container(
        constraints: const BoxConstraints(maxWidth: 500),
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: const [
                    Text('⚡', style: TextStyle(fontSize: 20)),
                    SizedBox(width: 8),
                    Text(
                      '2nd Brain Quick Capture',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                  ],
                ),
                IconButton(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(Icons.close, color: AppTheme.textMuted, size: 20),
                ),
              ],
            ),
            const SizedBox(height: 14),

            // Tab Selector
            Container(
              decoration: BoxDecoration(
                color: AppTheme.base,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.border.withOpacity(0.5)),
              ),
              child: Row(
                children: [
                  _buildTabButton(0, '💡 Idea / Note'),
                  _buildTabButton(1, '💸 Expense'),
                  _buildTabButton(2, '😊 Mood Log'),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Content Panel
            if (_activeTab == 0) _buildIdeaPanel(),
            if (_activeTab == 1) _buildExpensePanel(),
            if (_activeTab == 2) _buildMoodPanel(),
          ],
        ),
      ),
    );
  }

  Widget _buildTabButton(int index, String label) {
    final isSelected = _activeTab == index;
    return Expanded(
      child: InkWell(
        onTap: () => setState(() => _activeTab = index),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSelected ? AppTheme.card : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              color: isSelected ? AppTheme.accent : AppTheme.textMuted,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildIdeaPanel() {
    return Column(
      children: [
        TextField(
          controller: _ideaTitleController,
          decoration: const InputDecoration(
            hintText: 'Title / Subject',
          ),
        ),
        const SizedBox(height: 10),
        TextField(
          controller: _ideaContentController,
          maxLines: 3,
          decoration: const InputDecoration(
            hintText: 'Capture thought or idea...',
          ),
        ),
        const SizedBox(height: 16),
        SizedBox(
          width: double.infinity,
          height: 44,
          child: ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.accent,
              foregroundColor: AppTheme.base,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            onPressed: () {
              if (_ideaContentController.text.trim().isEmpty) return;
              MockService().addJournalEntry(
                type: 'idea',
                title: _ideaTitleController.text.trim().isNotEmpty
                    ? _ideaTitleController.text.trim()
                    : 'Quick Note',
                content: _ideaContentController.text.trim(),
              );
              Navigator.of(context).pop();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Saved to Journal Ideas! 💡')),
              );
            },
            child: const Text('Save to 2nd Brain 💡', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ),
      ],
    );
  }

  Widget _buildExpensePanel() {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _expAmountController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  hintText: 'Amount (₹)',
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: DropdownButtonFormField<String>(
                value: _expCategory,
                items: const [
                  DropdownMenuItem(value: 'food', child: Text('🍔 Food')),
                  DropdownMenuItem(value: 'transport', child: Text('🚗 Transport')),
                  DropdownMenuItem(value: 'shopping', child: Text('🛍️ Shopping')),
                  DropdownMenuItem(value: 'bills', child: Text('📄 Bills')),
                  DropdownMenuItem(value: 'entertainment', child: Text('🎬 Entertainment')),
                  DropdownMenuItem(value: 'other', child: Text('📦 Other')),
                ],
                onChanged: (val) {
                  if (val != null) setState(() => _expCategory = val);
                },
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        TextField(
          controller: _expNoteController,
          decoration: const InputDecoration(
            hintText: 'Note / Description',
          ),
        ),
        const SizedBox(height: 16),
        SizedBox(
          width: double.infinity,
          height: 44,
          child: ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.accent,
              foregroundColor: AppTheme.base,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            onPressed: () {
              final amt = double.tryParse(_expAmountController.text);
              if (amt == null || amt <= 0) return;

              MockService().addTransaction(
                type: 'expense',
                amount: amt,
                category: _expCategory,
                method: 'cash',
                mood: 'neutral',
                note: _expNoteController.text.trim(),
                date: MockService().todayKey,
              );
              Navigator.of(context).pop();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Expense Logged! 💸')),
              );
            },
            child: const Text('Log Expense 💸', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ),
      ],
    );
  }

  Widget _buildMoodPanel() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('How are you feeling right now?', style: TextStyle(fontSize: 12, color: AppTheme.textMuted)),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            _buildMoodIcon('happy', '😊'),
            _buildMoodIcon('neutral', '😐'),
            _buildMoodIcon('sad', '😞'),
          ],
        ),
        const SizedBox(height: 14),
        const Text('Energy Level', style: TextStyle(fontSize: 12, color: AppTheme.textMuted)),
        const SizedBox(height: 8),
        Row(
          children: [
            _buildEnergyPill('low', 'Low'),
            const SizedBox(width: 8),
            _buildEnergyPill('medium', 'Medium'),
            const SizedBox(width: 8),
            _buildEnergyPill('high', 'High'),
          ],
        ),
        const SizedBox(height: 16),
        SizedBox(
          width: double.infinity,
          height: 44,
          child: ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.accent,
              foregroundColor: AppTheme.base,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            onPressed: () {
              MockService().updateDailyLog(
                mood: _selectedMood,
                energy: _selectedEnergy,
              );
              Navigator.of(context).pop();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Mood Logged! 😊')),
              );
            },
            child: const Text('Log Mood & Energy 😊', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ),
      ],
    );
  }

  Widget _buildMoodIcon(String key, String emoji) {
    final isSelected = _selectedMood == key;
    return InkWell(
      onTap: () => setState(() => _selectedMood = key),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.accent.withOpacity(0.15) : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(emoji, style: TextStyle(fontSize: isSelected ? 32 : 26)),
      ),
    );
  }

  Widget _buildEnergyPill(String key, String label) {
    final isSelected = _selectedEnergy == key;
    return Expanded(
      child: InkWell(
        onTap: () => setState(() => _selectedEnergy = key),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSelected ? AppTheme.accent : AppTheme.base,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: isSelected ? AppTheme.accent : AppTheme.border),
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              color: isSelected ? AppTheme.base : AppTheme.textSecondary,
            ),
          ),
        ),
      ),
    );
  }
}
