class PostAuthor {
  const PostAuthor({required this.id, required this.nickname, this.avatarUrl, this.isOfficial = false});

  factory PostAuthor.fromJson(Map<String, dynamic> json) => PostAuthor(
    id: json['id'] as String,
    nickname: json['nickname'] as String,
    avatarUrl: json['avatarUrl'] as String?,
    isOfficial: json['isOfficial'] as bool? ?? false,
  );

  final String id;
  final String nickname;
  final String? avatarUrl;
  final bool isOfficial;
}

class PostImage {
  const PostImage({required this.url, required this.alt});

  factory PostImage.fromJson(Map<String, dynamic> json) =>
      PostImage(url: json['url'] as String, alt: json['alt'] as String? ?? '');

  final String url;
  final String alt;
}

class Post {
  const Post({
    required this.id,
    required this.author,
    required this.caption,
    required this.images,
    required this.likeCount,
    required this.commentCount,
    required this.liked,
    required this.isHot,
    required this.edited,
    required this.createdAt,
  });

  factory Post.fromJson(Map<String, dynamic> json) => Post(
    id: json['id'] as String,
    author: PostAuthor.fromJson(json['author'] as Map<String, dynamic>),
    caption: json['caption'] as String,
    images: (json['images'] as List<dynamic>).map((e) => PostImage.fromJson(e as Map<String, dynamic>)).toList(),
    likeCount: json['likeCount'] as int,
    commentCount: json['commentCount'] as int,
    liked: json['liked'] as bool,
    isHot: json['isHot'] as bool? ?? false,
    edited: json['edited'] as bool? ?? false,
    createdAt: DateTime.parse(json['createdAt'] as String),
  );

  final String id;
  final PostAuthor author;
  final String caption;
  final List<PostImage> images;
  final int likeCount;
  final int commentCount;
  final bool liked;
  final bool isHot;
  final bool edited;
  final DateTime createdAt;

  Post copyWith({int? likeCount, int? commentCount, bool? liked}) => Post(
    id: id,
    author: author,
    caption: caption,
    images: images,
    likeCount: likeCount ?? this.likeCount,
    commentCount: commentCount ?? this.commentCount,
    liked: liked ?? this.liked,
    isHot: isHot,
    edited: edited,
    createdAt: createdAt,
  );
}

class FeedPage {
  const FeedPage({required this.items, this.nextCursor});

  final List<Post> items;
  final String? nextCursor;
}

/// 하단 메뉴에 필요한 내 정보입니다.
class Me {
  const Me({required this.nickname, this.id = '', this.avatarUrl});

  final String id;
  final String nickname;
  final String? avatarUrl;
}

class ConversationSummary {
  const ConversationSummary({required this.id, required this.other, required this.lastMessage, required this.lastMessageAt, required this.unreadCount});

  factory ConversationSummary.fromJson(Map<String, dynamic> json) => ConversationSummary(
    id: json['id'] as String,
    other: PostAuthor.fromJson(Map<String, dynamic>.from(json['other'] as Map)),
    lastMessage: json['lastMessage'] as String? ?? '',
    lastMessageAt: DateTime.parse(json['lastMessageAt'] as String),
    unreadCount: json['unreadCount'] as int,
  );

  final String id;
  final PostAuthor other;
  final String lastMessage;
  final DateTime lastMessageAt;
  final int unreadCount;
}

class ConversationInfo {
  const ConversationInfo({required this.id, required this.other, required this.canSend});

  factory ConversationInfo.fromJson(Map<String, dynamic> json) => ConversationInfo(
    id: json['id'] as String,
    other: PostAuthor.fromJson(Map<String, dynamic>.from(json['other'] as Map)),
    canSend: json['canSend'] as bool,
  );

  final String id;
  final PostAuthor other;
  final bool canSend;
}

class Message {
  const Message({required this.id, required this.conversationId, required this.senderId, required this.body, required this.createdAt, this.readAt});

  factory Message.fromJson(Map<String, dynamic> json) => Message(
    id: json['id'] as String,
    conversationId: json['conversationId'] as String,
    senderId: json['senderId'] as String,
    body: json['body'] as String,
    createdAt: DateTime.parse(json['createdAt'] as String),
    readAt: json['readAt'] == null ? null : DateTime.parse(json['readAt'] as String),
  );

  final String id;
  final String conversationId;
  final String senderId;
  final String body;
  final DateTime createdAt;
  final DateTime? readAt;

  Message markedRead(DateTime at) => Message(id: id, conversationId: conversationId, senderId: senderId, body: body, createdAt: createdAt, readAt: readAt ?? at);
}

class MessagePage {
  const MessagePage({required this.items, this.nextCursor});

  /// 서버 응답 그대로 최신순입니다.
  final List<Message> items;
  final String? nextCursor;
}
