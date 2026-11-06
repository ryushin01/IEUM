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

/// 커서마다 정해진 페이지를 돌려주고, 요청한 커서를 기록합니다.
class PagedRepository extends EmptyRepository {
  final requested = <String?>[];

  static Post _post(String id) => Post(
    id: id,
    author: const PostAuthor(id: 'u', nickname: '하늘빛'),
    caption: '글 $id',
    images: const [],
    likeCount: 0,
    commentCount: 0,
    liked: false,
    edited: false,
    isHot: false,
    createdAt: DateTime(2026),
  );

  @override
  Future<FeedPage> fetchFeed({String? cursor}) async {
    requested.add(cursor);
    if (cursor == null) return FeedPage(items: [for (var i = 0; i < 10; i++) _post('a$i')], nextCursor: 'c1');
    return FeedPage(items: [_post('b0')]);
  }
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
  testWidgets('헤더: 로고는 왼쪽, 스위치와 글쓰기는 오른쪽에 겹치지 않게 있다', (tester) async {
    await pumpFeed(tester, FeedController(EmptyRepository()));
    final logo = tester.getRect(find.text('IEUM'));
    final toggle = tester.getRect(find.byType(Switch));
    final write = tester.getRect(find.text('글쓰기'));
    final width = tester.getSize(find.byType(FeedView)).width;
    expect(logo.left, moreOrLessEquals(16, epsilon: 1));
    expect(toggle.left, greaterThan(logo.right));
    expect(write.left, greaterThan(toggle.right));
    expect(write.right, lessThanOrEqualTo(width - 16));
  });

  testWidgets('끝 근처까지 스크롤하면 다음 페이지를 불러오고, 마지막 페이지 뒤에는 더 요청하지 않는다', (tester) async {
    final repository = PagedRepository();
    final controller = FeedController(repository);
    await controller.reload();
    await pumpFeed(tester, controller);
    expect(repository.requested, [null]);

    final list = find.byType(Scrollable).first;
    await tester.drag(list, const Offset(0, -3000));
    await tester.pumpAndSettle();
    expect(repository.requested, [null, 'c1']);
    expect(controller.posts.length, 11);

    await tester.drag(list, const Offset(0, -3000));
    await tester.pumpAndSettle();
    expect(repository.requested, [null, 'c1']);
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
