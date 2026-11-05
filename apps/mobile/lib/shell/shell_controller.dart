import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../app/config.dart';
import '../bridge/bridge_router.dart';
import '../services/media_service.dart';
import '../services/social_auth_service.dart';
import '../services/token_store.dart';
import 'navigation_policy.dart';

enum ShellStatus { loading, ready, offline }

class ShellController extends GetxController {
  ShellController({required this.config});

  final AppConfig config;
  final status = ShellStatus.loading.obs;
  final brightness = PlatformDispatcher.instance.platformBrightness.obs;

  late final WebViewController webView;
  late final BridgeRouter _router;
  DateTime? _lastBackPress;

  @override
  void onInit() {
    super.onInit();
    _router = BridgeRouter(
      config: config,
      tokens: SecureTokenStore(),
      media: NativeMediaService(),
      socialAuth: SystemSocialAuthService(),
      platform: Platform.isIOS ? 'ios' : 'android',
      onThemeChanged: _setTheme,
      onHaptic: HapticFeedback.lightImpact,
    );
    webView = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(_background)
      ..addJavaScriptChannel('IeumBridge', onMessageReceived: (message) => _onBridgeMessage(message.message))
      ..setNavigationDelegate(
        NavigationDelegate(
          onNavigationRequest: _onNavigationRequest,
          onPageFinished: (_) {
            if (status.value == ShellStatus.loading) status.value = ShellStatus.ready;
          },
          onWebResourceError: (error) {
            if (error.isForMainFrame ?? true) status.value = ShellStatus.offline;
          },
        ),
      );
    load();
  }

  Color get _background => brightness.value == Brightness.dark ? const Color(0xFF222222) : Colors.white;

  void load() {
    status.value = ShellStatus.loading;
    webView.loadRequest(config.webUrl);
  }

  Future<NavigationDecision> _onNavigationRequest(NavigationRequest request) async {
    final target = Uri.tryParse(request.url);
    if (target == null) return NavigationDecision.prevent;
    switch (decideNavigation(target, config.webUrl)) {
      case NavigationAction.allowInWebView:
        return NavigationDecision.navigate;
      case NavigationAction.openExternally:
        await launchUrl(target, mode: LaunchMode.externalApplication);
        return NavigationDecision.prevent;
      case NavigationAction.block:
        return NavigationDecision.prevent;
    }
  }

  Future<void> _onBridgeMessage(String raw) async {
    if (!isTrustedPage(await webView.currentUrl(), config.webUrl)) return;
    final reply = await _router.handle(raw);
    if (reply == null) return;
    await webView.runJavaScript('window.__ieumBridgeReceive(${jsonEncode(reply)})');
  }

  void _setTheme(String mode) {
    brightness.value = mode == 'dark' ? Brightness.dark : Brightness.light;
    webView.setBackgroundColor(_background);
  }

  /// Android 뒤로 가기: 웹 기록을 먼저 되돌리고, 첫 화면에서는 두 번 눌러야 종료합니다.
  Future<void> onBackPressed() async {
    if (await webView.canGoBack()) {
      await webView.goBack();
      return;
    }
    final now = DateTime.now();
    final last = _lastBackPress;
    if (last != null && now.difference(last) < const Duration(seconds: 2)) {
      await SystemNavigator.pop();
      return;
    }
    _lastBackPress = now;
    Get.closeAllSnackbars();
    Get.rawSnackbar(message: '한 번 더 누르면 종료합니다.', duration: const Duration(seconds: 2));
  }
}
