// 실제 기기·시뮬레이터에서 웹뷰, 브릿지, 보안 저장소를 확인합니다.
// 웹뷰 안 화면은 자바스크립트로 조작합니다. 시스템 사진 선택기는 다루지 못합니다.
//
// 데모: flutter test integration_test -d <기기> --dart-define-from-file=config/demo.json --dart-define=MODE=demo
import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import 'package:ieum/app/config.dart';
import 'package:ieum/main.dart';
import 'package:ieum/services/media_service.dart';
import 'package:ieum/services/token_store.dart';
import 'package:ieum/shell/shell_controller.dart';
import 'package:integration_test/integration_test.dart';

const mode = String.fromEnvironment('MODE', defaultValue: 'demo');

/// 바깥의 실행 스크립트가 이 표시를 보고 화면을 촬영합니다.
Future<void> shot(WidgetTester tester, String name) async {
  debugPrint('SHOT:$name');
  await pumpFor(tester, const Duration(seconds: 3));
}

Future<void> pumpFor(WidgetTester tester, Duration duration) async {
  final end = DateTime.now().add(duration);
  while (DateTime.now().isBefore(end)) {
    await tester.pump(const Duration(milliseconds: 100));
  }
}

class Page {
  Page(this.tester) : shell = Get.find<ShellController>();

  final WidgetTester tester;
  final ShellController shell;

  Future<String> js(String script) async {
    final result = await shell.webView.runJavaScriptReturningResult(script);
    return result.toString().replaceAll('"', '');
  }

  Future<void> waitUntil(String condition, String what, {int seconds = 30}) async {
    final end = DateTime.now().add(Duration(seconds: seconds));
    while (DateTime.now().isBefore(end)) {
      await tester.pump(const Duration(milliseconds: 200));
      final value = await js('(() => { try { return String(!!($condition)); } catch (e) { return "false"; } })()').catchError((_) => 'false');
      if (value == 'true') return;
    }
    final text = await js('document.body.innerText.slice(0, 300)').catchError((Object e) => '$e');
    fail('$what 대기 시간 초과. 화면: $text');
  }

  Future<void> click(String text) async {
    await waitUntil('[...document.querySelectorAll("button,a,[role=switch]")].some(e => e.textContent.trim().includes("$text") || e.getAttribute("aria-label") === "$text")', '"$text" 표시');
    await js('[...document.querySelectorAll("button,a,[role=switch]")].find(e => e.textContent.trim().includes("$text") || e.getAttribute("aria-label") === "$text").click(); "ok"');
  }

  Future<void> fill(String selector, String value) async {
    await waitUntil('document.querySelector(\'$selector\')', '$selector 표시');
    await js('''(() => {
      const el = document.querySelector('$selector');
      const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement : HTMLInputElement;
      Object.getOwnPropertyDescriptor(proto.prototype, 'value').set.call(el, ${_quote(value)});
      el.dispatchEvent(new Event('input', { bubbles: true }));
      return 'ok';
    })()''');
  }

  String _quote(String value) => "'${value.replaceAll("'", "\\'")}'";

  Future<void> reload() async {
    await shell.webView.reload();
    await pumpFor(tester, const Duration(seconds: 2));
  }
}

Future<Page> start(WidgetTester tester, AppConfig config) async {
  Get.reset();
  await tester.pumpWidget(IeumApp(config: config));
  await pumpFor(tester, const Duration(seconds: 1));
  return Page(tester);
}

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  final config = AppConfig.fromEnvironment();
  final tokens = SecureTokenStore();

  setUp(() async {
    await tokens.clear();
  });

  if (mode == 'demo') {
    testWidgets('데모: 로그인, 보안 저장소, 재실행, DM, 테마, 버전 표시', (tester) async {
      final page = await start(tester, config);
      await page.waitUntil('document.querySelector("button")', '첫 화면');
      await page.js('localStorage.clear(); "ok"');
      await page.reload();
      await page.waitUntil('document.body.innerText.includes("데모 계정으로 둘러보기")', '로그인 화면');
      await shot(tester, 'login');

      await page.click('데모 계정으로 둘러보기');
      await page.waitUntil('document.querySelectorAll("article").length > 0', '피드');
      await shot(tester, 'feed');

      // 토큰이 웹 저장소가 아니라 Keychain·Keystore에 들어갑니다.
      final saved = await tokens.read();
      expect(saved?['accessToken'], 'demo.demo');
      expect(await page.js('String(localStorage.getItem("ieum.tokens"))'), 'null');

      await page.reload();
      await page.waitUntil('document.querySelectorAll("article").length > 0', '새로고침 후 피드');

      await page.click('댓글 2개 모두 보기');
      await page.waitUntil('document.body.innerText.includes("색이 정말 곱네요")', '댓글');
      await page.js('window.scrollTo(0, 500); "ok"');
      await shot(tester, 'post-detail');

      await page.click('새 게시글');
      await page.waitUntil('document.body.innerText.includes("앨범에서 선택")', '작성 화면');
      await page.waitUntil('document.body.innerText.includes("촬영")', '앱 전용 촬영 버튼');
      await page.fill('#post-caption', '오늘의 기록을 남겨 보세요.');
      await shot(tester, 'post-write');

      await page.click('메시지');
      await page.waitUntil('[...document.querySelectorAll("a")].some(a => a.textContent.includes("하늘빛") && a.getAttribute("href").includes("/dm/"))', '대화 목록');
      await page.js('[...document.querySelectorAll("a")].find(a => a.textContent.includes("하늘빛")).click(); "ok"');
      await page.fill('#message-body', '실제 앱에서 보냅니다');
      await page.click('보내기');
      await page.waitUntil('document.querySelector("[role=log]").innerText.includes("좋아요")', '자동 답장');
      await shot(tester, 'dm-room');

      await page.js('[...document.querySelectorAll("a")].find(a => a.getAttribute("href").includes("/users/")).click(); "ok"');
      await page.waitUntil('document.body.innerText.includes("메시지 보내기")', '프로필');
      await shot(tester, 'profile');

      // 웹 → 앱 브릿지: 테마가 앱의 상태 표시줄과 배경에 전달됩니다.
      expect(page.shell.brightness.value, isNot(Brightness.dark));
      await page.js('document.querySelector("[role=switch]").click(); "ok"');
      await page.waitUntil('document.documentElement.dataset.theme === "dark"', '다크 모드');
      await pumpFor(tester, const Duration(seconds: 1));
      expect(page.shell.brightness.value, Brightness.dark);
      await page.click('홈');
      await page.waitUntil('document.querySelectorAll("article").length > 0', '다크 피드');
      await shot(tester, 'feed-dark');
      await page.js('document.querySelector("[role=switch]").click(); "ok"');

      // 앱 → 웹 브릿지: 버전 정보
      await page.click('내 정보');
      await page.click('설정');
      await page.waitUntil('document.body.innerText.includes("버전 ")', '앱 버전');
      debugPrint('INFO:${await page.js('document.body.innerText.match(/버전 [^\\n]+/)[0]')}');

      await page.click('로그아웃');
      await page.waitUntil('document.body.innerText.includes("데모 계정으로 둘러보기")', '로그아웃');
      expect(await tokens.read(), isNull);
      await page.click('운영자로 둘러보기');
      await page.waitUntil('document.querySelectorAll("article").length > 0', '운영자 피드');
      await page.click('내 정보');
      await page.click('설정');
      await page.click('신고 처리');
      await page.waitUntil('document.body.innerText.includes("24시간 초과")', '신고 목록');
      await shot(tester, 'admin-reports');
      debugPrint('INFO:platform=${Platform.operatingSystem}');
    });

    testWidgets('허용하지 않은 주소로는 이동하지 않는다', (tester) async {
      final page = await start(tester, config);
      await page.waitUntil('document.querySelector("button")', '첫 화면');
      final before = await page.shell.webView.currentUrl();
      await page.js('window.location.href = "intent://blocked"; "ok"').catchError((_) => '');
      await pumpFor(tester, const Duration(seconds: 2));
      expect(await page.shell.webView.currentUrl(), before);
    });

    testWidgets('연결할 수 없으면 오프라인 화면을 보여 준다', (tester) async {
      await start(tester, AppConfig(webUrl: Uri.parse('https://ieum-does-not-exist.invalid/'), apiUrl: config.apiUrl));
      final end = DateTime.now().add(const Duration(seconds: 30));
      while (DateTime.now().isBefore(end) && find.text('연결할 수 없습니다').evaluate().isEmpty) {
        await tester.pump(const Duration(milliseconds: 200));
      }
      expect(find.text('연결할 수 없습니다'), findsOneWidget);
      await shot(tester, 'offline');
    });
  }

  if (mode == 'real') {
    testWidgets('실제 API: 로그인, 재발급 토큰 저장, 소켓 수신', (tester) async {
      final page = await start(tester, config);
      await page.waitUntil('document.querySelector("input[type=email]")', '로그인 화면');
      await page.fill('input[type=email]', 'demo@ieum.app');
      await page.fill('input[type=password]', 'ieum-demo-1234');
      await page.click('로그인');
      await page.waitUntil('document.querySelectorAll("article").length > 0', '피드');
      final saved = await tokens.read();
      expect(saved?['refreshToken'], isNotEmpty);

      // Dio 업로드: 서버가 다시 인코딩해 WebP로 저장합니다.
      final png = File('${Directory.systemTemp.path}/ieum-test.png');
      await png.writeAsBytes(base64Decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='));
      final media = NativeMediaService();
      final id = media.addPickedForTest(XFile(png.path));
      final urls = await tester.runAsync(() => media.upload(
        fileIds: [id],
        accessToken: saved!['accessToken'] as String,
        uploadUrl: config.apiUrl.resolve('/uploads'),
      ));
      expect(urls!.single, endsWith('.webp'));
      debugPrint('INFO:uploaded ${urls.single}');

      await page.click('메시지');
      await page.waitUntil('[...document.querySelectorAll("a")].some(a => a.textContent.includes("하늘빛"))', '대화 목록');
      await page.js('[...document.querySelectorAll("a")].find(a => a.textContent.includes("하늘빛")).click(); "ok"');
      await page.waitUntil('document.querySelector("[role=log]")', '대화방');
      debugPrint('READY_FOR_SOCKET');
      await page.waitUntil('document.querySelector("[role=log]").innerText.includes("실시간 소켓 도착 확인")', '소켓 메시지', seconds: 40);
      await shot(tester, 'real-socket');
    });
  }
}
