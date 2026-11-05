import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ieum/app/theme.dart';
import 'package:ieum/data/models.dart';
import 'package:ieum/dm/chat_view.dart';
import 'package:ieum/dm/dm_list_view.dart';

Widget wrap(Widget child, {Brightness brightness = Brightness.light}) =>
    MaterialApp(theme: ieumTheme(brightness), home: Scaffold(body: child));

void main() {
  final conversation = ConversationSummary(
    id: 'c1',
    other: const PostAuthor(id: 'u', nickname: '하늘빛'),
    lastMessage: '안녕하세요',
    lastMessageAt: DateTime.now().subtract(const Duration(minutes: 3)),
    unreadCount: 2,
  );

  testWidgets('대화 항목: 낭독 정보와 선택을 제공한다', (tester) async {
    final handle = tester.ensureSemantics();
    var opened = 0;
    await tester.pumpWidget(wrap(ConversationTile(conversation: conversation, onTap: () => opened++)));
    expect(find.bySemanticsLabel(RegExp(r'하늘빛, 안녕하세요, 3분 전, 읽지 않은 메시지 2개')), findsOneWidget);
    await tester.tap(find.byType(ConversationTile));
    expect(opened, 1);
    await expectLater(tester, meetsGuideline(textContrastGuideline));
    await expectLater(tester, meetsGuideline(const MinimumTapTargetGuideline(size: Size(44, 44), link: 'KWCAG 6.1.3')));
    handle.dispose();
  });

  for (final brightness in Brightness.values) {
    testWidgets('말풍선: 보낸 사람과 읽음을 낭독하고 대비를 지킨다 ($brightness)', (tester) async {
      final handle = tester.ensureSemantics();
      final created = DateTime.now().subtract(const Duration(minutes: 5));
      await tester.pumpWidget(
        wrap(
          Column(
            children: [
              MessageBubble(message: Message(id: '1', conversationId: 'c', senderId: 'me', body: '보냄', createdAt: created, readAt: created), mine: true),
              MessageBubble(message: Message(id: '2', conversationId: 'c', senderId: 'u', body: '받음', createdAt: created), mine: false),
            ],
          ),
          brightness: brightness,
        ),
      );
      expect(find.bySemanticsLabel(RegExp(r'내가 보낸 메시지: 보냄, 5분 전, 읽음')), findsOneWidget);
      expect(find.bySemanticsLabel(RegExp(r'^받은 메시지: 받음, 5분 전$')), findsOneWidget);
      await expectLater(tester, meetsGuideline(textContrastGuideline));
      handle.dispose();
    });
  }
}
