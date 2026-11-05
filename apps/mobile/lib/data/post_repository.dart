import 'models.dart';
import 'transport.dart';

abstract class PostRepository {
  Future<FeedPage> fetchFeed({String? cursor});
  Future<Post> setLiked(String postId, {required bool liked});
  Future<void> addComment(String postId, String body);
  Future<Me> fetchMe();
}

class ApiPostRepository implements PostRepository {
  const ApiPostRepository(this.transport);

  final ApiTransport transport;

  @override
  Future<FeedPage> fetchFeed({String? cursor}) async {
    final query = cursor == null ? '' : '?cursor=${Uri.encodeQueryComponent(cursor)}';
    final data = await transport.request('GET', '/posts$query') as Map;
    return FeedPage(
      items: (data['items'] as List<dynamic>).map((e) => Post.fromJson(Map<String, dynamic>.from(e as Map))).toList(),
      nextCursor: data['nextCursor'] as String?,
    );
  }

  @override
  Future<Post> setLiked(String postId, {required bool liked}) async {
    final data = await transport.request(liked ? 'PUT' : 'DELETE', '/posts/$postId/like') as Map;
    return Post.fromJson(Map<String, dynamic>.from(data));
  }

  @override
  Future<void> addComment(String postId, String body) async {
    await transport.request('POST', '/posts/$postId/comments', body: {'body': body});
  }

  @override
  Future<Me> fetchMe() async {
    final data = await transport.request('GET', '/me') as Map;
    return Me(id: data['id'] as String, nickname: data['nickname'] as String, avatarUrl: data['avatarUrl'] as String?);
  }
}
