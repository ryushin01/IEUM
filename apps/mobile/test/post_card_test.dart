import 'dart:ui' show SemanticsAction;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ieum/app/theme.dart';
import 'package:ieum/data/models.dart';
import 'package:ieum/feed/post_card.dart';
import 'package:ieum/feed/post_image_view.dart';
import 'package:ieum/shell/app_header.dart';
import 'package:ieum/shell/bottom_menu.dart';

Post makePost({List<PostImage> images = const [], bool official = true, bool hot = true, String caption = '퇴근길 하늘'}) => Post(
  id: 'p1',
  author: PostAuthor(id: 'u1', nickname: '하늘빛', isOfficial: official),
  caption: caption,
  images: images,
  likeCount: 3,
  commentCount: 2,
  liked: false,
  isHot: hot,
  edited: true,
  createdAt: DateTime.now().subtract(const Duration(minutes: 5)),
);

Future<void> pumpCard(WidgetTester tester, Post post, {Future<String?> Function(String)? onComment, VoidCallback? onOpenPost, VoidCallback? onLike}) {
  return tester.pumpWidget(
    MaterialApp(
      theme: ieumTheme(Brightness.light),
      home: Scaffold(
        body: PostCard(
          post: post,
          me: const Me(nickname: '나'),
          onLike: onLike ?? () {},
          onSubmitComment: onComment ?? (_) async => null,
          onOpenPost: onOpenPost ?? () {},
          onOpenAuthor: () {},
        ),
      ),
    ),
  );
}

void main() {
  testWidgets('sprout 조건대로 표시하고 낭독 정보를 제공한다', (tester) async {
    final handle = tester.ensureSemantics();
    await pumpCard(tester, makePost());
    expect(find.text('댓글 보기'), findsOneWidget);
    expect(find.textContaining('댓글 2개'), findsOneWidget);
    expect(find.textContaining('수정됨'), findsOneWidget);
    expect(find.bySemanticsLabel(RegExp(r'하늘빛, 공식 계정, 인기 게시글')), findsOneWidget);
    expect(find.bySemanticsLabel('좋아요 3개'), findsOneWidget);
    handle.dispose();
  });

  testWidgets('좋아요와 댓글 보기 동작을 전달한다', (tester) async {
    var liked = 0;
    var opened = 0;
    await pumpCard(tester, makePost(), onLike: () => liked++, onOpenPost: () => opened++);
    await tester.tap(find.byIcon(Icons.thumb_up_outlined));
    await tester.tap(find.text('댓글 보기'));
    expect(liked, 1);
    expect(opened, 1);
  });

  testWidgets('빈 댓글은 보낼 수 없고, 보내면 비우며, 실패하면 안내하고 남긴다', (tester) async {
    final sent = <String>[];
    String? result;
    await pumpCard(tester, makePost(), onComment: (body) async {
      sent.add(body);
      return result;
    });
    final button = find.widgetWithText(TextButton, '게시');
    expect(tester.widget<TextButton>(button).onPressed, isNull);

    await tester.enterText(find.byType(TextField), '좋아요');
    await tester.pump();
    await tester.tap(button);
    await tester.pump();
    expect(sent, ['좋아요']);
    expect(tester.widget<TextField>(find.byType(TextField)).controller!.text, isEmpty);

    result = '금칙어가 있습니다.';
    await tester.enterText(find.byType(TextField), '나쁜 말');
    await tester.pump();
    await tester.tap(button);
    await tester.pump();
    expect(find.text('금칙어가 있습니다.'), findsOneWidget);
    expect(find.text('나쁜 말'), findsOneWidget);
  });

  testWidgets('여러 장이면 넘김 버튼과 쪽수를 보여 준다', (tester) async {
    final images = [const PostImage(url: 'https://x/demo/sunset.svg', alt: '노을'), const PostImage(url: 'https://x/demo/city.svg', alt: '')];
    await pumpCard(tester, makePost(images: images));
    expect(find.text('1 / 2'), findsOneWidget);
    expect(find.byTooltip('이전 사진'), findsNothing);
    await tester.tap(find.byTooltip('다음 사진'));
    await tester.pumpAndSettle();
    expect(find.text('2 / 2'), findsOneWidget);
    expect(find.byTooltip('다음 사진'), findsNothing);
  });

  testWidgets('사진은 자르지 않고 흐린 배경은 낭독하지 않는다', (tester) async {
    final handle = tester.ensureSemantics();
    final image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    await pumpCard(tester, makePost(images: [PostImage(url: image, alt: '바다 사진')]));
    final views = tester.widgetList<PostImageView>(find.byType(PostImageView)).toList();
    expect(views.map((view) => view.fit), [BoxFit.cover, BoxFit.contain]);
    expect(views.last.alignment, Alignment.topCenter);
    // 앞면과 흐린 배경이 디코딩한 사진 하나를 함께 씁니다.
    final providers = tester.widgetList<Image>(find.byType(Image)).map((widget) => widget.image).toList();
    expect((providers.first as MemoryImage).bytes, same((providers.last as MemoryImage).bytes));
    expect(find.bySemanticsLabel('바다 사진'), findsOneWidget);
    handle.dispose();
  });

  testWidgets('조작 영역이 44 이상이다', (tester) async {
    await pumpCard(tester, makePost());
    final handle = tester.ensureSemantics();
    await expectLater(tester, meetsGuideline(const MinimumTapTargetGuideline(size: Size(44, 44), link: 'KWCAG 6.1.3')));
    handle.dispose();
  });

  testWidgets('명도 대비를 지킨다', (tester) async {
    await pumpCard(tester, makePost());
    final handle = tester.ensureSemantics();
    await expectLater(tester, meetsGuideline(textContrastGuideline));
    handle.dispose();
  });

  testWidgets('하단 메뉴: 안 읽은 수를 낭독하고 선택을 전달한다', (tester) async {
    final handle = tester.ensureSemantics();
    final selected = <MenuTab>[];
    await tester.pumpWidget(
      MaterialApp(
        theme: ieumTheme(Brightness.light),
        home: Scaffold(
          bottomNavigationBar: BottomMenu(tab: MenuTab.home, unread: 3, onSelect: selected.add, onScrollTop: () {}),
        ),
      ),
    );
    expect(find.bySemanticsLabel('메시지, 읽지 않은 메시지 3개'), findsOneWidget);
    await tester.tap(find.byIcon(Icons.person_outline));
    expect(selected, [MenuTab.me]);
    // 스크린 리더로도 모든 항목을 실행할 수 있어야 합니다.
    for (final label in ['홈', '내 정보', '메시지, 읽지 않은 메시지 3개', '맨 위로']) {
      final data = tester.getSemantics(find.bySemanticsLabel(label)).getSemanticsData();
      expect(data.hasAction(SemanticsAction.tap), isTrue, reason: label);
    }
    await expectLater(tester, meetsGuideline(const MinimumTapTargetGuideline(size: Size(44, 44), link: 'KWCAG 6.1.3')));
    handle.dispose();
  });

  testWidgets('머리글: 글쓰기를 실행할 수 있고 조작 영역이 44 이상이다', (tester) async {
    final handle = tester.ensureSemantics();
    var written = 0;
    await tester.pumpWidget(
      MaterialApp(
        theme: ieumTheme(Brightness.light),
        home: Scaffold(body: AppHeader(dark: false, onToggleTheme: () {}, onWrite: () => written++)),
      ),
    );
    await tester.tap(find.text('글쓰기'));
    expect(written, 1);
    final data = tester.getSemantics(find.bySemanticsLabel('글쓰기')).getSemanticsData();
    expect(data.hasAction(SemanticsAction.tap), isTrue);
    await expectLater(tester, meetsGuideline(const MinimumTapTargetGuideline(size: Size(44, 44), link: 'KWCAG 6.1.3')));
    handle.dispose();
  });

  group('좁은 화면과 큰 글자에서 넘치지 않는다', () {
    Future<void> pumpScaled(WidgetTester tester, Widget child, {double scale = 2}) async {
      tester.view.physicalSize = const Size(320, 640);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);
      await tester.pumpWidget(
        MaterialApp(
          theme: ieumTheme(Brightness.light),
          home: MediaQuery(
            data: MediaQueryData(size: const Size(320, 640), textScaler: TextScaler.linear(scale)),
            child: Scaffold(body: child),
          ),
        ),
      );
    }

    testWidgets('머리글: 뒤로 가기, 스위치, 글쓰기를 모두 표시한다', (tester) async {
      await pumpScaled(tester, AppHeader(dark: false, onToggleTheme: () {}, onBack: () {}, onWrite: () {}));
      expect(tester.takeException(), isNull);
      expect(tester.getRect(find.text('글쓰기')).right, lessThanOrEqualTo(320));
    });

    testWidgets('하단 메뉴', (tester) async {
      await pumpScaled(tester, Align(alignment: Alignment.bottomCenter, child: BottomMenu(tab: MenuTab.home, unread: 120, onSelect: (_) {}, onScrollTop: () {})));
      expect(tester.takeException(), isNull);
    });

    testWidgets('키보드로 사진 영역이 낮아져도 글과 동작에 닿을 수 있다', (tester) async {
      var liked = 0;
      await tester.pumpWidget(
        MaterialApp(
          theme: ieumTheme(Brightness.light),
          home: MediaQuery(
            data: const MediaQueryData(size: Size(320, 640), textScaler: TextScaler.linear(2)),
            child: Scaffold(
              body: Align(
                alignment: Alignment.topCenter,
                // 키보드가 차지하고 남은 높이입니다.
                child: SizedBox(
                  height: 240,
                  child: PostCard(
                    post: makePost(caption: List.filled(40, '긴 내용').join(' ')),
                    me: const Me(nickname: '이음데모'),
                    onLike: () => liked++,
                    onSubmitComment: (_) async => null,
                    onOpenPost: () {},
                    onOpenAuthor: () {},
                  ),
                ),
              ),
            ),
          ),
        ),
      );
      expect(tester.takeException(), isNull);
      // 작성자는 글 묶음의 맨 위, 메뉴는 동작 줄의 맨 아래입니다.
      await tester.ensureVisible(find.text('하늘빛'));
      await tester.pumpAndSettle();
      expect(tester.getRect(find.text('하늘빛')).top, greaterThanOrEqualTo(0));
      final menu = find.byTooltip('게시글 메뉴 열기');
      await tester.ensureVisible(menu);
      await tester.pumpAndSettle();
      expect(tester.getRect(menu).bottom, lessThanOrEqualTo(240));
      final like = find.byIcon(Icons.thumb_up_outlined);
      await tester.ensureVisible(like);
      await tester.pumpAndSettle();
      await tester.tap(like);
      expect(liked, 1);
    });

    testWidgets('게시글', (tester) async {
      await pumpScaled(tester, PostCard(post: makePost(images: const []), me: const Me(nickname: '이음데모'), onLike: () {}, onSubmitComment: (_) async => null, onOpenPost: () {}, onOpenAuthor: () {}));
      expect(tester.takeException(), isNull);
    });
  });
}
