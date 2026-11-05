import 'package:get/get.dart';

import '../data/models.dart';
import '../data/post_repository.dart';

class FeedController extends GetxController {
  FeedController(this.repository);

  final PostRepository repository;

  final posts = <Post>[].obs;
  final loading = false.obs;
  final loadingMore = false.obs;
  final error = RxnString();
  String? _cursor;

  bool get hasMore => _cursor != null;

  /// 처음 불러오기와 새로고침입니다. 이미 글이 있으면 실패해도 화면을 지우지 않습니다.
  Future<void> reload() async {
    if (loading.value) return;
    loading.value = true;
    error.value = null;
    try {
      final page = await repository.fetchFeed();
      posts.assignAll(page.items);
      _cursor = page.nextCursor;
    } on Exception catch (e) {
      error.value = e.toString();
    } finally {
      loading.value = false;
    }
  }

  Future<void> loadMore() async {
    final cursor = _cursor;
    if (cursor == null || loadingMore.value || loading.value) return;
    loadingMore.value = true;
    try {
      final page = await repository.fetchFeed(cursor: cursor);
      posts.addAll(page.items);
      _cursor = page.nextCursor;
    } on Exception {
      // 더 내리면 다시 시도합니다.
    } finally {
      loadingMore.value = false;
    }
  }

  /// 누르는 즉시 반영하고, 실패하면 되돌립니다. 실패 안내 문구를 돌려줍니다.
  Future<String?> toggleLike(Post post) async {
    final next = !post.liked;
    _replace(post.copyWith(liked: next, likeCount: post.likeCount + (next ? 1 : -1)));
    try {
      _replace(await repository.setLiked(post.id, liked: next));
      return null;
    } on Exception catch (e) {
      _replace(post);
      return e.toString();
    }
  }

  /// 성공하면 null, 실패하면 안내 문구를 돌려줍니다.
  Future<String?> addComment(Post post, String body) async {
    try {
      await repository.addComment(post.id, body);
      final current = posts.firstWhereOrNull((p) => p.id == post.id) ?? post;
      _replace(current.copyWith(commentCount: current.commentCount + 1));
      return null;
    } on Exception catch (e) {
      return e.toString();
    }
  }

  void _replace(Post post) {
    final index = posts.indexWhere((p) => p.id == post.id);
    if (index >= 0) posts[index] = post;
  }
}
