import 'dart:ui' show SemanticsAction;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ieum/app/theme.dart';
import 'package:ieum/data/models.dart';
import 'package:ieum/feed/post_card.dart';
import 'package:ieum/shell/bottom_menu.dart';

Post makePost({List<PostImage> images = const [], bool official = true, bool hot = true}) => Post(
  id: 'p1',
  author: PostAuthor(id: 'u1', nickname: '하늘빛', isOfficial: official),
  caption: '퇴근길 하늘',
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
        body: SingleChildScrollView(
          child: PostCard(
            post: post,
            me: const Me(nickname: '나'),
            onLike: onLike ?? () {},
            onSubmitComment: onComment ?? (_) async => null,
            onOpenPost: onOpenPost ?? () {},
            onOpenAuthor: () {},
          ),
        ),
      ),
    ),
  );
}

void main() {
  testWidgets('sprout 조건대로 표시하고 낭독 정보를 제공한다', (tester) async {
    final handle = tester.ensureSemantics();
    await pumpCard(tester, makePost());
    expect(find.text('댓글 2개 모두 보기'), findsOneWidget);
    expect(find.textContaining('수정됨'), findsOneWidget);
    expect(find.bySemanticsLabel(RegExp(r'하늘빛, 공식 계정, 인기 게시글')), findsOneWidget);
    expect(find.bySemanticsLabel('좋아요 3개'), findsOneWidget);
    handle.dispose();
  });

  testWidgets('좋아요와 댓글 보기 동작을 전달한다', (tester) async {
    var liked = 0;
    var opened = 0;
    await pumpCard(tester, makePost(), onLike: () => liked++, onOpenPost: () => opened++);
    await tester.tap(find.byIcon(Icons.favorite_border));
    await tester.tap(find.text('댓글 2개 모두 보기'));
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
    final button = find.widgetWithText(FilledButton, '게시');
    expect(tester.widget<FilledButton>(button).onPressed, isNull);

    await tester.enterText(find.byType(TextField), '좋아요');
    await tester.pump();
    await tester.tap(button);
    await tester.pump();
    expect(sent, ['좋아요']);
    expect(find.text('좋아요'), findsNothing);

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
          bottomNavigationBar: BottomMenu(tab: MenuTab.home, unread: 3, me: null, onSelect: selected.add, onScrollTop: () {}),
        ),
      ),
    );
    expect(find.bySemanticsLabel('메시지, 읽지 않은 메시지 3개'), findsOneWidget);
    await tester.tap(find.byIcon(Icons.add));
    expect(selected, [MenuTab.write]);
    // 스크린 리더로도 모든 항목을 실행할 수 있어야 합니다.
    for (final label in ['홈', '내 정보', '새 게시글', '메시지, 읽지 않은 메시지 3개', '맨 위로']) {
      final data = tester.getSemantics(find.bySemanticsLabel(label)).getSemanticsData();
      expect(data.hasAction(SemanticsAction.tap), isTrue, reason: label);
    }
    await expectLater(tester, meetsGuideline(const MinimumTapTargetGuideline(size: Size(44, 44), link: 'KWCAG 6.1.3')));
    handle.dispose();
  });
}
