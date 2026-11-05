import 'package:flutter/services.dart';
import 'package:flutter_web_auth_2/flutter_web_auth_2.dart';

import '../bridge/bridge_error.dart';

/// 앱 ID와 같은 값입니다. AndroidManifest의 CallbackActivity, API의 APP_CALLBACK과 맞춥니다.
const socialCallbackScheme = 'com.ryushin01.ieum';

/// 시스템 인증 창으로 열어도 되는 제공자 주소입니다.
const socialLoginHosts = {'kauth.kakao.com', 'nid.naver.com', 'accounts.google.com', 'appleid.apple.com'};

abstract class SocialAuthService {
  /// 제공자 로그인을 마치고 돌아온 앱 스킴 주소를 돌려줍니다.
  Future<String> authenticate(Uri url);
}

/// Google이 웹뷰 안 로그인을 막으므로 ASWebAuthenticationSession, Custom Tabs를 씁니다.
class SystemSocialAuthService implements SocialAuthService {
  @override
  Future<String> authenticate(Uri url) async {
    try {
      return await FlutterWebAuth2.authenticate(url: url.toString(), callbackUrlScheme: socialCallbackScheme);
    } on PlatformException catch (error) {
      if (error.code == 'CANCELED') throw const BridgeException('cancelled', '로그인을 취소했습니다.');
      throw const BridgeException('social_failed', '로그인 창을 열지 못했습니다.');
    }
  }
}
