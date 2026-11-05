import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';

import 'app/config.dart';
import 'app/theme.dart';
import 'shell/shell_controller.dart';
import 'shell/shell_page.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  final config = AppConfig.fromEnvironment();
  runApp(IeumApp(config: config));
}

class IeumApp extends StatelessWidget {
  const IeumApp({super.key, required this.config});

  final AppConfig config;

  @override
  Widget build(BuildContext context) {
    return GetMaterialApp(
      title: '이음',
      debugShowCheckedModeBanner: false,
      theme: ieumTheme(Brightness.light),
      darkTheme: ieumTheme(Brightness.dark),
      initialBinding: BindingsBuilder(() {
        Get.put(ShellController(config: config));
      }),
      home: const ShellPage(),
    );
  }
}
