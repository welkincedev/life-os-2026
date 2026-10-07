import 'package:flutter/material.dart';
import '../services/mock_service.dart';
import '../theme/app_theme.dart';

class JournalView extends StatefulWidget {
  const JournalView({Key? key}) : super(key: key);

  @override
  State<JournalView> createState() => _JournalViewState();
}

class _JournalViewState extends State<JournalView> {
  int _activeTab = 0; // 0: Daily, 1: Idea, 2: Letter
  final _contentController = TextEditingController();
  final _titleController = TextEditingController();

  final List<String> _prompts = [
    "What are you grateful for today?",
    "What's one thing you learned recently?",
    "Describe your ideal day in detail.",
    "What challenge are you currently facing?",
    "What small win did you have today?",
  ];

  @override
  void dispose() {
    _contentController.dispose();
    _titleController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final service = MockService();

    return AnimatedBuilder(
      animation: service,
      builder: (context, _) {
        final entries = service.journalEntries;

        return SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  Text(
                    'Journal & Reflection',
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                  ),
                  SizedBox(height: 2),
                  Text('Clear your mind, capture your thoughts.', style: TextStyle(fontSize: 12, color: AppTheme.textMuted)),
                ],
              ),
              const SizedBox(height: 20),

              // Daily Prompt Box
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.accent.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.accent.withOpacity(0.2)),
                ),
                child: Row(
                  children: [
                    const Text('💡', style: TextStyle(fontSize: 20)),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('DAILY PROMPT', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.accent, letterSpacing: 1.2)),
                          const SizedBox(height: 2),
                          Text(
                            '"${_prompts[DateTime.now().day % _prompts.length]}"',
                            style: const TextStyle(fontSize: 13, fontStyle: FontStyle.italic, color: AppTheme.textPrimary),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Editor Card
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppTheme.card,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppTheme.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Tabs
                    Row(
                      children: [
                        _buildTabBtn(0, '📝 Daily Reflection'),
                        const SizedBox(width: 8),
                        _buildTabBtn(1, '💡 Idea Vault'),
                        const SizedBox(width: 8),
                        _buildTabBtn(2, '💌 Unsent Letter'),
                      ],
                    ),
                    const SizedBox(height: 16),

                    if (_activeTab == 2) ...[
                      TextField(
                        controller: _titleController,
                        decoration: const InputDecoration(hintText: 'To (e.g. Future Self, Friend...)'),
                      ),
                      const SizedBox(height: 10),
                    ],

                    TextField(
                      controller: _contentController,
                      maxLines: 4,
                      decoration: InputDecoration(
                        hintText: _activeTab == 0
                            ? 'Write your daily reflection...'
                            : (_activeTab == 1 ? 'Describe your idea...' : 'Write your letter...'),
                      ),
                    ),
                    const SizedBox(height: 14),

                    Align(
                      alignment: Alignment.centerRight,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.accent,
                          foregroundColor: AppTheme.base,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: () {
                          final text = _contentController.text.trim();
                          if (text.isEmpty) return;

                          String type = _activeTab == 0 ? 'daily' : (_activeTab == 1 ? 'idea' : 'letter');
                          String title = _activeTab == 0
                              ? 'Daily Reflection'
                              : (_activeTab == 1 ? 'Idea' : 'Letter to ${_titleController.text.trim()}');

                          service.addJournalEntry(type: type, title: title, content: text);
                          _contentController.clear();
                          _titleController.clear();

                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Journal Entry Saved! 📝')),
                          );
                        },
                        child: const Text('Save Entry 📝', style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Past Entries
              const Text('PAST ENTRIES', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.textMuted, letterSpacing: 1.2)),
              const SizedBox(height: 10),

              if (entries.isEmpty)
                const Center(child: Text('No journal entries yet.', style: TextStyle(color: AppTheme.textMuted)))
              else
                ...entries.map((entry) => Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppTheme.card,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppTheme.border),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(entry.type == 'idea' ? '💡' : (entry.type == 'letter' ? '💌' : '📝'), style: const TextStyle(fontSize: 22)),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(entry.title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                                    Text(entry.date, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  entry.content,
                                  style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary, height: 1.4),
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.delete_outline, color: AppTheme.textMuted, size: 18),
                            onPressed: () => service.deleteJournalEntry(entry.id),
                          ),
                        ],
                      ),
                    )),
            ],
          ),
        );
      },
    );
  }

  Widget _buildTabBtn(int index, String label) {
    final isSelected = _activeTab == index;
    return InkWell(
      onTap: () => setState(() => _activeTab = index),
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.accent.withOpacity(0.15) : AppTheme.base,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: isSelected ? AppTheme.accent : AppTheme.border),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            color: isSelected ? AppTheme.accent : AppTheme.textMuted,
          ),
        ),
      ),
    );
  }
}
