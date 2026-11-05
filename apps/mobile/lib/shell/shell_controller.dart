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
import '../data/demo_transport.dart';
import '../data/dm_repository.dart';
import '../data/dio_transport.dart';
import '../data/models.dart';
import '../data/post_repository.dart';
import '../data/realtime.dart';
import '../data/transport.dart';
import '../dm/chat_controller.dart';
import '../dm/conversations_controller.dart';
import '../feed/feed_controller.dart';
import '../services/observable_token_store.dart';
import '../services/media_service.dart';
import '../services/social_auth_service.dart';
import '../services/token_store.dart';
import 'bottom_menu.dart';
import 'navigation_policy.dart';
import 'route_rules.dart';

enum ShellStatus { loading, ready, offline }

class ShellController extends GetxController with WidgetsBindingObserver {
  ShellController({required this.config});

  final AppConfig config;
  final status = ShellStatus.loading.obs;
  final brightness = PlatformDispatcher.instance.platformBrightness.obs;

  /// 웹뷰가 알려 준 현재 경로입니다. 어떤 화면을 위에 올릴지 정합니다.
  final path = '/'.obs;
  final loggedIn = false.obs;
  final sessionChecked = false.obs;
  final me = Rxn<Me>();
  final feedScroll = ScrollController();

  late final WebViewController webView;
  late final BridgeRouter _router;
  late final ObservableTokenStore _tokens;
  late final ApiTransport _transport;
  late final FeedController feed;
  late final DmRepository dm;
  late final RealtimeSource realtime;
  late final ConversationsController conversations;

  bool get showFeed => loggedIn.value && isHomePath(path.value);
  bool get showChatList => loggedIn.value && isChatList(path.value);
  String? get chatId => loggedIn.value ? chatIdOf(path.value) : null;
  bool get showFlutterScreen => loggedIn.value && isFlutterPath(path.value);
  bool get showMenu => loggedIn.value && !isGuestPath(path.value) && !isChatRoom(path.value);
  MenuTab get tab => tabForPath(path.value);
  DateTime? _lastBackPress;

  @override
  void onInit() {
    super.onInit();
    _tokens = ObservableTokenStore(SecureTokenStore(), _onSessionChanged);
    _transport = config.demoMode
        ? DemoTransport(tokens: _tokens, runJavaScript: (script) => webView.runJavaScript(script))
        : DioTransport(baseUrl: config.apiUrl, tokens: _tokens, onExpired: () => _callWeb('sessionExpired()'));
    feed = FeedController(ApiPostRepository(_transport));
    dm = ApiDmRepository(_transport);
    final transport = _transport;
    realtime = transport is DioTransport
        ? WebSocketRealtime(
            url: config.apiUrl.replace(scheme: config.apiUrl.scheme == 'https' ? 'wss' : 'ws', path: '/ws'),
            accessToken: () async => (await _tokens.read())?['accessToken'] as String?,
            refreshToken: () async => await transport.refresh((await _tokens.read())?['accessToken'] as String?) != null,
          )
        : DemoRealtime();
    conversations = ConversationsController(dm, realtime);
    WidgetsBinding.instance.addObserver(this);
    _router = BridgeRouter(
      config: config,
      tokens: _tokens,
      media: NativeMediaService(),
      socialAuth: SystemSocialAuthService(),
      platform: Platform.isIOS ? 'ios' : 'android',
      tokenRefresher: _refreshForWeb,
      onUiEvent: _onUiEvent,
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
    _restoreSession();
    ever(path, (_) {
      // 웹뷰에서 글을 쓰거나 지웠을 수 있어 돌아오면 새로 받습니다.
      if (showFeed) feed.reload();
      if (showChatList) conversations.reload();
    });
  }

  Future<void> _restoreSession() async {
    final stored = await _tokens.read().catchError((_) => null);
    loggedIn.value = stored != null;
    sessionChecked.value = true;
    if (stored != null) _onLoggedIn();
  }

  void _onSessionChanged(bool value) {
    final wasLoggedIn = loggedIn.value;
    loggedIn.value = value;
    if (value && !wasLoggedIn) {
      _onLoggedIn();
    } else if (!value) {
      me.value = null;
      feed.posts.clear();
      realtime.stop();
      conversations.stopListening();
    }
  }

  void _onLoggedIn() {
    feed.reload();
    _loadMe();
    conversations
      ..startListening()
      ..reload();
    realtime.start();
  }

  /// 대화방마다 새로 만듭니다.
  ChatController createChat(String id) =>
      ChatController(conversationId: id, repository: dm, realtime: realtime, onRead: conversations.reload);

  /// 대화방의 뒤로 가기입니다.
  Future<void> goBack() async {
    if (await webView.canGoBack()) {
      await webView.goBack();
    } else {
      openPath('/dm');
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed && loggedIn.value) realtime.reconnectNow();
  }

  Future<void> _loadMe() async {
    try {
      me.value = await feed.repository.fetchMe();
    } on Exception {
      // 메뉴에는 기본 아이콘을 보여 줍니다.
    }
  }

  Future<Map<String, dynamic>?> _refreshForWeb(String? stale) async {
    final transport = _transport;
    if (transport is DioTransport) return transport.refresh(stale);
    return null;
  }

  void _onUiEvent(String method, Map<String, dynamic> params) {
    switch (method) {
      case 'ui.ready':
        final transport = _transport;
        if (transport is DemoTransport) transport.markReady();
      case 'ui.routeChanged':
        final next = params['path'] as String;
        if (path.value != next) {
          path.value = next;
          // 프로필 사진을 바꾸고 돌아올 수 있습니다.
          if (loggedIn.value && next == '/me') _loadMe();
        }
    }
  }

  Future<void> _callWeb(String call) async {
    try {
      await webView.runJavaScript('window.__ieumNative && window.__ieumNative.$call');
    } on Exception {
      // 웹이 아직 준비되지 않았으면 다음 동작에서 맞춰집니다.
    }
  }

  /// 앱 화면에서 웹뷰 화면으로 이동합니다.
  void openPath(String target) {
    path.value = target;
    _callWeb('navigate(${jsonEncode(target)})');
  }

  void selectTab(MenuTab selected) => openPath(pathForTab(selected));

  void scrollToTop() {
    if (showFeed) {
      if (feedScroll.hasClients) feedScroll.jumpTo(0);
      return;
    }
    _callWeb('scrollTop()');
  }

  void toggleTheme() => _callWeb('toggleTheme()');

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
    if (_handleDemoMessage(raw)) return;
    final reply = await _router.handle(raw);
    if (reply == null) return;
    await webView.runJavaScript('window.__ieumBridgeReceive(${jsonEncode(reply)})');
  }

  /// 데모 목업의 응답과 실시간 이벤트는 기다리는 쪽으로 바로 넘깁니다.
  bool _handleDemoMessage(String raw) {
    final transport = _transport;
    final source = realtime;
    if (transport is! DemoTransport || source is! DemoRealtime) return false;
    if (!raw.contains('"demo.')) return false;
    final message = jsonDecode(raw) as Map<String, dynamic>;
    final method = message['method'];
    if (method != 'demo.reply' && method != 'demo.event') return false;
    final params = message['params'] as Map<String, dynamic>;
    if (method == 'demo.reply') {
      transport.complete(params['requestId'] as int, params['status'] as int, params['body']);
    } else {
      source.receive(Map<String, dynamic>.from(params['event'] as Map));
    }
    return true;
  }

  void _setTheme(String mode) {
    brightness.value = mode == 'dark' ? Brightness.dark : Brightness.light;
    webView.setBackgroundColor(_background);
  }

  /// Android 뒤로 가기: 웹 기록을 먼저 되돌리고, 첫 화면에서는 두 번 눌러야 종료합니다.
  Future<void> onBackPressed() async {
    if (!showFeed && await webView.canGoBack()) {
      await webView.goBack();
      return;
    }
    if (!showFeed && loggedIn.value) {
      openPath('/');
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

  @override
  void onClose() {
    WidgetsBinding.instance.removeObserver(this);
    realtime.stop();
    feedScroll.dispose();
    super.onClose();
  }
}
