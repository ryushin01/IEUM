import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../app/theme.dart';
import '../data/models.dart';
import '../shell/app_header.dart';
import 'feed_controller.dart';
import 'post_card.dart';

class FeedView extends StatefulWidget {
  const FeedView({
    super.key,
    required this.controller,
    required this.me,
    required this.scrollController,
    required this.dark,
    required this.onToggleTheme,
    required this.onOpenPath,
  });

  final FeedController controller;
  final Rxn<Me> me;
  final ScrollController scrollController;
  final bool dark;
  final VoidCallback onToggleTheme;
  final void Function(String path) onOpenPath;

  @override
  State<FeedView> createState() => _FeedViewState();
}

class _FeedViewState extends State<FeedView> {
  @override
  void initState() {
    super.initState();
    widget.scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    widget.scrollController.removeListener(_onScroll);
    super.dispose();
  }

  void _onScroll() {
    final position = widget.scrollController.position;
    if (position.pixels > position.maxScrollExtent - 600) widget.controller.loadMore();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        AppHeader(dark: widget.dark, onToggleTheme: widget.onToggleTheme, onWrite: () => widget.onOpenPath('/posts/new')),
        Expanded(child: Obx(_buildBody)),
      ],
    );
  }

  Widget _buildBody() {
    final controller = widget.controller;
    final posts = controller.posts;
    if (posts.isEmpty) {
      if (controller.loading.value) {
        return Center(child: Semantics(label: '게시글을 불러오는 중', child: CircularProgressIndicator(color: IeumColors.of(context).primary)));
      }
      final error = controller.error.value;
      return _Message(
        text: error ?? '아직 게시글이 없습니다.',
        actionLabel: error == null ? '첫 게시글 올리기' : '다시 시도',
        onAction: error == null ? () => widget.onOpenPath('/posts/new') : controller.reload,
      );
    }
    return RefreshIndicator(
      onRefresh: controller.reload,
      color: IeumColors.of(context).onPrimary,
      backgroundColor: IeumColors.of(context).primary,
      child: ListView.builder(
        controller: widget.scrollController,
        physics: const AlwaysScrollableScrollPhysics(),
        itemCount: posts.length + (controller.hasMore ? 1 : 0),
        itemBuilder: (context, index) {
          if (index >= posts.length) {
            return Padding(padding: const EdgeInsets.all(24), child: Center(child: CircularProgressIndicator(color: IeumColors.of(context).primary)));
          }
          // 좋아요처럼 글 하나만 바뀌어도 다시 그리도록 여기서 읽습니다.
          return Obx(() {
            if (index >= posts.length) return const SizedBox.shrink();
            final post = posts[index];
            final card = PostCard(
              key: ValueKey(post.id),
              post: post,
              me: widget.me.value,
              onLike: () async {
                final messenger = ScaffoldMessenger.maybeOf(context);
                final error = await controller.toggleLike(post);
                if (error != null) messenger?.showSnackBar(SnackBar(content: Text(error)));
              },
              onSubmitComment: (body) => controller.addComment(post, body),
              onOpenPost: () => widget.onOpenPath('/posts/${post.id}'),
              onOpenAuthor: () => widget.onOpenPath('/users/${post.author.id}'),
            );
            return index == 0 ? _Hero(child: card) : card;
          });
        },
      ),
    );
  }
}

/// 굵은 문구가 있는 피드 상단입니다. 첫 글 위에 흰 구획으로 놓입니다.
class _Hero extends StatelessWidget {
  const _Hero({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final colors = IeumColors.of(context);
    const style = TextStyle(fontSize: 26, height: 1.35, fontWeight: FontWeight.w700, letterSpacing: -.5);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          color: colors.surface,
          margin: const EdgeInsets.only(bottom: IeumColors.band),
          padding: const EdgeInsets.fromLTRB(16, 20, 16, 24),
          child: Semantics(
            header: true,
            child: Text.rich(
              TextSpan(
                style: style.copyWith(color: colors.text),
                children: [
                  const TextSpan(text: '오늘은 누구와\n'),
                  TextSpan(text: '이어져 볼까요?', style: TextStyle(color: colors.primary)),
                ],
              ),
            ),
          ),
        ),
        child,
      ],
    );
  }
}

class _Message extends StatelessWidget {
  const _Message({required this.text, required this.actionLabel, required this.onAction});

  final String text;
  final String actionLabel;
  final VoidCallback onAction;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Semantics(liveRegion: true, child: Text(text, textAlign: TextAlign.center, style: TextStyle(color: IeumColors.of(context).muted))),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: onAction,
              style: FilledButton.styleFrom(minimumSize: const Size(44, 44)),
              child: Text(actionLabel),
            ),
          ],
        ),
      ),
    );
  }
}
