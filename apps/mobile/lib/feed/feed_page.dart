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
  final PageController scrollController;
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
        AppHeader(dark: widget.dark, onToggleTheme: widget.onToggleTheme, onWrite: () => widget.onOpenPath('/posts/new'), screenTitle: '피드'),
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
      // 키보드가 올라와도 PageView는 보던 게시글을 유지합니다.
      child: PageView.builder(
        controller: widget.scrollController,
        scrollDirection: Axis.vertical,
        physics: const AlwaysScrollableScrollPhysics(),
        // 스크린 리더가 다음 게시글로 넘어갈 수 있게 미리 만들어 둡니다.
        allowImplicitScrolling: true,
        itemCount: posts.length + (controller.hasMore ? 1 : 0),
        itemBuilder: (context, index) {
          if (index >= posts.length) {
            return Center(child: CircularProgressIndicator(color: IeumColors.of(context).primary));
          }
          // 좋아요처럼 글 하나만 바뀌어도 다시 그리도록 여기서 읽습니다.
          return Obx(() {
            if (index >= posts.length) return const SizedBox.shrink();
            final post = posts[index];
            return PostCard(
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
          });
        },
      ),
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
