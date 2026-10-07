import 'package:flutter/material.dart';
import '../services/mock_service.dart';
import '../theme/app_theme.dart';

class HabitsView extends StatefulWidget {
  const HabitsView({Key? key}) : super(key: key);

  @override
  State<HabitsView> createState() => _HabitsViewState();
}

class _HabitsViewState extends State<HabitsView> {
  final _nameController = TextEditingController();
  final _iconController = TextEditingController();
  String _selectedCategory = 'health';
  String _selectedFrequency = 'daily';

  void _showAddHabitDialog(BuildContext context) {
    _nameController.clear();
    _iconController.clear();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Create New Habit', style: TextStyle(fontWeight: FontWeight.bold)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: _nameController,
                decoration: const InputDecoration(labelText: 'Habit Name', hintText: 'e.g., Morning Meditation'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _iconController,
                decoration: const InputDecoration(labelText: 'Icon (emoji)', hintText: '🧘'),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: _selectedCategory,
                decoration: const InputDecoration(labelText: 'Category'),
                items: const [
                  DropdownMenuItem(value: 'health', child: Text('💪 Health')),
                  DropdownMenuItem(value: 'life', child: Text('🌱 Life')),
                  DropdownMenuItem(value: 'study', child: Text('📚 Study')),
                  DropdownMenuItem(value: 'work', child: Text('💼 Work')),
                ],
                onChanged: (val) => setState(() => _selectedCategory = val ?? 'health'),
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
              if (_nameController.text.trim().isEmpty) return;
              MockService().addHabit(
                _nameController.text.trim(),
                _iconController.text.trim(),
                _selectedCategory,
                _selectedFrequency,
              );
              Navigator.of(context).pop();
            },
            child: const Text('Save Habit', style: TextStyle(fontWeight: FontWeight.bold)),
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
        final habits = service.habits;

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
                        'Habit Tracker',
                        style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                      ),
                      SizedBox(height: 2),
                      Text('Build streaks, build yourself.', style: TextStyle(fontSize: 12, color: AppTheme.textMuted)),
                    ],
                  ),
                  ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.accent,
                      foregroundColor: AppTheme.base,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: () => _showAddHabitDialog(context),
                    icon: const Icon(Icons.add, size: 18),
                    label: const Text('New Habit', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Streak Overview Cards
              Row(
                children: [
                  _buildStatCard('🔥 Streak', '${_calculateMaxStreak(habits)} Days', 'Best Active Streak'),
                  const SizedBox(width: 12),
                  _buildStatCard('✅ Today', '${habits.where((h) => h.isCompletedOn(service.todayKey)).length}/${habits.length}', 'Completed Today'),
                  const SizedBox(width: 12),
                  _buildStatCard('🎯 Habits', '${habits.length}', 'Active Habits'),
                ],
              ),
              const SizedBox(height: 24),

              // Habits List
              const Text('MY HABITS', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.textMuted, letterSpacing: 1.2)),
              const SizedBox(height: 10),

              if (habits.isEmpty)
                Container(
                  padding: const EdgeInsets.all(32),
                  alignment: Alignment.center,
                  child: Column(
                    children: const [
                      Text('🎯', style: TextStyle(fontSize: 40)),
                      SizedBox(height: 8),
                      Text('No habits yet', style: TextStyle(fontWeight: FontWeight.bold)),
                      Text('Tap "+ New Habit" to create one.', style: TextStyle(fontSize: 12, color: AppTheme.textMuted)),
                    ],
                  ),
                )
              else
                ...habits.map((habit) {
                  final isDone = habit.isCompletedOn(service.todayKey);
                  return Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppTheme.card,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: AppTheme.border),
                    ),
                    child: Row(
                      children: [
                        Text(habit.icon, style: const TextStyle(fontSize: 28)),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                habit.name,
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,
                                  decoration: isDone ? TextDecoration.lineThrough : null,
                                  color: isDone ? AppTheme.textMuted : AppTheme.textPrimary,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'Streak: ${habit.streak} days • ${habit.category.toUpperCase()}',
                                style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.delete_outline, color: AppTheme.textMuted, size: 20),
                          onPressed: () => service.deleteHabit(habit.id),
                        ),
                        const SizedBox(width: 8),
                        Transform.scale(
                          scale: 1.2,
                          child: Checkbox(
                            value: isDone,
                            activeColor: AppTheme.accent,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(5)),
                            onChanged: (_) => service.toggleHabitToday(habit.id),
                          ),
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

  int _calculateMaxStreak(List habits) {
    if (habits.isEmpty) return 0;
    int max = 0;
    for (var h in habits) {
      if (h.streak > max) max = h.streak;
    }
    return max;
  }

  Widget _buildStatCard(String iconTitle, String val, String sub) {
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
            Text(iconTitle, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textMuted)),
            const SizedBox(height: 6),
            Text(val, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.black, color: AppTheme.accent)),
            const SizedBox(height: 2),
            Text(sub, style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
          ],
        ),
      ),
    );
  }
}
