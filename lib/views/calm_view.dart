import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class CalmView extends StatefulWidget {
  const CalmView({Key? key}) : super(key: key);

  @override
  State<CalmView> createState() => _CalmViewState();
}

class _CalmViewState extends State<CalmView> {
  bool _isRainPlaying = false;
  bool _isForestPlaying = false;
  bool _isOceanPlaying = false;

  int _focusTimerSeconds = 25 * 60;
  bool _isTimerRunning = false;

  void _toggleTimer() {
    setState(() => _isTimerRunning = !_isTimerRunning);
  }

  void _resetTimer() {
    setState(() {
      _isTimerRunning = false;
      _focusTimerSeconds = 25 * 60;
    });
  }

  @override
  Widget build(BuildContext context) {
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
                'Calm Zone',
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              ),
              SizedBox(height: 2),
              Text('Unwind your nervous system & enter deep focus.', style: TextStyle(fontSize: 12, color: AppTheme.textMuted)),
            ],
          ),
          const SizedBox(height: 20),

          // Focus Timer Card
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppTheme.card,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppTheme.border),
            ),
            child: Row(
              children: [
                Container(
                  width: 90,
                  height: 90,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: AppTheme.accent, width: 3),
                  ),
                  child: Center(
                    child: Text(
                      '${(_focusTimerSeconds ~/ 60).toString().padLeft(2, '0')}:${(_focusTimerSeconds % 60).toString().padLeft(2, '0')}',
                      style: const TextStyle(fontSize: 20, fontWeight: FontWeight.black, color: AppTheme.accent),
                    ),
                  ),
                ),
                const SizedBox(width: 20),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('DEEP FOCUS TIMER', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.textMuted, letterSpacing: 1.2)),
                      const SizedBox(height: 4),
                      const Text('25 Min Focus Protocol', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.accent,
                              foregroundColor: AppTheme.base,
                            ),
                            onPressed: _toggleTimer,
                            child: Text(_isTimerRunning ? 'Pause' : 'Start Focus'),
                          ),
                          const SizedBox(width: 10),
                          OutlinedButton(
                            style: OutlinedButton.styleFrom(foregroundColor: AppTheme.textMuted),
                            onPressed: _resetTimer,
                            child: const Text('Reset'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Ambient Sound Cards
          const Text('AMBIENT SOUNDSCAPES', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.textMuted, letterSpacing: 1.2)),
          const SizedBox(height: 10),

          Row(
            children: [
              _buildSoundCard('🌧️', 'Gentle Rain', _isRainPlaying, () => setState(() => _isRainPlaying = !_isRainPlaying)),
              const SizedBox(width: 12),
              _buildSoundCard('🌲', 'Forest Birds', _isForestPlaying, () => setState(() => _isForestPlaying = !_isForestPlaying)),
              const SizedBox(width: 12),
              _buildSoundCard('🌊', 'Ocean Waves', _isOceanPlaying, () => setState(() => _isOceanPlaying = !_isOceanPlaying)),
            ],
          ),
          const SizedBox(height: 24),

          // Breathing Exercise Box
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppTheme.accent.withOpacity(0.08),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppTheme.accent.withOpacity(0.2)),
            ),
            child: Row(
              children: [
                const Text('🧘', style: TextStyle(fontSize: 32)),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Text('4-7-8 Breathing Reset', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                      SizedBox(height: 2),
                      Text('Inhale for 4s • Hold for 7s • Exhale for 8s to calm anxiety instantly.', style: TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSoundCard(String emoji, String title, bool isPlaying, VoidCallback onTap) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppTheme.card,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: isPlaying ? AppTheme.accent : AppTheme.border),
          ),
          child: Column(
            children: [
              Text(emoji, style: const TextStyle(fontSize: 32)),
              const SizedBox(height: 8),
              Text(title, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Text(
                isPlaying ? 'Playing 🎵' : 'Tap to play',
                style: TextStyle(fontSize: 10, color: isPlaying ? AppTheme.accent : AppTheme.textMuted),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
