import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../app/theme.dart';
import '../data/models.dart';
import '../feed/post_card.dart';
import '../feed/time_ago.dart';
import '../shell/app_header.dart';
import 'conversations_controller.dart';

class DmListView extends StatelessWidget {
  const DmListView({super.key, required this.controller, required this.dark, required this.onToggleTheme, required this.onOpen, this.onWrite});

  final ConversationsController controller;
  final bool dark;
  final VoidCallback onToggleTheme;
  final void Function(String id) onOpen;
  final VoidCallback? onWrite;

  @override
  Widget build(BuildContext context) {
    final colors = IeumColors.of(context);
    return ColoredBox(
      color: colors.surface,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AppHeader(dark: dark, onToggleTheme: onToggleTheme, onWrite: onWrite),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 20, 16, 12),
            child: Semantics(
              header: true,
              child: Text(
                '메시지',
                style: TextStyle(fontSize: 26, fontWeight: FontWeight.w700, letterSpacing: -.5, color: colors.text),
              ),
            ),
          ),
          Expanded(
            child: Obx(() {
              final list = controller.conversations;
              if (list.isEmpty) {
                if (controller.loading.value) {
                  return Center(
                    child: Semantics(
                      label: '대화를 불러오는 중',
                      child: CircularProgressIndicator(color: colors.primary),
                    ),
                  );
                }
                final error = controller.error.value;
                return Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Semantics(
                          liveRegion: true,
                          child: Text(
                            error ?? '프로필에서 메시지를 보내 대화를 시작해 보세요.',
                            textAlign: TextAlign.center,
                            style: TextStyle(color: colors.muted),
                          ),
                        ),
                        if (error != null) ...[
                          const SizedBox(height: 16),
                          FilledButton(
                            onPressed: controller.reload,
                            style: FilledButton.styleFrom(minimumSize: const Size(44, 44)),
                            child: const Text('다시 시도'),
                          ),
                        ],
                      ],
                    ),
                  ),
                );
              }
              return RefreshIndicator(
                onRefresh: controller.reload,
                color: colors.onPrimary,
                backgroundColor: colors.primary,
                child: ListView.builder(
                  physics: const AlwaysScrollableScrollPhysics(),
                  itemCount: list.length,
                  itemBuilder: (context, i) => ConversationTile(conversation: list[i], onTap: () => onOpen(list[i].id)),
                ),
              );
            }),
          ),
        ],
      ),
    );
  }
}

class ConversationTile extends StatelessWidget {
  const ConversationTile({super.key, required this.conversation, required this.onTap});

  final ConversationSummary conversation;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = IeumColors.of(context);
    final c = conversation;
    final unreadLabel = c.unreadCount > 0 ? ', 읽지 않은 메시지 ${c.unreadCount}개' : '';
    return Semantics(
      button: true,
      label: '${c.other.nickname}, ${c.lastMessage}, ${timeAgo(c.lastMessageAt)}$unreadLabel',
      onTap: onTap,
      excludeSemantics: true,
      child: Material(
        color: colors.surface,
        shape: Border(bottom: BorderSide(color: colors.border)),
        child: InkWell(
          onTap: onTap,
          child: ConstrainedBox(
            constraints: const BoxConstraints(minHeight: 72),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              child: Row(
                children: [
                  UserAvatar(nickname: c.other.nickname, url: c.other.avatarUrl, size: 48),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                c.other.nickname,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(timeAgo(c.lastMessageAt), style: TextStyle(fontSize: 13, color: colors.muted)),
                          ],
                        ),
                        Text(
                          c.lastMessage,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(color: colors.muted),
                        ),
                      ],
                    ),
                  ),
                  if (c.unreadCount > 0) ...[
                    const SizedBox(width: 8),
                    Container(
                      constraints: const BoxConstraints(minWidth: 24),
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(color: colors.primary, borderRadius: BorderRadius.circular(12)),
                      child: Text(
                        '${c.unreadCount}',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: colors.onPrimary, fontWeight: FontWeight.w700, fontSize: 14),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
