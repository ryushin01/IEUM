import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:webview_flutter/webview_flutter.dart';

import 'offline_view.dart';
import 'shell_controller.dart';

class ShellPage extends GetView<ShellController> {
  const ShellPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      final dark = controller.brightness.value == Brightness.dark;
      return AnnotatedRegion<SystemUiOverlayStyle>(
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
            backgroundColor: dark ? const Color(0xFF222222) : Colors.white,
            resizeToAvoidBottomInset: true,
            body: SafeArea(
              child: switch (controller.status.value) {
                ShellStatus.offline => OfflineView(onRetry: controller.load),
                _ => Stack(
                  children: [
                    WebViewWidget(controller: controller.webView),
                    if (controller.status.value == ShellStatus.loading) const Center(child: CircularProgressIndicator()),
                  ],
                ),
              },
            ),
          ),
        ),
      );
    });
  }
}
