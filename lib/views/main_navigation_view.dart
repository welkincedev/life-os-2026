import 'package:flutter/material.dart';
import '../services/mock_service.dart';
import '../services/life_score_service.dart';
import '../theme/app_theme.dart';
import '../widgets/second_brain_coach_modal.dart';
import '../widgets/quick_capture_dialog.dart';
import 'dashboard_view.dart';
import 'habits_view.dart';
import 'journal_view.dart';
import 'money_view.dart';
import 'calm_view.dart';
import 'insights_view.dart';

class MainNavigationView extends StatefulWidget {
  const MainNavigationView({Key? key}) : super(key: key);

  @override
  State<MainNavigationView> createState() => _MainNavigationViewState();
}

class _MainNavigationViewState extends State<MainNavigationView> {
  int _currentIndex = 0;

  final List<Widget> _pages = const [
    DashboardView(),
    HabitsView(),
    JournalView(),
    MoneyView(),
    CalmView(),
    InsightsView(),
  ];

  final List<Map<String, String>> _navItems = const [
    {'icon': '📊', 'label': 'Dashboard'},
    {'icon': '✅', 'label': 'Habits'},
    {'icon': '📝', 'label': 'Journal'},
    {'icon': '💰', 'label': 'Money'},
    {'icon': '🎵', 'label': 'Calm Zone'},
    {'icon': '📈', 'label': 'Insights'},
  ];

  @override
  Widget build(BuildContext context) {
    final service = MockService();
    final isDesktop = MediaQuery.of(context).size.width > 800;

    return AnimatedBuilder(
      animation: service,
      builder: (context, _) {
        final scoreData = LifeScoreService.calculate(service);

        return Scaffold(
          appBar: AppBar(
            backgroundColor: AppTheme.card.withOpacity(0.8),
            elevation: 0,
            title: Row(
              children: [
                const Text('🧬', style: TextStyle(fontSize: 22)),
                const SizedBox(width: 8),
                const Text(
                  'LifeOS',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  '/ ${_navItems[_currentIndex]['label']}',
                  style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                ),
              ],
            ),
            actions: [
              // Quick Capture Action Button
              TextButton.icon(
                style: TextButton.styleFrom(
                  backgroundColor: AppTheme.accent.withOpacity(0.12),
                  foregroundColor: AppTheme.accent,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                onPressed: () => QuickCaptureDialog.show(context),
                icon: const Text('⚡', style: TextStyle(fontSize: 14)),
                label: const Text('Capture', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
              ),
              const SizedBox(width: 12),

              // User Avatar & Menu
              Padding(
                padding: const EdgeInsets.only(right: 16),
                child: CircleAvatar(
                  radius: 16,
                  backgroundColor: AppTheme.accent,
                  child: Text(
                    service.userName.isNotEmpty ? service.userName[0].toUpperCase() : 'A',
                    style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.base, fontSize: 13),
                  ),
                ),
              ),
            ],
          ),
          body: Row(
            children: [
              // Left Sidebar for Desktop / Web
              if (isDesktop) _buildSidebar(scoreData),

              // Main Active View
              Expanded(
                child: _pages[_currentIndex],
              ),
            ],
          ),

          // Floating 2nd Brain Coach Trigger Button
          floatingActionButton: FloatingActionButton.extended(
            backgroundColor: AppTheme.accent,
            foregroundColor: AppTheme.base,
            elevation: 8,
            onPressed: () => SecondBrainCoachModal.show(context),
            icon: const Text('🧠', style: TextStyle(fontSize: 18)),
            label: const Text('2nd Brain', style: TextStyle(fontWeight: FontWeight.bold)),
          ),

          // Bottom Navigation for Mobile
          bottomNavigationBar: isDesktop
              ? null
              : BottomNavigationBar(
                  currentIndex: _currentIndex,
                  onTap: (index) => setState(() => _currentIndex = index),
                  backgroundColor: AppTheme.card,
                  selectedItemColor: AppTheme.accent,
                  unselectedItemColor: AppTheme.textMuted,
                  type: BottomNavigationBarType.fixed,
                  selectedFontSize: 11,
                  unselectedFontSize: 11,
                  items: _navItems.map((item) {
                    return BottomNavigationBarItem(
                      icon: Text(item['icon']!, style: const TextStyle(fontSize: 18)),
                      label: item['label'],
                    );
                  }).toList(),
                ),
        );
      },
    );
  }

  Widget _buildSidebar(LifeScoreData scoreData) {
    return Container(
      width: 240,
      decoration: const BoxDecoration(
        color: AppTheme.card,
        border: Border(right: BorderSide(color: AppTheme.border, width: 1)),
      ),
      child: Column(
        children: [
          const SizedBox(height: 12),
          // Nav Links
          Expanded(
            child: ListView.builder(
              itemCount: _navItems.length,
              itemBuilder: (context, index) {
                final item = _navItems[index];
                final isSelected = _currentIndex == index;
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
                  child: ListTile(
                    dense: true,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    tileColor: isSelected ? AppTheme.accent.withOpacity(0.12) : Colors.transparent,
                    leading: Text(item['icon']!, style: const TextStyle(fontSize: 18)),
                    title: Text(
                      item['label']!,
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                        color: isSelected ? AppTheme.accent : AppTheme.textSecondary,
                      ),
                    ),
                    onTap: () => setState(() => _currentIndex = index),
                  ),
                );
              },
            ),
          ),

          // Life Score Widget at Sidebar Bottom
          Container(
            margin: const EdgeInsets.all(12),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppTheme.base,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.accent.withOpacity(0.2)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('LIFE SCORE', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: AppTheme.textMuted)),
                    Text(
                      scoreData.statusLabel,
                      style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: scoreData.statusColor),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Text(
                      '${scoreData.score}',
                      style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: AppTheme.textPrimary),
                    ),
                    const Text(' / 100', style: TextStyle(fontSize: 10, color: AppTheme.textMuted)),
                  ],
                ),
                const SizedBox(height: 6),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: scoreData.score / 100,
                    minHeight: 4,
                    backgroundColor: AppTheme.card,
                    valueColor: AlwaysStoppedAnimation<Color>(scoreData.statusColor),
                  ),
                ),
                const SizedBox(height: 10),
                SizedBox(
                  width: double.infinity,
                  height: 32,
                  child: OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppTheme.accent,
                      side: BorderSide(color: AppTheme.accent.withOpacity(0.3)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      padding: EdgeInsets.zero,
                    ),
                    onPressed: () => SecondBrainCoachModal.show(context),
                    child: const Text('🧠 Ask 2nd Brain', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
