import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../app/theme.dart';
import '../data/models.dart';
import '../feed/post_card.dart';
import '../feed/time_ago.dart';
import '../shell/app_header.dart';
import 'chat_controller.dart';

class ChatView extends StatefulWidget {
  const ChatView({
    super.key,
    required this.controller,
    required this.myId,
    required this.dark,
    required this.onToggleTheme,
    required this.onBack,
    required this.onOpenProfile,
  });

  final ChatController controller;
  final String myId;
  final bool dark;
  final VoidCallback onToggleTheme;
  final VoidCallback onBack;
  final void Function(String userId) onOpenProfile;

  @override
  State<ChatView> createState() => _ChatViewState();
}

class _ChatViewState extends State<ChatView> {
  final _input = TextEditingController();
  final _scroll = ScrollController();

  @override
  void initState() {
    super.initState();
    _scroll.addListener(() {
      // 거꾸로 된 목록이라 끝이 오래된 메시지입니다.
      if (_scroll.position.pixels > _scroll.position.maxScrollExtent - 200) widget.controller.loadOlder();
    });
  }

  @override
  void dispose() {
    _input.dispose();
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    if (await widget.controller.send(_input.text)) {
      _input.clear();
      setState(() {});
      if (_scroll.hasClients) _scroll.jumpTo(0);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = IeumColors.of(context);
    final controller = widget.controller;
    return Column(
      children: [
        AppHeader(dark: widget.dark, onToggleTheme: widget.onToggleTheme, onBack: widget.onBack),
        Obx(() {
          final other = controller.info.value?.other;
          if (other == null) return const SizedBox.shrink();
          return DecoratedBox(
            decoration: BoxDecoration(
              color: colors.surface,
              borderRadius: const BorderRadius.vertical(bottom: Radius.circular(24)),
              boxShadow: [BoxShadow(color: colors.shadow, blurRadius: 8, offset: const Offset(0, 2))],
            ),
            child: Semantics(
              button: true,
              header: true,
              label: '${other.nickname} 님의 프로필 보기. 신고와 차단은 프로필에서 할 수 있습니다.',
              onTap: () => widget.onOpenProfile(other.id),
              excludeSemantics: true,
              child: InkWell(
                onTap: () => widget.onOpenProfile(other.id),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                  child: Row(
                    children: [
                      UserAvatar(nickname: other.nickname, url: other.avatarUrl, size: 32),
                      const SizedBox(width: 8),
                      Expanded(child: Text(other.nickname, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700))),
                      Icon(Icons.more_vert, color: colors.text),
                    ],
                  ),
                ),
              ),
            ),
          );
        }),
        Expanded(
          child: Obx(() {
            if (controller.loading.value && controller.messages.isEmpty) {
              return Center(child: Semantics(label: '대화를 불러오는 중', child: CircularProgressIndicator(color: colors.primary)));
            }
            final error = controller.error.value;
            if (error != null && controller.messages.isEmpty) {
              return Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Semantics(liveRegion: true, child: Text(error, style: TextStyle(color: colors.muted))),
                    const SizedBox(height: 16),
                    FilledButton(
                      onPressed: controller.load,
                      style: FilledButton.styleFrom(minimumSize: const Size(44, 44)),
                      child: const Text('다시 시도'),
                    ),
                  ],
                ),
              );
            }
            final messages = controller.messages;
            return ListView.separated(
              controller: _scroll,
              reverse: true,
              padding: const EdgeInsets.all(12),
              itemCount: messages.length,
              separatorBuilder: (_, _) => const SizedBox(height: 10),
              itemBuilder: (context, i) {
                final message = messages[i];
                // 가장 새로 받은 메시지를 낭독합니다.
                return MessageBubble(message: message, mine: message.senderId == widget.myId, announce: i == 0);
              },
            );
          }),
        ),
        Obx(() {
          final info = controller.info.value;
          if (info == null) return const SizedBox.shrink();
          if (!info.canSend) {
            return Padding(
              padding: const EdgeInsets.all(12),
              child: Text('메시지를 보낼 수 없는 사용자입니다.', style: TextStyle(color: colors.muted)),
            );
          }
          final sendError = controller.sendError.value;
          return DecoratedBox(
            decoration: BoxDecoration(
              color: colors.surface,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
              boxShadow: [BoxShadow(color: colors.shadow, blurRadius: 16, offset: const Offset(0, -4))],
            ),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (sendError != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 6),
                      child: Semantics(liveRegion: true, child: Text(sendError, style: TextStyle(color: colors.error))),
                    ),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _input,
                          maxLength: 1000,
                          minLines: 1,
                          maxLines: 4,
                          onChanged: (_) => setState(() {}),
                          decoration: const InputDecoration(hintText: '메시지를 입력하세요', counterText: ''),
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton.filled(
                        tooltip: '보내기',
                        onPressed: _input.text.trim().isEmpty || controller.sending.value ? null : _send,
                        constraints: const BoxConstraints(minWidth: 44, minHeight: 44),
                        style: IconButton.styleFrom(
                          backgroundColor: colors.primary,
                          foregroundColor: colors.onPrimary,
                          disabledBackgroundColor: colors.bg,
                          disabledForegroundColor: colors.muted,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                        icon: const Icon(Icons.send),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
        }),
      ],
    );
  }
}

class MessageBubble extends StatelessWidget {
  const MessageBubble({super.key, required this.message, required this.mine, this.announce = false});

  final Message message;
  final bool mine;
  final bool announce;

  @override
  Widget build(BuildContext context) {
    final colors = IeumColors.of(context);
    final read = mine && message.readAt != null;
    const radius = Radius.circular(20);
    return Semantics(
      liveRegion: announce && !mine,
      label: '${mine ? '내가 보낸 메시지' : '받은 메시지'}: ${message.body}, ${timeAgo(message.createdAt)}${read ? ', 읽음' : ''}',
      excludeSemantics: true,
      child: Column(
        crossAxisAlignment: mine ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          ConstrainedBox(
            constraints: BoxConstraints(maxWidth: MediaQuery.sizeOf(context).width * .78),
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: mine ? colors.primary : colors.bubbleOther,
                borderRadius: BorderRadius.only(
                  topLeft: radius,
                  topRight: radius,
                  bottomLeft: mine ? radius : const Radius.circular(6),
                  bottomRight: mine ? const Radius.circular(6) : radius,
                ),
              ),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 12),
                child: Text(message.body, style: TextStyle(color: mine ? colors.onPrimary : colors.text, fontSize: 16, fontWeight: FontWeight.w500)),
              ),
            ),
          ),
          const SizedBox(height: 2),
          Text('${timeAgo(message.createdAt)}${read ? ' · 읽음' : ''}', style: TextStyle(fontSize: 12, color: colors.muted)),
        ],
      ),
    );
  }
}
