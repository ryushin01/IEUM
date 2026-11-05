import 'dart:convert';

import '../app/config.dart';
import '../services/media_service.dart';
import '../services/social_auth_service.dart';
import '../services/token_store.dart';
import 'bridge_error.dart';

/// 웹에서 온 요청을 처리해 응답을 돌려줍니다. 계약은 docs/bridge.md에 있습니다.
class BridgeRouter {
  BridgeRouter({
    required this.config,
    required this.tokens,
    required this.media,
    required this.socialAuth,
    required this.platform,
    required this.tokenRefresher,
    required this.onUiEvent,
    required this.onThemeChanged,
    required this.onHaptic,
  });

  final AppConfig config;
  final TokenStore tokens;
  final MediaService media;
  final SocialAuthService socialAuth;
  final String platform;
  final Future<Map<String, dynamic>?> Function(String? staleAccessToken) tokenRefresher;

  /// 화면 이동, 안 읽은 수처럼 앱 화면에 알리는 이벤트입니다.
  final void Function(String method, Map<String, dynamic> params) onUiEvent;
  final void Function(String mode) onThemeChanged;
  final void Function() onHaptic;

  /// 항상 JSON으로 인코딩 가능한 응답을 돌려줍니다. id를 읽을 수 없으면 null입니다.
  Future<Map<String, dynamic>?> handle(String raw) async {
    final Map<String, dynamic> request;
    final Object? id;
    try {
      request = jsonDecode(raw) as Map<String, dynamic>;
      id = request['id'];
      if (id is! int) return null;
    } on Object {
      return null;
    }
    try {
      final params = request['params'];
      final result = await _dispatch(request['method'], params is Map<String, dynamic> ? params : const {});
      return {'id': id, 'ok': true, 'result': result};
    } on BridgeException catch (error) {
      return _failure(id, error.code, error.message);
    } on TypeError {
      return _failure(id, 'invalid_params', '요청 값이 올바르지 않습니다.');
    } on Object {
      return _failure(id, 'internal', '앱에서 요청을 처리하지 못했습니다.');
    }
  }

  Map<String, dynamic> _failure(int id, String code, String message) => {
    'id': id,
    'ok': false,
    'error': {'code': code, 'message': message},
  };

  Future<Object?> _dispatch(Object? method, Map<String, dynamic> params) async {
    switch (method) {
      case 'app.getInfo':
        return {'platform': platform, 'version': AppConfig.appVersion, 'build': AppConfig.appBuild};
      case 'auth.getTokens':
        return tokens.read();
      case 'auth.setTokens':
        await tokens.write({
          'accessToken': params['accessToken'] as String,
          'refreshToken': params['refreshToken'] as String,
        });
        return null;
      case 'auth.clearTokens':
        await tokens.clear();
        return null;
      case 'auth.refresh':
        return tokenRefresher(params['staleAccessToken'] as String?);
      case 'ui.ready':
      case 'ui.routeChanged':
        onUiEvent(method as String, params);
        return null;
      case 'auth.socialLogin':
        final url = Uri.parse(params['url'] as String);
        // 페이지가 임의의 주소를 인증 창으로 열지 못하게 합니다.
        if (url.scheme != 'https' || !socialLoginHosts.contains(url.host)) {
          throw const BridgeException('forbidden_host', '허용되지 않은 로그인 주소입니다.');
        }
        return {'callbackUrl': await socialAuth.authenticate(url)};
      case 'media.pick':
        final fileIds = await media.pick(source: params['source'] as String, maxCount: params['maxCount'] as int);
        return {'fileIds': fileIds};
      case 'media.upload':
        final uploadUrl = Uri.parse(params['uploadUrl'] as String);
        // 토큰이 다른 서버로 나가지 않도록 설정된 API로만 보냅니다.
        if (uploadUrl.origin != config.apiUrl.origin) {
          throw const BridgeException('forbidden_host', '허용되지 않은 업로드 주소입니다.');
        }
        final urls = await media.upload(
          fileIds: (params['fileIds'] as List<dynamic>).cast<String>(),
          accessToken: params['accessToken'] as String,
          uploadUrl: uploadUrl,
        );
        return {'urls': urls};
      case 'media.read':
        return {'dataUrls': await media.read((params['fileIds'] as List<dynamic>).cast<String>())};
      case 'ui.setTheme':
        final mode = params['mode'] as String;
        if (mode != 'light' && mode != 'dark') throw TypeError();
        onThemeChanged(mode);
        return null;
      case 'ui.haptic':
        onHaptic();
        return null;
      default:
        throw const BridgeException('unknown_method', '지원하지 않는 기능입니다. 앱을 업데이트해 주세요.');
    }
  }
}
