import 'package:flutter/foundation.dart';

/// `--dart-define-from-file=config/production.json`으로 주입합니다.
/// 값이 없으면 개발용 주소를 씁니다. Android 에뮬레이터는 `adb reverse`로 연결합니다.
class AppConfig {
  const AppConfig({required this.webUrl, required this.apiUrl});

  factory AppConfig.fromEnvironment() {
    const web = String.fromEnvironment('WEB_URL', defaultValue: 'http://localhost:5173');
    const api = String.fromEnvironment('API_URL', defaultValue: 'http://localhost:4000');
    final config = AppConfig(webUrl: Uri.parse(web), apiUrl: Uri.parse(api));
    config.assertSafeFor(release: kReleaseMode);
    return config;
  }

  final Uri webUrl;
  final Uri apiUrl;

  /// 운영 빌드가 개발 주소나 암호화되지 않은 주소를 바라보지 않게 막습니다.
  void assertSafeFor({required bool release}) {
    if (!release) return;
    if (webUrl.scheme != 'https' || apiUrl.scheme != 'https') {
      throw StateError('운영 빌드에는 https인 WEB_URL과 API_URL이 필요합니다.');
    }
  }

  static const appVersion = String.fromEnvironment('FLUTTER_BUILD_NAME', defaultValue: '1.0.0');
  static const appBuild = String.fromEnvironment('FLUTTER_BUILD_NUMBER', defaultValue: '1');
}
