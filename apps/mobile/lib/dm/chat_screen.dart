import 'package:flutter/material.dart';

import 'chat_controller.dart';
import 'chat_view.dart';

/// 대화방에 머무는 동안만 컨트롤러를 유지합니다.
class ChatScreen extends StatefulWidget {
  const ChatScreen({
    super.key,
    required this.conversationId,
    required this.myId,
    required this.dark,
    required this.create,
    required this.onToggleTheme,
    required this.onBack,
    required this.onOpenProfile,
  });

  final String conversationId;
  final String myId;
  final bool dark;
  final ChatController Function(String id) create;
  final VoidCallback onToggleTheme;
  final VoidCallback onBack;
  final void Function(String userId) onOpenProfile;

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  late final ChatController _controller;

  @override
  void initState() {
    super.initState();
    _controller = widget.create(widget.conversationId)..onInit();
  }

  @override
  void dispose() {
    _controller.onClose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ChatView(
      controller: _controller,
      myId: widget.myId,
      dark: widget.dark,
      onToggleTheme: widget.onToggleTheme,
      onBack: widget.onBack,
      onOpenProfile: widget.onOpenProfile,
    );
  }
}
