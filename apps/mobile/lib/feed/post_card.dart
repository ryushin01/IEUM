import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../app/theme.dart';
import '../data/models.dart';
import 'post_image_view.dart';
import 'time_ago.dart';

class UserAvatar extends StatelessWidget {
  const UserAvatar({super.key, required this.nickname, this.url, this.size = 36, this.hot = false});

  final String nickname;
  final String? url;
  final double size;
  final bool hot;

  @override
  Widget build(BuildContext context) {
    final image = url;
    final avatar = ClipOval(
      child: SizedBox.square(
        dimension: size,
        child: image != null
            ? PostImageView(url: image, label: '')
            : ColoredBox(
                color: IeumColors.of(context).likeSoft,
                child: Center(
                  child: Text(
                    nickname.characters.first,
                    style: TextStyle(color: IeumColors.of(context).like, fontSize: size * .45, fontWeight: FontWeight.w800),
                  ),
                ),
              ),
      ),
    );
    if (!hot) return ExcludeSemantics(child: avatar);
    // 인기 게시글 작성자의 프로필 링입니다.
    return ExcludeSemantics(
      child: DecoratedBox(
        decoration: BoxDecoration(shape: BoxShape.circle, color: IeumColors.of(context).primary),
        child: Padding(
          padding: const EdgeInsets.all(2),
          child: DecoratedBox(
            decoration: BoxDecoration(shape: BoxShape.circle, color: IeumColors.of(context).surface),
            child: Padding(padding: const EdgeInsets.all(1), child: avatar),
          ),
        ),
      ),
    );
  }
}

/// 사진 넘기기입니다. 스와이프와 함께 키보드·스위치 사용자를 위한 버튼을 둡니다.
class ImageCarousel extends StatefulWidget {
  const ImageCarousel({super.key, required this.images, required this.authorNickname});

  final List<PostImage> images;
  final String authorNickname;

  @override
  State<ImageCarousel> createState() => _ImageCarouselState();
}

class _ImageCarouselState extends State<ImageCarousel> {
  final _controller = PageController();
  var _index = 0;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _go(int page) => _controller.animateToPage(page, duration: const Duration(milliseconds: 250), curve: Curves.easeOut);

  String _alt(int i) {
    final alt = widget.images[i].alt;
    return alt.isNotEmpty ? alt : '${widget.authorNickname} 님이 올린 ${i + 1}번째 사진';
  }

  @override
  Widget build(BuildContext context) {
    final count = widget.images.length;
    return ClipRRect(
      borderRadius: BorderRadius.circular(18),
      child: AspectRatio(
      aspectRatio: 1,
      child: Stack(
        fit: StackFit.expand,
        children: [
          PageView.builder(
            controller: _controller,
            itemCount: count,
            onPageChanged: (i) => setState(() => _index = i),
            itemBuilder: (context, i) => PostImageView(url: widget.images[i].url, label: _alt(i)),
          ),
          if (count > 1) ...[
            Positioned(
              top: 12,
              right: 12,
              child: DecoratedBox(
                decoration: BoxDecoration(color: Colors.black.withValues(alpha: .7), borderRadius: BorderRadius.circular(12)),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
                  child: Text('${_index + 1} / $count', style: const TextStyle(color: Colors.white, fontSize: 14)),
                ),
              ),
            ),
            if (_index > 0)
              Positioned(left: 8, top: 0, bottom: 0, child: _ArrowButton(icon: Icons.chevron_left, label: '이전 사진', onPressed: () => _go(_index - 1))),
            if (_index < count - 1)
              Positioned(right: 8, top: 0, bottom: 0, child: _ArrowButton(icon: Icons.chevron_right, label: '다음 사진', onPressed: () => _go(_index + 1))),
          ],
        ],
      ),
      ),
    );
  }
}

class _ArrowButton extends StatelessWidget {
  const _ArrowButton({required this.icon, required this.label, required this.onPressed});

  final IconData icon;
  final String label;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: IconButton(
        tooltip: label,
        onPressed: onPressed,
        constraints: const BoxConstraints(minWidth: 44, minHeight: 44),
        style: IconButton.styleFrom(backgroundColor: Colors.black.withValues(alpha: .6), foregroundColor: Colors.white),
        icon: Icon(icon),
      ),
    );
  }
}

class PostCard extends StatefulWidget {
  const PostCard({
    super.key,
    required this.post,
    required this.me,
    required this.onLike,
    required this.onSubmitComment,
    required this.onOpenPost,
    required this.onOpenAuthor,
  });

  final Post post;
  final Me? me;
  final VoidCallback onLike;

  /// 성공하면 null, 실패하면 안내 문구입니다.
  final Future<String?> Function(String body) onSubmitComment;
  final VoidCallback onOpenPost;
  final VoidCallback onOpenAuthor;

  @override
  State<PostCard> createState() => _PostCardState();
}

class _PostCardState extends State<PostCard> {
  final _comment = TextEditingController();
  var _sending = false;
  String? _error;

  @override
  void dispose() {
    _comment.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final body = _comment.text.trim();
    if (body.isEmpty || _sending) return;
    setState(() {
      _sending = true;
      _error = null;
    });
    final error = await widget.onSubmitComment(body);
    if (!mounted) return;
    setState(() {
      _sending = false;
      _error = error;
      if (error == null) _comment.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    final post = widget.post;
    final colors = IeumColors.of(context);
    final me = widget.me;
    return Semantics(
      container: true,
      label: '${post.author.nickname} 님의 게시글',
      child: Container(
        margin: const EdgeInsets.fromLTRB(12, 0, 12, 14),
        decoration: BoxDecoration(
          color: colors.surface,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [BoxShadow(color: colors.shadow, blurRadius: 18, offset: const Offset(0, 6))],
        ),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Row(
                  children: [
                    Expanded(
                      child: Semantics(
                        button: true,
                        label: '${post.author.nickname}${post.author.isOfficial ? ', 공식 계정' : ''}${post.isHot ? ', 인기 게시글' : ''}, ${timeAgo(post.createdAt)}, 프로필 보기',
                        excludeSemantics: true,
                        child: InkWell(
                          onTap: widget.onOpenAuthor,
                          child: ConstrainedBox(
                            constraints: const BoxConstraints(minHeight: 44),
                            child: Row(
                              children: [
                                UserAvatar(nickname: post.author.nickname, url: post.author.avatarUrl, hot: post.isHot),
                                const SizedBox(width: 12),
                                Flexible(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Flexible(
                                            child: Text(
                                              post.author.nickname,
                                              overflow: TextOverflow.ellipsis,
                                              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                                            ),
                                          ),
                                          if (post.author.isOfficial) ...[
                                            const SizedBox(width: 4),
                                            Icon(Icons.check_circle, size: 15, color: colors.official),
                                          ],
                                        ],
                                      ),
                                      Text(
                                        '${timeAgo(post.createdAt)}${post.edited ? ' · 수정됨' : ''}',
                                        style: TextStyle(fontSize: 13, color: colors.muted),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                    // 수정, 삭제, 신고, 차단은 상세 화면(웹뷰)의 메뉴에서 합니다.
                    IconButton(
                      tooltip: '게시글 메뉴 열기',
                      onPressed: widget.onOpenPost,
                      constraints: const BoxConstraints(minWidth: 44, minHeight: 44),
                      icon: Icon(Icons.more_vert, color: colors.text),
                    ),
                  ],
                ),
              ),
              if (post.images.isNotEmpty) ImageCarousel(images: post.images, authorNickname: post.author.nickname),
              Padding(
                padding: const EdgeInsets.only(top: 10),
                child: Semantics(
                  button: true,
                  toggled: post.liked,
                  label: '좋아요 ${post.likeCount}개',
                  excludeSemantics: true,
                  child: TextButton.icon(
                    onPressed: () {
                      HapticFeedback.lightImpact();
                      widget.onLike();
                    },
                    style: TextButton.styleFrom(
                      backgroundColor: post.liked ? colors.likeSoft : colors.bg,
                      foregroundColor: post.liked ? colors.like : colors.text,
                      minimumSize: const Size(44, 44),
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      shape: const StadiumBorder(),
                    ),
                    icon: Icon(post.liked ? Icons.favorite : Icons.favorite_border, color: post.liked ? colors.like : colors.text, size: 20),
                    label: Text('좋아요 ${post.likeCount}', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800)),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(2, 10, 2, 0),
                child: Text(post.caption, maxLines: 3, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 15, height: 1.55)),
              ),
              Padding(
                padding: EdgeInsets.zero,
                child: TextButton(
                  onPressed: widget.onOpenPost,
                  style: TextButton.styleFrom(foregroundColor: colors.muted, minimumSize: const Size(44, 44), padding: const EdgeInsets.symmetric(horizontal: 2)),
                  child: Text('댓글 ${post.commentCount}개 모두 보기', style: const TextStyle(fontSize: 14)),
                ),
              ),
              Padding(
                padding: EdgeInsets.zero,
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    if (me != null) ...[
                      UserAvatar(nickname: me.nickname, url: me.avatarUrl, size: 24),
                      const SizedBox(width: 8),
                    ],
                    Expanded(
                      child: TextField(
                        controller: _comment,
                        maxLength: 100,
                        onChanged: (_) => setState(() {}),
                        onSubmitted: (_) => _submit(),
                        textInputAction: TextInputAction.send,
                        decoration: const InputDecoration(hintText: '댓글 쓰기 (최대 100자)', counterText: '', labelText: null),
                      ),
                    ),
                    const SizedBox(width: 8),
                    FilledButton(
                      onPressed: _comment.text.trim().isEmpty || _sending ? null : _submit,
                      style: FilledButton.styleFrom(minimumSize: const Size(56, 44), padding: const EdgeInsets.symmetric(horizontal: 12)),
                      child: const Text('게시'),
                    ),
                  ],
                ),
              ),
              if (_error != null)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Semantics(liveRegion: true, child: Text(_error!, style: TextStyle(color: colors.error))),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
