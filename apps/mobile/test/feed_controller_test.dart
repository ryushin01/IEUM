import 'package:flutter_test/flutter_test.dart';
import 'package:ieum/data/models.dart';
import 'package:ieum/data/post_repository.dart';
import 'package:ieum/data/transport.dart';
import 'package:ieum/feed/feed_controller.dart';

Post makePost(String id, {bool liked = false, int likes = 3, int comments = 0}) => Post(
  id: id,
  author: const PostAuthor(id: 'u', nickname: '하늘빛'),
  caption: '내용',
  images: const [],
  likeCount: likes,
  commentCount: comments,
  liked: liked,
  isHot: false,
  edited: false,
  createdAt: DateTime(2026),
);

class FakeRepository implements PostRepository {
  final pages = <String?, FeedPage>{};
  Exception? failure;
  Post? likedResult;
  final comments = <String>[];

  @override
  Future<FeedPage> fetchFeed({String? cursor}) async {
    if (failure != null) throw failure!;
    return pages[cursor]!;
  }

  @override
  Future<Post> setLiked(String postId, {required bool liked}) async {
    if (failure != null) throw failure!;
    return likedResult!;
  }

  @override
  Future<void> addComment(String postId, String body) async {
    if (failure != null) throw failure!;
    comments.add(body);
  }

  @override
  Future<Me> fetchMe() async => const Me(nickname: '나');
}

void main() {
  late FakeRepository repository;
  late FeedController controller;

  setUp(() {
    repository = FakeRepository()
      ..pages[null] = FeedPage(items: [makePost('a'), makePost('b')], nextCursor: 'c1')
      ..pages['c1'] = FeedPage(items: [makePost('c')]);
    controller = FeedController(repository);
  });

  test('이어서 불러오고 마지막 페이지에서 멈춘다', () async {
    await controller.reload();
    expect(controller.hasMore, isTrue);
    await controller.loadMore();
    expect(controller.posts.map((p) => p.id), ['a', 'b', 'c']);
    expect(controller.hasMore, isFalse);
    await controller.loadMore();
    expect(controller.posts.length, 3);
  });

  test('새로고침이 실패해도 보던 글을 지우지 않고 안내한다', () async {
    await controller.reload();
    repository.failure = const ApiException(0, '네트워크 연결을 확인해 주세요.');
    await controller.reload();
    expect(controller.posts.length, 2);
    expect(controller.error.value, '네트워크 연결을 확인해 주세요.');
  });

  test('좋아요는 바로 반영하고 서버 값으로 맞춘다', () async {
    await controller.reload();
    repository.likedResult = makePost('a', liked: true, likes: 10);
    final pending = controller.toggleLike(controller.posts.first);
    expect(controller.posts.first.liked, isTrue);
    expect(controller.posts.first.likeCount, 4);
    expect(await pending, isNull);
    expect(controller.posts.first.likeCount, 10);
  });

  test('좋아요가 실패하면 되돌리고 안내한다', () async {
    await controller.reload();
    repository.failure = const ApiException(500, '오류');
    expect(await controller.toggleLike(controller.posts.first), '오류');
    expect(controller.posts.first.liked, isFalse);
    expect(controller.posts.first.likeCount, 3);
  });

  test('댓글을 쓰면 개수가 늘고, 실패하면 그대로다', () async {
    await controller.reload();
    expect(await controller.addComment(controller.posts.first, '좋아요'), isNull);
    expect(repository.comments, ['좋아요']);
    expect(controller.posts.first.commentCount, 1);
    repository.failure = const ApiException(400, '금칙어');
    expect(await controller.addComment(controller.posts.first, '나쁜 말'), '금칙어');
    expect(controller.posts.first.commentCount, 1);
  });
}
