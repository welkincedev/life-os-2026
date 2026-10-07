import 'package:flutter/material.dart';
import 'theme/app_theme.dart';
import 'views/login_view.dart';
import 'views/main_navigation_view.dart';
import 'services/mock_service.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const LifeOSApp());
}

class LifeOSApp extends StatelessWidget {
  const LifeOSApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'LifeOS 2.0',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      home: MockService().isLoggedIn
          ? const MainNavigationView()
          : const LoginView(),
    );
  }
}
