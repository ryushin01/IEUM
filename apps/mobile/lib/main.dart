import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';

import 'app/config.dart';
import 'app/theme.dart';
import 'shell/shell_controller.dart';
import 'shell/shell_page.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // 앱 아이콘·스플래시의 무한대(Fluent Emoji, MIT) 고지를 앱의 라이선스 목록에 넣습니다.
  LicenseRegistry.addLicense(() async* {
    yield LicenseEntryWithLineBreaks(
      ['Fluent Emoji (app icon and splash)'],
      await rootBundle.loadString('assets/licenses/fluentui-emoji.txt'),
    );
  });
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
