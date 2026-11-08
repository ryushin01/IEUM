// 실제 기기·시뮬레이터에서 웹뷰, 브릿지, 보안 저장소를 확인합니다.
// 웹뷰 안 화면은 자바스크립트로 조작합니다. 시스템 사진 선택기는 다루지 못합니다.
//
// 데모: flutter test integration_test -d <기기> --dart-define-from-file=config/demo.json --dart-define=MODE=demo
import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import 'package:ieum/app/config.dart';
import 'package:ieum/main.dart';
import 'package:ieum/dm/chat_view.dart';
import 'package:ieum/dm/dm_list_view.dart';
import 'package:ieum/feed/post_card.dart';
import 'package:ieum/services/media_service.dart';
import 'package:ieum/shell/bottom_menu.dart';
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

/// Flutter 위젯이 나타날 때까지 기다립니다.
Future<void> waitFor(WidgetTester tester, Finder finder, String what, {int seconds = 30}) async {
  final end = DateTime.now().add(Duration(seconds: seconds));
  while (DateTime.now().isBefore(end)) {
    await tester.pump(const Duration(milliseconds: 200));
    if (finder.evaluate().isNotEmpty) return;
  }
  fail('$what 대기 시간 초과');
}

Future<void> tapMenu(WidgetTester tester, IconData icon) async {
  await tester.tap(find.descendant(of: find.byType(BottomMenu), matching: find.byIcon(icon)));
  await tester.pump(const Duration(milliseconds: 300));
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
    testWidgets('데모: 웹뷰 로그인, Flutter 피드, 화면 간 동기화, 메뉴, 테마', (tester) async {
      final page = await start(tester, config);
      await page.waitUntil('document.querySelector("button")', '첫 화면');
      await page.js('localStorage.clear(); "ok"');
      await page.reload();
      await page.waitUntil('document.body.innerText.includes("데모 계정으로 둘러보기")', '로그인 화면');
      expect(find.byType(BottomMenu), findsNothing);
      await shot(tester, 'login');

      await page.click('데모 계정으로 둘러보기');
      await waitFor(tester, find.byType(PostCard), 'Flutter 피드');
      expect(find.byType(BottomMenu), findsOneWidget);
      await pumpFor(tester, const Duration(seconds: 1));
      await shot(tester, 'feed');

      // 토큰은 웹 저장소가 아니라 Keychain·Keystore에 들어갑니다.
      final saved = await tokens.read();
      expect(saved?['accessToken'], 'demo.demo');
      expect(await page.js('String(localStorage.getItem("ieum.tokens"))'), 'null');

      // 사진 넘기기 (Flutter)
      await tester.tap(find.byTooltip('다음 사진').first);
      await pumpFor(tester, const Duration(milliseconds: 500));
      expect(find.text('2 / 2'), findsWidgets);

      // 좋아요 (Flutter → 목업 API). 시드에서 이미 누른 글입니다.
      final first = page.shell.feed.posts.first;
      expect(first.liked, isTrue);
      // 화면 높이에 따라 좋아요 줄이 스크롤해야 보이는 위치에 있습니다.
      final like = find.byIcon(Icons.thumb_up).first;
      await tester.ensureVisible(like);
      await tester.pump(const Duration(milliseconds: 300));
      await tester.tap(like);
      await pumpFor(tester, const Duration(seconds: 1));
      expect(page.shell.feed.posts.first.liked, isFalse);
      expect(page.shell.feed.posts.first.likeCount, first.likeCount - 1);

      // 댓글 (Flutter → 웹뷰 상세 화면에 반영)
      await tester.enterText(find.byType(TextField).first, 'Flutter에서 쓴 댓글');
      await tester.pump(const Duration(milliseconds: 200));
      final postButton = find.widgetWithText(TextButton, '게시').first;
      await tester.ensureVisible(postButton);
      await tester.pump(const Duration(milliseconds: 500));
      await shot(tester, 'feed-comment');
      await tester.tap(postButton);
      // 느린 기기에서는 응답이 늦을 수 있어 결과를 기다립니다.
      for (var i = 0; i < 100 && page.shell.feed.posts.first.commentCount == first.commentCount; i++) {
        await tester.pump(const Duration(milliseconds: 100));
      }
      expect(page.shell.feed.posts.first.commentCount, first.commentCount + 1);
      expect(find.textContaining('댓글 ${first.commentCount + 1}개').first, findsOneWidget);
      final allComments = find.text('댓글 보기').first;
      await tester.ensureVisible(allComments);
      await tester.pump(const Duration(milliseconds: 300));
      await tester.tap(allComments);
      await pumpFor(tester, const Duration(milliseconds: 500));
      expect(find.byType(PostCard), findsNothing);
      await page.waitUntil('document.body.innerText.includes("Flutter에서 쓴 댓글")', '웹뷰 상세의 댓글');
      await page.waitUntil('document.querySelector("article button[aria-pressed]").getAttribute("aria-pressed") === "false"', '웹뷰 상세의 좋아요 상태');
      await page.js('window.scrollTo(0, 500); "ok"');
      await shot(tester, 'post-detail');

      // 뒤로 가기(웹뷰 헤더)로 Flutter 피드에 돌아옵니다.
      await page.click('뒤로 가기');
      await waitFor(tester, find.byType(PostCard), '돌아온 피드');
      expect(page.shell.path.value, '/');

      // 새 글 (웹뷰)
      await tester.tap(find.text('글쓰기'));
      await tester.pump(const Duration(milliseconds: 300));
      await page.waitUntil('document.body.innerText.includes("앨범에서 선택")', '작성 화면');
      await page.fill('#post-caption', '오늘의 기록을 남겨 보세요.');
      expect(find.byType(PostCard), findsNothing);
      await shot(tester, 'post-write');

      // DM (Flutter). 안 읽은 메시지를 표시하고, 대화방에서는 메뉴를 숨깁니다.
      await tapMenu(tester, Icons.chat_bubble_outline);
      await waitFor(tester, find.byType(ConversationTile), '대화 목록');
      expect(page.shell.conversations.unread, 1);
      await shot(tester, 'dm-list');
      await tester.tap(find.widgetWithText(ConversationTile, '하늘빛'));
      await waitFor(tester, find.byType(ChatView), '대화방');
      await waitFor(tester, find.text('안녕하세요! 사진 잘 보고 있어요 :)'), '기존 메시지');
      await pumpFor(tester, const Duration(seconds: 1));
      expect(find.byType(BottomMenu), findsNothing);
      await tester.enterText(find.descendant(of: find.byType(ChatView), matching: find.byType(TextField)), '실제 앱에서 보냅니다');
      await tester.pump(const Duration(milliseconds: 300));
      await tester.tap(find.byTooltip('보내기'));
      await waitFor(tester, find.text('실제 앱에서 보냅니다'), '보낸 메시지');
      // 목업의 자동 답장이 이벤트로 도착하고 읽음이 표시됩니다.
      await waitFor(tester, find.textContaining('좋아요! 다음에'), '자동 답장', seconds: 10);
      await waitFor(tester, find.textContaining('읽음'), '읽음 표시', seconds: 5);
      FocusManager.instance.primaryFocus?.unfocus();
      await pumpFor(tester, const Duration(milliseconds: 800));
      await shot(tester, 'dm-room');

      // 프로필(웹뷰)로 갔다가 돌아옵니다. 읽었으므로 안 읽은 수가 사라집니다.
      await tester.tap(find.bySemanticsLabel(RegExp('프로필 보기')));
      await page.waitUntil('document.body.innerText.includes("메시지 보내기")', '프로필');
      await waitFor(tester, find.byType(BottomMenu), '프로필의 메뉴');
      await shot(tester, 'profile');
      await pumpFor(tester, const Duration(seconds: 1));
      expect(page.shell.conversations.unread, 0);

      // 웹뷰 프로필의 메시지 보내기로 Flutter 대화방을 엽니다.
      await page.click('메시지 보내기');
      await waitFor(tester, find.byType(ChatView), '프로필에서 연 대화방');
      await tester.tap(find.byTooltip('뒤로 가기'));
      await waitFor(tester, find.byType(BottomMenu), '돌아온 프로필');
      expect(find.byType(ChatView), findsNothing);

      // 다크 모드 (Flutter 스위치 → 웹 → 앱 전체)
      await tapMenu(tester, Icons.home_outlined);
      await waitFor(tester, find.byType(PostCard), '홈');
      expect(page.shell.brightness.value, Brightness.dark);
      await shot(tester, 'feed-dark');
      await tester.tap(find.byType(Switch));
      await page.waitUntil('document.documentElement.dataset.theme === "light"', '웹 라이트 모드');
      await pumpFor(tester, const Duration(seconds: 1));
      expect(page.shell.brightness.value, Brightness.light);
      await shot(tester, 'feed-light');
      await tester.tap(find.byType(Switch));
      await pumpFor(tester, const Duration(seconds: 1));

      // 앱 → 웹 브릿지: 버전 정보, 로그아웃하면 Flutter 화면도 사라집니다.
      page.shell.selectTab(MenuTab.me);
      await page.click('설정');
      await page.waitUntil('document.body.innerText.includes("버전 ")', '앱 버전');
      debugPrint('INFO:${await page.js('document.body.innerText.match(/버전 [^\\n]+/)[0]')}');
      await page.click('로그아웃');
      await page.waitUntil('document.body.innerText.includes("데모 계정으로 둘러보기")', '로그아웃');
      await pumpFor(tester, const Duration(seconds: 1));
      expect(await tokens.read(), isNull);
      expect(find.byType(BottomMenu), findsNothing);
      expect(find.byType(PostCard), findsNothing);

      await page.click('운영자로 둘러보기');
      await waitFor(tester, find.byType(PostCard), '운영자 피드');
      page.shell.selectTab(MenuTab.me);
      await page.click('설정');
      await page.click('신고 처리');
      await page.waitUntil('document.body.innerText.includes("24시간 초과")', '신고 목록');
      await shot(tester, 'admin-reports');
      debugPrint('INFO:platform=${Platform.operatingSystem}');
    });

    testWidgets('재실행하면 로그인을 유지하고 바로 피드를 보여 준다', (tester) async {
      await tokens.write({'accessToken': 'demo.demo', 'refreshToken': 'demo.demo'});
      await start(tester, config);
      await waitFor(tester, find.byType(PostCard), '재실행 후 피드');
      expect(find.byType(BottomMenu), findsOneWidget);
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
      await waitFor(tester, find.text('연결할 수 없습니다'), '오프라인 화면');
      await shot(tester, 'offline');
    });
  }

  if (mode == 'real') {
    testWidgets('실제 API: Flutter 피드, Dio 재발급, 업로드, 소켓', (tester) async {
      final page = await start(tester, config);
      await page.waitUntil('document.querySelector("input[type=email]")', '로그인 화면');
      await page.fill('input[type=email]', 'demo@ieum.app');
      await page.fill('input[type=password]', 'ieum-demo-1234');
      await page.click('로그인');
      await waitFor(tester, find.byType(PostCard), '실제 API 피드');
      final saved = await tokens.read();
      expect(saved?['refreshToken'], isNotEmpty);

      // Dio 재발급: 만료된 토큰이어도 한 번 재발급하고 이어 갑니다.
      await tokens.write({'accessToken': 'expired', 'refreshToken': saved!['refreshToken']});
      await tester.runAsync(() => page.shell.feed.reload());
      expect(page.shell.feed.error.value, isNull);
      final refreshed = await tokens.read();
      expect(refreshed!['accessToken'], isNot('expired'));
      expect(refreshed['refreshToken'], isNot(saved['refreshToken']));

      // 좋아요와 댓글을 실제 API에 반영합니다.
      final first = page.shell.feed.posts.first;
      await tester.runAsync(() => page.shell.feed.toggleLike(first));
      expect(page.shell.feed.posts.first.liked, !first.liked);

      // Dio 업로드: 서버가 다시 인코딩해 WebP로 저장합니다.
      final png = File('${Directory.systemTemp.path}/ieum-test.png');
      await png.writeAsBytes(base64Decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='));
      final media = NativeMediaService();
      final id = media.addPickedForTest(XFile(png.path));
      final urls = await tester.runAsync(() => media.upload(
        fileIds: [id],
        accessToken: refreshed['accessToken'] as String,
        uploadUrl: config.apiUrl.resolve('/uploads'),
      ));
      expect(urls!.single, endsWith('.webp'));
      debugPrint('INFO:uploaded ${urls.single}');

      // DM: 앱의 소켓으로 다른 사용자의 메시지를 바로 받습니다.
      await tapMenu(tester, Icons.chat_bubble_outline);
      await waitFor(tester, find.byType(ConversationTile), '대화 목록');
      await tester.tap(find.widgetWithText(ConversationTile, '하늘빛'));
      await waitFor(tester, find.byType(ChatView), '대화방');
      await waitFor(tester, find.textContaining('사진 잘 보고'), '기존 메시지');
      debugPrint('READY_FOR_SOCKET');
      await waitFor(tester, find.text('실시간 소켓 도착 확인'), '소켓 메시지', seconds: 40);
      await tester.enterText(find.descendant(of: find.byType(ChatView), matching: find.byType(TextField)), '소켓으로 받았습니다');
      await tester.pump(const Duration(milliseconds: 300));
      await tester.tap(find.byTooltip('보내기'));
      await waitFor(tester, find.text('소켓으로 받았습니다'), '보낸 메시지');
      await shot(tester, 'real-socket');
      debugPrint('INFO:chat-messages=${page.shell.conversations.conversations.length}');

      // 웹뷰는 앱이 재발급한 사실을 모르지만, 오래된 토큰으로도 계속 동작합니다.
      // 로그아웃하면 최신 재발급 토큰까지 폐기합니다.
      final latest = await tokens.read();
      page.shell.openPath('/settings');
      await page.click('로그아웃');
      await page.waitUntil('document.querySelector("input[type=email]")', '로그아웃');
      debugPrint('LATEST_REFRESH:${latest!['refreshToken']}');
      await pumpFor(tester, const Duration(seconds: 2));
    });
  }
}
