import 'package:flutter_test/flutter_test.dart';
import 'package:life_os/main.dart';

void main() {
  testWidgets('LifeOS app smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const LifeOSApp());
    expect(find.byType(LifeOSApp), findsOneWidget);
  });
}
