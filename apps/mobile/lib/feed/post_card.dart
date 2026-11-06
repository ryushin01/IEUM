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
                color: IeumColors.of(context).avatarBg,
                child: Center(
                  child: Text(
                    nickname.characters.first,
                    style: TextStyle(color: IeumColors.of(context).onAvatar, fontSize: size * .45, fontWeight: FontWeight.w700),
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
    return AspectRatio(
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

  void _like() {
    HapticFeedback.lightImpact();
    widget.onLike();
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
        margin: const EdgeInsets.only(bottom: IeumColors.band),
        color: colors.surface,
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Semantics(
                    button: true,
                    label: '${post.author.nickname}${post.author.isOfficial ? ', 공식 계정' : ''}${post.isHot ? ', 인기 게시글' : ''}, ${timeAgo(post.createdAt)}, 프로필 보기',
                    onTap: widget.onOpenAuthor,
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
                                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
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
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: Text(post.caption, maxLines: 3, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 16, height: 1.55)),
            ),
            if (post.images.isNotEmpty) ImageCarousel(images: post.images, authorNickname: post.author.nickname),
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: Text('좋아요 ${post.likeCount}개 · 댓글 ${post.commentCount}개', style: TextStyle(fontSize: 14, color: colors.muted)),
            ),
            Divider(height: 1, thickness: 1, color: colors.border),
            Row(
              children: [
                Expanded(
                  child: Semantics(
                    button: true,
                    toggled: post.liked,
                    label: '좋아요 ${post.likeCount}개',
                    onTap: _like,
                    excludeSemantics: true,
                    child: TextButton.icon(
                      onPressed: _like,
                      style: TextButton.styleFrom(
                        foregroundColor: post.liked ? colors.like : colors.text,
                        minimumSize: const Size(44, 48),
                        shape: const RoundedRectangleBorder(),
                      ),
                      icon: Icon(post.liked ? Icons.thumb_up : Icons.thumb_up_outlined, color: post.liked ? colors.like : colors.text, size: 20),
                      label: Text('좋아요', style: TextStyle(fontSize: 15, fontWeight: post.liked ? FontWeight.w700 : FontWeight.w400)),
                    ),
                  ),
                ),
                Expanded(
                  child: TextButton.icon(
                    onPressed: widget.onOpenPost,
                    style: TextButton.styleFrom(
                      foregroundColor: colors.text,
                      minimumSize: const Size(44, 48),
                      shape: const RoundedRectangleBorder(),
                    ),
                    icon: Icon(Icons.chat_bubble_outline, color: colors.text, size: 20),
                    label: const Text('댓글 보기', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w400)),
                  ),
                ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Row(
                children: [
                  if (me != null) ...[
                    UserAvatar(nickname: me.nickname, url: me.avatarUrl, size: 32),
                    const SizedBox(width: 8),
                  ],
                  Expanded(
                    // 입력칸과 게시 버튼을 하나의 알약으로 묶습니다.
                    child: DecoratedBox(
                      decoration: ShapeDecoration(
                        shape: StadiumBorder(side: BorderSide(color: colors.control)),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _comment,
                              maxLength: 100,
                              onChanged: (_) => setState(() {}),
                              onSubmitted: (_) => _submit(),
                              textInputAction: TextInputAction.send,
                              decoration: const InputDecoration(
                                hintText: '댓글 쓰기 (최대 100자)',
                                counterText: '',
                                labelText: null,
                                filled: false,
                                border: InputBorder.none,
                                enabledBorder: InputBorder.none,
                                focusedBorder: InputBorder.none,
                                contentPadding: EdgeInsets.fromLTRB(18, 13, 4, 13),
                              ),
                            ),
                          ),
                          TextButton(
                            onPressed: _comment.text.trim().isEmpty || _sending ? null : _submit,
                            style: TextButton.styleFrom(
                              foregroundColor: colors.primary,
                              disabledForegroundColor: colors.muted,
                              minimumSize: const Size(56, 44),
                              padding: const EdgeInsets.symmetric(horizontal: 12),
                              shape: const StadiumBorder(),
                              textStyle: const TextStyle(fontFamily: 'GothicA1', fontWeight: FontWeight.w700, fontSize: 15),
                            ),
                            child: const Text('게시'),
                          ),
                        ],
                      ),
                    ),
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
    );
  }
}
