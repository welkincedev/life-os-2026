import 'package:flutter/material.dart';
import '../services/mock_service.dart';
import '../services/life_score_service.dart';
import '../theme/app_theme.dart';

class InsightsView extends StatelessWidget {
  const InsightsView({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final service = MockService();

    return AnimatedBuilder(
      animation: service,
      builder: (context, _) {
        final scoreData = LifeScoreService.calculate(service);

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
                    'Life Insights & Analytics',
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                  ),
                  SizedBox(height: 2),
                  Text('Data-driven feedback on your lifestyle balance.', style: TextStyle(fontSize: 12, color: AppTheme.textMuted)),
                ],
              ),
              const SizedBox(height: 20),

              // Overall Score Hero
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [AppTheme.accent.withOpacity(0.15), AppTheme.card],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: AppTheme.accent.withOpacity(0.3)),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 70,
                      height: 70,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: scoreData.statusColor, width: 4),
                      ),
                      child: Center(
                        child: Text(
                          '${scoreData.score}',
                          style: TextStyle(fontSize: 22, fontWeight: FontWeight.black, color: scoreData.statusColor),
                        ),
                      ),
                    ),
                    const SizedBox(width: 20),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('LIFE SCORE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.textMuted, letterSpacing: 1.2)),
                          const SizedBox(height: 2),
                          Text(scoreData.statusLabel, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 4),
                          const Text('Calculated from habits, wellness, money, and mind reflections.', style: TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Category Breakdown Cards
              const Text('LIFESTYLE BALANCE METRICS', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.textMuted, letterSpacing: 1.2)),
              const SizedBox(height: 10),

              _buildMetricTile('Habit Consistency', scoreData.habitPct, '💪', AppTheme.accent),
              _buildMetricTile('Wellness & Energy', scoreData.wellnessPct, '🔋', Colors.blue),
              _buildMetricTile('Financial Discipline', scoreData.financePct, '💰', Colors.emeraldAccent),
              _buildMetricTile('Mindful Reflection', scoreData.reflectionPct, '📝', Colors.purpleAccent),
            ],
          ),
        );
      },
    );
  }

  Widget _buildMetricTile(String title, int pct, String icon, Color color) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(icon, style: const TextStyle(fontSize: 20)),
              const SizedBox(width: 10),
              Expanded(
                child: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              ),
              Text('$pct%', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: color)),
            ],
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: pct / 100,
              minHeight: 6,
              backgroundColor: AppTheme.base,
              valueColor: AlwaysStoppedAnimation<Color>(color),
            ),
          ),
        ],
      ),
    );
  }
}
