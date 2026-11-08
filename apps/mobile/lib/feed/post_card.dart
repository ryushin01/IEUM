import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
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
                    style: TextStyle(color: IeumColors.of(context).onAvatar, fontSize: size * .4, fontWeight: FontWeight.w700),
                  ),
                ),
              ),
      ),
    );
    if (!hot) return ExcludeSemantics(child: avatar);
    // 인기 게시글 작성자의 프로필 링입니다.
    return ExcludeSemantics(
      child: DecoratedBox(
        decoration: BoxDecoration(shape: BoxShape.circle, color: IeumColors.of(context).accent),
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
    return Stack(
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
                child: Text('${_index + 1} / $count', style: const TextStyle(color: Colors.white, fontSize: 12)),
              ),
            ),
          ),
          if (_index > 0)
            Positioned(left: 8, top: 0, bottom: 0, child: _ArrowButton(icon: Icons.chevron_left, label: '이전 사진', onPressed: () => _go(_index - 1))),
          if (_index < count - 1)
            Positioned(right: 8, top: 0, bottom: 0, child: _ArrowButton(icon: Icons.chevron_right, label: '다음 사진', onPressed: () => _go(_index + 1))),
        ],
      ],
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

/// 글자가 시작하기 전에 막이 충분히 어두워지는 높이입니다. 흰 사진 위에서도 글자 대비 4.5:1을 넘깁니다.
const double _fade = 64;

/// 글 묶음이 잘리지 않고 사진 위에 들어가는 높이입니다. 글자 크기에 따라 늘어납니다.
const double _overlayHeight = 260;

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
      explicitChildNodes: true,
      label: '${post.author.nickname} 님의 게시글',
      child: ColoredBox(
        color: colors.surface,
        child: Column(
          children: [
            Expanded(
              // 사진 색과 상관없이 읽히도록 사진 위 요소는 테마와 상관없이 다크 색을 씁니다.
              child: Theme(
                data: ieumTheme(Brightness.dark),
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    // 키보드나 큰 글자로 사진 영역이 낮아지면 잘리지 않게 글과 동작 줄을 스크롤합니다.
                    final compact = constraints.maxHeight < MediaQuery.textScalerOf(context).scale(_overlayHeight);
                    Widget fit(Widget child, {bool fromBottom = false}) => compact
                        ? ConstrainedBox(
                            constraints: BoxConstraints(maxHeight: constraints.maxHeight),
                            child: SingleChildScrollView(reverse: fromBottom, child: child),
                          )
                        : child;
                    return Stack(
                      fit: StackFit.expand,
                      children: [
                        Semantics(
                          sortKey: const OrdinalSortKey(1),
                          child: post.images.isNotEmpty
                              ? ImageCarousel(images: post.images, authorNickname: post.author.nickname)
                              : ColoredBox(color: IeumColors.dark.surface),
                        ),
                        Positioned(left: 0, right: 0, bottom: 0, child: Semantics(sortKey: const OrdinalSortKey(0), child: fit(_overlay(post), fromBottom: true))),
                        Positioned(right: 0, bottom: 8, child: Semantics(sortKey: const OrdinalSortKey(2), child: fit(_rail(post)))),
                      ],
                    );
                  },
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    children: [
                      if (me != null) ...[
                        UserAvatar(nickname: me.nickname, url: me.avatarUrl, size: 32),
                        const SizedBox(width: 8),
                      ],
                      Expanded(child: _commentField(colors)),
                    ],
                  ),
                  if (_error != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Semantics(liveRegion: true, child: Text(_error!, style: TextStyle(color: colors.error))),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// 사진 아래쪽의 어두운 막과 작성자, 내용, 숫자입니다.
  Widget _overlay(Post post) {
    final colors = IeumColors.dark;
    return Stack(
      children: [
        Positioned.fill(
          // 막 위에서도 사진을 넘길 수 있게 합니다.
          child: IgnorePointer(
            child: Column(
              children: [
                const SizedBox(
                  height: _fade,
                  width: double.infinity,
                  child: DecoratedBox(decoration: BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Color(0x00000000), Color(0xB3000000)]))),
                ),
                const Expanded(
                  child: SizedBox(
                    width: double.infinity,
                    child: DecoratedBox(decoration: BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Color(0xB3000000), Color(0xCC000000)]))),
                  ),
                ),
              ],
            ),
          ),
        ),
        ConstrainedBox(
          constraints: const BoxConstraints(minHeight: 240, minWidth: double.infinity),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, _fade, 72, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.end,
              mainAxisSize: MainAxisSize.min,
              children: [
                _author(post, colors),
                Padding(
                  padding: const EdgeInsets.fromLTRB(0, 8, 0, 8),
                  child: Text(post.caption, maxLines: 3, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 14, height: 1.55, color: colors.text)),
                ),
                Text('좋아요 ${post.likeCount}개 · 댓글 ${post.commentCount}개', style: TextStyle(fontSize: 13, color: colors.text)),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _author(Post post, IeumColors colors) {
    return Semantics(
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
                          child: Text(post.author.nickname, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: colors.text)),
                        ),
                        if (post.author.isOfficial) ...[
                          const SizedBox(width: 4),
                          Icon(Icons.check_circle, size: 15, color: colors.official),
                        ],
                      ],
                    ),
                    Text('${timeAgo(post.createdAt)}${post.edited ? ' · 수정됨' : ''}', style: TextStyle(fontSize: 12, color: colors.text)),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// 오른쪽 세로 동작 줄입니다.
  Widget _rail(Post post) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Semantics(
          button: true,
          toggled: post.liked,
          label: '좋아요 ${post.likeCount}개',
          onTap: _like,
          excludeSemantics: true,
          // 사진 위라 색 대신 채운 아이콘과 글자 굵기로 눌린 상태를 보여 줍니다.
          child: _RailButton(icon: post.liked ? Icons.thumb_up : Icons.thumb_up_outlined, label: '좋아요', bold: post.liked, onTap: _like),
        ),
        Semantics(
          button: true,
          label: '댓글 보기',
          onTap: widget.onOpenPost,
          excludeSemantics: true,
          child: _RailButton(icon: Icons.chat_bubble_outline, label: '댓글 보기', onTap: widget.onOpenPost),
        ),
        // 수정, 삭제, 신고, 차단은 상세 화면(웹뷰)의 메뉴에서 합니다.
        IconButton(
          tooltip: '게시글 메뉴 열기',
          onPressed: widget.onOpenPost,
          constraints: const BoxConstraints(minWidth: 64, minHeight: 44),
          icon: Icon(Icons.more_vert, color: IeumColors.dark.text),
        ),
      ],
    );
  }

  /// 입력칸과 게시 버튼을 밑줄 하나로 묶습니다.
  Widget _commentField(IeumColors colors) {
    return DecoratedBox(
      decoration: BoxDecoration(border: Border(bottom: BorderSide(color: colors.control))),
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
                contentPadding: EdgeInsets.fromLTRB(0, 13, 4, 13),
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
              shape: const RoundedRectangleBorder(),
              textStyle: const TextStyle(fontFamily: 'Pretendard', fontWeight: FontWeight.w600, fontSize: 14),
            ),
            child: const Text('게시'),
          ),
        ],
      ),
    );
  }
}

class _RailButton extends StatelessWidget {
  const _RailButton({required this.icon, required this.label, required this.onTap, this.bold = false});

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool bold;

  @override
  Widget build(BuildContext context) {
    final color = IeumColors.dark.text;
    return InkWell(
      onTap: onTap,
      child: ConstrainedBox(
        constraints: const BoxConstraints(minWidth: 64, maxWidth: 64, minHeight: 56),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 24, color: color),
            const SizedBox(height: 2),
            Text(label, textAlign: TextAlign.center, style: TextStyle(fontSize: 11, height: 1.2, color: color, fontWeight: bold ? FontWeight.w600 : FontWeight.w400)),
          ],
        ),
      ),
    );
  }
}
