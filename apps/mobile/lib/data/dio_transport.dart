import 'package:dio/dio.dart';

import '../services/token_store.dart';
import 'transport.dart';

/// 실제 API 요청입니다. 토큰 재발급은 웹뷰 요청까지 포함해 여기서만 합니다.
/// 재발급 토큰은 일회용이라 두 곳에서 동시에 쓰면 세션이 끊깁니다.
class DioTransport implements ApiTransport {
  DioTransport({required Uri baseUrl, required this.tokens, required this.onExpired, Dio? dio})
    : _dio = (dio ?? Dio())
        ..options.baseUrl = baseUrl.toString().replaceAll(RegExp(r'/$'), '')
        ..options.connectTimeout = const Duration(seconds: 15)
        ..options.receiveTimeout = const Duration(seconds: 20);

  final TokenStore tokens;
  final void Function() onExpired;
  final Dio _dio;
  Future<Map<String, dynamic>?>? _refreshing;

  @override
  Future<dynamic> request(String method, String path, {Object? body}) async {
    var stored = await tokens.read();
    var response = await _send(method, path, body, stored?['accessToken'] as String?);
    if (response.statusCode == 401 && stored != null) {
      stored = await refresh(stored['accessToken'] as String?);
      if (stored != null) response = await _send(method, path, body, stored['accessToken'] as String?);
    }
    final status = response.statusCode ?? 0;
    if (status >= 400) {
      final data = response.data;
      final message = data is Map && data['message'] is String ? data['message'] as String : '일시적인 오류가 발생했습니다.';
      throw ApiException(status, message);
    }
    return response.data;
  }

  Future<Response<dynamic>> _send(String method, String path, Object? body, String? token) async {
    try {
      return await _dio.request<dynamic>(
        path,
        data: body,
        options: Options(
          method: method,
          headers: {if (token != null) 'authorization': 'Bearer $token'},
          // 상태 코드는 위에서 직접 처리합니다.
          validateStatus: (_) => true,
        ),
      );
    } on DioException {
      throw const ApiException(0, '네트워크 연결을 확인해 주세요.');
    }
  }

  /// 새 토큰을 돌려줍니다. 재발급 토큰이 만료됐으면 세션을 지우고 null입니다.
  /// 그사이 이미 재발급됐다면([staleAccessToken]과 저장값이 다르면) 저장값을 돌려줍니다.
  Future<Map<String, dynamic>?> refresh(String? staleAccessToken) {
    return _refreshing ??= _refresh(staleAccessToken).whenComplete(() => _refreshing = null);
  }

  Future<Map<String, dynamic>?> _refresh(String? staleAccessToken) async {
    final stored = await tokens.read();
    if (stored == null) return null;
    if (staleAccessToken != null && stored['accessToken'] != staleAccessToken) return stored;
    final response = await _send('POST', '/auth/refresh', {'refreshToken': stored['refreshToken']}, null);
    if (response.statusCode == 401) {
      await tokens.clear();
      onExpired();
      return null;
    }
    // 서버 장애로는 로그아웃시키지 않습니다.
    if (response.statusCode != 200) throw const ApiException(503, '일시적인 오류가 발생했습니다.');
    final next = Map<String, dynamic>.from(response.data as Map);
    await tokens.write(next);
    return next;
  }
}
