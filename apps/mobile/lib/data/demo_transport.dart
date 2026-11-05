import 'dart:async';
import 'dart:convert';

import '../services/token_store.dart';
import 'transport.dart';

/// 서버 없는 데모의 요청을 웹뷰 안 목업 API로 보냅니다.
/// 데이터를 한 곳에 두어 Flutter 화면과 웹뷰 화면이 어긋나지 않습니다.
class DemoTransport implements ApiTransport {
  DemoTransport({required this.tokens, required this.runJavaScript});

  final TokenStore tokens;
  final Future<void> Function(String script) runJavaScript;

  final _ready = Completer<void>();
  final _pending = <int, Completer<dynamic>>{};
  var _nextId = 1;

  void markReady() {
    if (!_ready.isCompleted) _ready.complete();
  }

  @override
  Future<dynamic> request(String method, String path, {Object? body}) async {
    await _ready.future.timeout(const Duration(seconds: 20), onTimeout: () {
      throw const ApiException(0, '데모 화면을 불러오지 못했습니다.');
    });
    final id = _nextId++;
    final completer = Completer<dynamic>();
    _pending[id] = completer;
    final stored = await tokens.read();
    final payload = jsonEncode({
      'requestId': id,
      'method': method,
      'path': path,
      'body': body,
      'token': stored?['accessToken'],
    });
    await runJavaScript('window.__ieumNative.demoRequest($payload)');
    return completer.future.timeout(const Duration(seconds: 15), onTimeout: () {
      _pending.remove(id);
      throw const ApiException(0, '데모 요청 시간이 초과되었습니다.');
    });
  }

  void complete(int requestId, int status, dynamic body) {
    final completer = _pending.remove(requestId);
    if (completer == null) return;
    if (status >= 400) {
      final message = body is Map && body['message'] is String ? body['message'] as String : '일시적인 오류가 발생했습니다.';
      completer.completeError(ApiException(status, message));
    } else {
      completer.complete(body);
    }
  }
}
