import 'package:flutter_test/flutter_test.dart';
import 'package:ieum/app/config.dart';
import 'package:ieum/shell/navigation_policy.dart';

void main() {
  final web = Uri.parse('https://app.example.com');

  test('우리 웹만 웹뷰에서 연다', () {
    expect(decideNavigation(Uri.parse('https://app.example.com/posts/1'), web), NavigationAction.allowInWebView);
    expect(decideNavigation(Uri.parse('https://app.example.com.evil.io/'), web), NavigationAction.openExternally);
  });

  test('메일과 외부 https는 시스템 앱으로 넘긴다', () {
    expect(decideNavigation(Uri.parse('mailto:help@example.com'), web), NavigationAction.openExternally);
    expect(decideNavigation(Uri.parse('https://example.org'), web), NavigationAction.openExternally);
  });

  test('그 밖의 스킴은 막는다', () {
    expect(decideNavigation(Uri.parse('intent://x#Intent;end'), web), NavigationAction.block);
    expect(decideNavigation(Uri.parse('javascript:alert(1)'), web), NavigationAction.block);
    expect(decideNavigation(Uri.parse('http://other.example.com'), web), NavigationAction.block);
  });

  test('다른 페이지에서는 브릿지를 신뢰하지 않는다', () {
    expect(isTrustedPage('https://app.example.com/feed', web), isTrue);
    expect(isTrustedPage('https://evil.example.com', web), isFalse);
    expect(isTrustedPage('about:blank', web), isFalse);
    expect(isTrustedPage(null, web), isFalse);
  });

  test('운영 빌드는 https가 아니면 시작하지 않는다', () {
    final dev = AppConfig(webUrl: Uri.parse('http://localhost:5173'), apiUrl: Uri.parse('http://localhost:4000'));
    expect(() => dev.assertSafeFor(release: true), throwsStateError);
    expect(() => dev.assertSafeFor(release: false), returnsNormally);
  });
}
