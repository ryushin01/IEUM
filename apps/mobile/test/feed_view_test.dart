import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:get/get.dart';
import 'package:ieum/app/theme.dart';
import 'package:ieum/data/models.dart';
import 'package:ieum/data/post_repository.dart';
import 'package:ieum/data/transport.dart';
import 'package:ieum/feed/feed_controller.dart';
import 'package:ieum/feed/feed_page.dart';

class EmptyRepository implements PostRepository {
  EmptyRepository({this.failure});
  final Exception? failure;

  @override
  Future<FeedPage> fetchFeed({String? cursor}) async {
    if (failure != null) throw failure!;
    return const FeedPage(items: []);
  }

  @override
  Future<void> addComment(String postId, String body) async {}
  @override
  Future<Me> fetchMe() async => const Me(nickname: '나');
  @override
  Future<Post> setLiked(String postId, {required bool liked}) async => throw UnimplementedError();
}

Future<void> pumpFeed(WidgetTester tester, FeedController controller, {void Function(String)? onOpenPath}) async {
  await tester.pumpWidget(
    MaterialApp(
      theme: ieumTheme(Brightness.light),
      home: Scaffold(
        body: FeedView(
          controller: controller,
          me: Rxn<Me>(),
          scrollController: ScrollController(),
          dark: false,
          onToggleTheme: () {},
          onOpenPath: onOpenPath ?? (_) {},
        ),
      ),
    ),
  );
}

void main() {
  testWidgets('헤더: 스위치가 로고를 가리지 않고 오른쪽 끝에 있다', (tester) async {
    await pumpFeed(tester, FeedController(EmptyRepository()));
    final logo = tester.getRect(find.text('IEUM'));
    final toggle = tester.getRect(find.byType(Switch));
    final width = tester.getSize(find.byType(FeedView)).width;
    expect(toggle.left, greaterThan(logo.right));
    expect(toggle.right, greaterThan(width - 16));
    expect(logo.center.dx, moreOrLessEquals(width / 2, epsilon: 16));
  });

  testWidgets('글이 없으면 첫 게시글 작성으로 안내한다', (tester) async {
    final controller = FeedController(EmptyRepository());
    await controller.reload();
    final opened = <String>[];
    await pumpFeed(tester, controller, onOpenPath: opened.add);
    await tester.tap(find.text('첫 게시글 올리기'));
    expect(opened, ['/posts/new']);
  });

  testWidgets('불러오지 못하면 안내하고 다시 시도할 수 있다', (tester) async {
    final controller = FeedController(EmptyRepository(failure: const ApiException(0, '네트워크 연결을 확인해 주세요.')));
    await controller.reload();
    await pumpFeed(tester, controller);
    expect(find.text('네트워크 연결을 확인해 주세요.'), findsOneWidget);
    expect(find.text('다시 시도'), findsOneWidget);
  });
}
