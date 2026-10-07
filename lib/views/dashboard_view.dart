import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/mock_service.dart';
import '../services/life_score_service.dart';
import '../theme/app_theme.dart';
import '../widgets/second_brain_coach_modal.dart';

class DashboardView extends StatefulWidget {
  const DashboardView({Key? key}) : super(key: key);

  @override
  State<DashboardView> createState() => _DashboardViewState();
}

class _DashboardViewState extends State<DashboardView> {
  late TextEditingController _taskController;
  late TextEditingController _noteController;

  @override
  void initState() {
    super.initState()
    final log = MockService().todayLog;
    _taskController = TextEditingController(text: log.task);
    _noteController = TextEditingController(text: log.note);
  }

  @override
  void dispose() {
    _taskController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final service = MockService();
    final isDesktop = MediaQuery.of(context).size.width > 1000;

    return AnimatedBuilder(
      animation: service,
      builder: (context, _) {
        final todayLog = service.todayLog;
        final habits = service.habits;

        return SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Greeting & Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Good ${_getGreeting()}, ${service.userName} 👋',
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        DateFormat('EEEE, MMMM d, yyyy').format(DateTime.now()),
                        style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                      ),
                    ],
                  ),
                  ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.accent.withOpacity(0.15),
                      foregroundColor: AppTheme.accent,
                      elevation: 0,
                      side: BorderSide(color: AppTheme.accent.withOpacity(0.3)),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    onPressed: () => SecondBrainCoachModal.show(context),
                    icon: const Text('🧠', style: TextStyle(fontSize: 16)),
                    label: const Text('Ask 2nd Brain', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Layout Grid (Main Card + Right Panel)
              if (isDesktop)
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(flex: 3, child: _buildTodayAtAGlanceCard(todayLog, habits, service)),
                    const SizedBox(width: 20),
                    Expanded(flex: 2, child: _buildRightWidgetPanel(service)),
                  ],
                )
              else
                Column(
                  children: [
                    _buildTodayAtAGlanceCard(todayLog, habits, service),
                    const SizedBox(height: 20),
                    _buildRightWidgetPanel(service),
                  ],
                ),
            ],
          ),
        );
      },
    );
  }

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }

  // --- Today at a Glance Card ---
  Widget _buildTodayAtAGlanceCard(DailyLog todayLog, List habits, MockService service) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppTheme.accent.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Center(child: Text('🌅', style: TextStyle(fontSize: 20))),
              ),
              const SizedBox(width: 12),
              const Text(
                'Today at a Glance',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Habit Checklist
          const Text('TODAY\'S HABITS', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: AppTheme.textMuted, letterSpacing: 1.2)),
          const SizedBox(height: 10),
          ...habits.map((habit) {
            final isDone = habit.isCompletedOn(service.todayKey);
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              decoration: BoxDecoration(
                color: AppTheme.base.withOpacity(0.5),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppTheme.border.withOpacity(0.4)),
              ),
              child: ListTile(
                dense: true,
                leading: Text(habit.icon, style: const TextStyle(fontSize: 20)),
                title: Text(
                  habit.name,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    decoration: isDone ? TextDecoration.lineThrough : null,
                    color: isDone ? AppTheme.textMuted : AppTheme.textPrimary,
                  ),
                ),
                trailing: Checkbox(
                  value: isDone,
                  activeColor: AppTheme.accent,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                  onChanged: (_) => service.toggleHabitToday(habit.id),
                ),
              ),
            );
          }),

          const Divider(height: 32, color: AppTheme.border),

          // Mood & Energy Selectors
          Row(
            children: [
              // Mood
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('MOOD', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: AppTheme.textMuted, letterSpacing: 1.2)),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        _buildMoodBtn('happy', '😊', todayLog, service),
                        const SizedBox(width: 8),
                        _buildMoodBtn('neutral', '😐', todayLog, service),
                        const SizedBox(width: 8),
                        _buildMoodBtn('sad', '😞', todayLog, service),
                      ],
                    ),
                  ],
                ),
              ),
              // Energy
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('ENERGY', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: AppTheme.textMuted, letterSpacing: 1.2)),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        _buildEnergyBtn('low', 'Low', todayLog, service),
                        const SizedBox(width: 6),
                        _buildEnergyBtn('medium', 'Med', todayLog, service),
                        const SizedBox(width: 6),
                        _buildEnergyBtn('high', 'High', todayLog, service),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),

          const Divider(height: 32, color: AppTheme.border),

          // Task & Note
          const Text('ONE TASK FOR TODAY', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: AppTheme.textMuted, letterSpacing: 1.2)),
          const SizedBox(height: 8),
          TextField(
            controller: _taskController,
            decoration: const InputDecoration(
              hintText: 'What is the single most important task today?',
            ),
          ),
          const SizedBox(height: 14),

          const Text('QUICK NOTE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: AppTheme.textMuted, letterSpacing: 1.2)),
          const SizedBox(height: 8),
          TextField(
            controller: _noteController,
            maxLines: 2,
            decoration: const InputDecoration(
              hintText: 'Any thoughts or reminders...',
            ),
          ),
          const SizedBox(height: 20),

          // Save Check-in Button
          SizedBox(
            width: double.infinity,
            height: 46,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.accent,
                foregroundColor: AppTheme.base,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              onPressed: () {
                service.updateDailyLog(
                  task: _taskController.text.trim(),
                  note: _noteController.text.trim(),
                );
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Daily Check-in Saved! ✓')),
                );
              },
              child: const Text('Save Check-in ✓', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMoodBtn(String moodKey, String emoji, DailyLog log, MockService service) {
    final isSelected = log.mood == moodKey;
    return InkWell(
      onTap: () => service.updateDailyLog(mood: moodKey),
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.accent.withOpacity(0.15) : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: isSelected ? AppTheme.accent : Colors.transparent),
        ),
        child: Text(emoji, style: TextStyle(fontSize: isSelected ? 24 : 20)),
      ),
    );
  }

  Widget _buildEnergyBtn(String key, String label, DailyLog log, MockService service) {
    final isSelected = log.energy == key;
    return Expanded(
      child: InkWell(
        onTap: () => service.updateDailyLog(energy: key),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? AppTheme.accent : AppTheme.base,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: isSelected ? AppTheme.accent : AppTheme.border),
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              color: isSelected ? AppTheme.base : AppTheme.textSecondary,
            ),
          ),
        ),
      ),
    );
  }

  // --- Right Widget Panel ---
  Widget _buildRightWidgetPanel(MockService service) {
    return Column(
      children: [
        // Music Player Widget
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: AppTheme.card,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: AppTheme.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: const [
                  Text('NOW PLAYING', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: AppTheme.textMuted, letterSpacing: 1.2)),
                  Text('🌧️', style: TextStyle(fontSize: 16)),
                ],
              ),
              const SizedBox(height: 12),
              Container(
                height: 100,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [AppTheme.accent.withOpacity(0.2), Colors.teal.shade900.withOpacity(0.4)],
                  ),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Center(child: Text('🌧️ Gentle Rain', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold))),
              ),
              const SizedBox(height: 12),
              const Text('Gentle Rain & Thunder', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              const Text('Nature Ambience', style: TextStyle(fontSize: 12, color: AppTheme.textMuted)),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  IconButton(onPressed: () {}, icon: const Icon(Icons.skip_previous, color: AppTheme.textMuted)),
                  FloatingActionButton.small(
                    elevation: 0,
                    backgroundColor: AppTheme.accent,
                    onPressed: () {},
                    child: const Icon(Icons.play_arrow, color: AppTheme.base),
                  ),
                  IconButton(onPressed: () {}, icon: const Icon(Icons.skip_next, color: AppTheme.textMuted)),
                ],
              ),
            ],
          ),
        ),

        const SizedBox(height: 20),

        // Grow Your Tree Widget
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: AppTheme.card,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: AppTheme.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: const [
                  Text('GROW YOUR TREE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: AppTheme.textMuted, letterSpacing: 1.2)),
                  Text('🌳', style: TextStyle(fontSize: 16)),
                ],
              ),
              const SizedBox(height: 12),
              Container(
                height: 120,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: AppTheme.base,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text('🌿', style: TextStyle(fontSize: 40)),
                    Container(width: 8, height: 24, color: Colors.amber.shade800),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.between,
                children: [
                  const Text('Tree Stage', style: TextStyle(fontSize: 12, color: AppTheme.textMuted)),
                  Text('Level ${service.treeLevel} Sapling', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.accent)),
                ],
              ),
              const SizedBox(height: 6),
              ClipRRect(
                borderRadius: BorderRadius.circular(6),
                child: LinearProgressIndicator(
                  value: service.treeExp / 100,
                  minHeight: 6,
                  backgroundColor: AppTheme.base,
                  valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.accent),
                ),
              ),
              const SizedBox(height: 14),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    side: BorderSide(color: AppTheme.accent.withOpacity(0.4)),
                    foregroundColor: AppTheme.accent,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: () => service.waterTree(),
                  child: const Text('💧 Water Your Tree', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
