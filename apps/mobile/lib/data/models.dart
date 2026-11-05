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
  const Me({required this.nickname, this.avatarUrl});

  final String nickname;
  final String? avatarUrl;
}
