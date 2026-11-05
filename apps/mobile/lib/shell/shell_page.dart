import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../app/theme.dart';

import '../dm/chat_screen.dart';
import '../dm/dm_list_view.dart';
import '../feed/feed_page.dart';
import 'bottom_menu.dart';
import 'offline_view.dart';
import 'shell_controller.dart';

class ShellPage extends GetView<ShellController> {
  const ShellPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      final dark = controller.brightness.value == Brightness.dark;
      // 앱 화면도 웹에서 고른 테마를 따릅니다.
      return Theme(data: ieumTheme(controller.brightness.value), child: AnnotatedRegion<SystemUiOverlayStyle>(
        // 투명하게 두어 앱 배경색이 상태 표시줄까지 이어지게 합니다.
        value: (dark ? SystemUiOverlayStyle.light : SystemUiOverlayStyle.dark).copyWith(
          statusBarColor: Colors.transparent,
          systemNavigationBarColor: dark ? const Color(0xFF222222) : Colors.white,
        ),
        child: PopScope(
          canPop: false,
          onPopInvokedWithResult: (didPop, _) {
            if (!didPop) controller.onBackPressed();
          },
          child: Scaffold(
            backgroundColor: dark ? IeumColors.ink : IeumColors.paper,
            resizeToAvoidBottomInset: true,
            body: SafeArea(
              child: switch (controller.status.value) {
                ShellStatus.offline when !controller.showFlutterScreen => OfflineView(onRetry: controller.load),
                _ => Column(
                  children: [
                    Expanded(
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          // 웹뷰는 항상 살려 두고, 홈에서는 Flutter 피드를 위에 올립니다.
                          WebViewWidget(controller: controller.webView),
                          if (controller.status.value == ShellStatus.loading && !controller.showFlutterScreen)
                            const Center(child: CircularProgressIndicator()),
                          if (controller.showFlutterScreen)
                            ColoredBox(
                              color: dark ? IeumColors.ink : IeumColors.paper,
                              child: _flutterScreen(dark),
                            ),
                        ],
                      ),
                    ),
                    // 키보드가 열리면 입력 공간을 위해 메뉴를 숨깁니다.
                    if (controller.showMenu && MediaQuery.viewInsetsOf(context).bottom == 0)
                      BottomMenu(
                        tab: controller.tab,
                        unread: controller.conversations.unread,
                        me: controller.me.value,
                        onSelect: controller.selectTab,
                        onScrollTop: controller.scrollToTop,
                      ),
                  ],
                ),
              },
            ),
          ),
        ),
      ));
    });
  }

  /// 경로에 맞는 Flutter 화면입니다.
  Widget _flutterScreen(bool dark) {
    final chatId = controller.chatId;
    if (chatId != null) {
      return ChatScreen(
        key: ValueKey(chatId),
        conversationId: chatId,
        myId: controller.me.value?.id ?? '',
        dark: dark,
        create: controller.createChat,
        onToggleTheme: controller.toggleTheme,
        onBack: controller.goBack,
        onOpenProfile: (id) => controller.openPath('/users/$id'),
      );
    }
    if (controller.showChatList) {
      return DmListView(
        controller: controller.conversations,
        dark: dark,
        onToggleTheme: controller.toggleTheme,
        onOpen: (id) => controller.openPath('/dm/$id'),
      );
    }
    return FeedView(
      controller: controller.feed,
      me: controller.me,
      scrollController: controller.feedScroll,
      dark: dark,
      onToggleTheme: controller.toggleTheme,
      onOpenPath: controller.openPath,
    );
  }
}
