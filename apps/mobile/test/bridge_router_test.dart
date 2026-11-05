import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:ieum/app/config.dart';
import 'package:ieum/bridge/bridge_error.dart';
import 'package:ieum/bridge/bridge_router.dart';
import 'package:ieum/services/media_service.dart';
import 'package:ieum/services/social_auth_service.dart';
import 'package:ieum/services/token_store.dart';

class FakeTokens implements TokenStore {
  Map<String, dynamic>? value;
  @override
  Future<void> clear() async => value = null;
  @override
  Future<Map<String, dynamic>?> read() async => value;
  @override
  Future<void> write(Map<String, dynamic> tokens) async => value = tokens;
}

class FakeMedia implements MediaService {
  String? usedToken;
  BridgeException? pickError;
  @override
  Future<List<String>> pick({required String source, required int maxCount}) async {
    if (pickError != null) throw pickError!;
    return ['f0'];
  }

  @override
  Future<List<String>> upload({required List<String> fileIds, required String accessToken, required Uri uploadUrl}) async {
    usedToken = accessToken;
    return ['https://api.example.com/uploads/a.png'];
  }
}

class FakeSocialAuth implements SocialAuthService {
  Uri? opened;
  BridgeException? error;
  @override
  Future<String> authenticate(Uri url) async {
    if (error != null) throw error!;
    opened = url;
    return 'com.ryushin01.ieum://auth?code=abc';
  }
}

void main() {
  late FakeSocialAuth social;
  late FakeTokens tokens;
  late FakeMedia media;
  late BridgeRouter router;
  String? theme;
  var haptics = 0;

  Future<Map<String, dynamic>?> call(String method, [Map<String, dynamic>? params]) =>
      router.handle(jsonEncode({'id': 7, 'method': method, 'params': params}));

  setUp(() {
    tokens = FakeTokens();
    media = FakeMedia();
    social = FakeSocialAuth();
    theme = null;
    haptics = 0;
    router = BridgeRouter(
      config: AppConfig(webUrl: Uri.parse('https://app.example.com'), apiUrl: Uri.parse('https://api.example.com')),
      tokens: tokens,
      media: media,
      socialAuth: social,
      platform: 'ios',
      onThemeChanged: (mode) => theme = mode,
      onHaptic: () => haptics++,
    );
  });

  test('토큰을 저장하고 읽고 지운다', () async {
    expect((await call('auth.getTokens'))!['result'], isNull);
    await call('auth.setTokens', {'accessToken': 'a', 'refreshToken': 'r'});
    expect((await call('auth.getTokens'))!['result'], {'accessToken': 'a', 'refreshToken': 'r'});
    await call('auth.clearTokens');
    expect(tokens.value, isNull);
  });

  test('요청 번호를 그대로 돌려준다', () async {
    final reply = await call('app.getInfo');
    expect(reply!['id'], 7);
    expect(reply['ok'], true);
    expect(reply['result']['platform'], 'ios');
  });

  test('설정된 API가 아닌 곳으로는 토큰을 보내지 않는다', () async {
    final reply = await call('media.upload', {
      'fileIds': ['f0'],
      'accessToken': 'secret',
      'uploadUrl': 'https://evil.example.com/uploads',
    });
    expect(reply!['ok'], false);
    expect(reply['error']['code'], 'forbidden_host');
    expect(media.usedToken, isNull);
  });

  test('설정된 API로는 업로드한다', () async {
    final reply = await call('media.upload', {
      'fileIds': ['f0'],
      'accessToken': 'secret',
      'uploadUrl': 'https://api.example.com/uploads',
    });
    expect(reply!['result']['urls'], ['https://api.example.com/uploads/a.png']);
    expect(media.usedToken, 'secret');
  });

  test('권한 거부 같은 오류를 코드와 함께 전달한다', () async {
    media.pickError = const BridgeException('permission_denied', '권한 필요');
    final reply = await call('media.pick', {'source': 'camera', 'maxCount': 1});
    expect(reply!['error'], {'code': 'permission_denied', 'message': '권한 필요'});
  });

  test('잘못된 값은 예외 없이 오류로 응답한다', () async {
    expect((await call('auth.setTokens', {'accessToken': 1}))!['error']['code'], 'invalid_params');
    expect((await call('ui.setTheme', {'mode': 'blue'}))!['ok'], false);
    expect((await call('없는.메서드'))!['error']['code'], 'unknown_method');
  });

  test('읽을 수 없는 메시지는 무시한다', () async {
    expect(await router.handle('not json'), isNull);
    expect(await router.handle('{"method":"app.getInfo"}'), isNull);
  });

  test('허용한 제공자 주소만 시스템 인증 창으로 연다', () async {
    for (final url in [
      'https://kauth.kakao.com/oauth/authorize?x=1',
      'https://nid.naver.com/oauth2.0/authorize',
      'https://accounts.google.com/o/oauth2/v2/auth',
    ]) {
      final reply = await call('auth.socialLogin', {'url': url});
      expect(reply!['result'], {'callbackUrl': 'com.ryushin01.ieum://auth?code=abc'});
    }
    social.opened = null;
    for (final url in ['https://evil.example.com', 'http://nid.naver.com/oauth2.0/authorize', 'https://accounts.google.com.evil.io/']) {
      final reply = await call('auth.socialLogin', {'url': url});
      expect(reply!['error']['code'], 'forbidden_host');
    }
    expect(social.opened, isNull);
  });

  test('사용자가 취소하면 cancelled를 돌려준다', () async {
    social.error = const BridgeException('cancelled', '취소');
    final reply = await call('auth.socialLogin', {'url': 'https://nid.naver.com/oauth2.0/authorize'});
    expect(reply!['error']['code'], 'cancelled');
  });

  test('테마와 진동을 앱에 전달한다', () async {
    await call('ui.setTheme', {'mode': 'dark'});
    await call('ui.haptic');
    expect(theme, 'dark');
    expect(haptics, 1);
  });
}
