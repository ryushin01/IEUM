import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ieum/data/demo_transport.dart';
import 'package:ieum/data/dio_transport.dart';
import 'package:ieum/data/transport.dart';
import 'package:ieum/services/token_store.dart';

class MemoryTokens implements TokenStore {
  MemoryTokens(this.value);
  Map<String, dynamic>? value;
  @override
  Future<void> clear() async => value = null;
  @override
  Future<Map<String, dynamic>?> read() async => value;
  @override
  Future<void> write(Map<String, dynamic> tokens) async => value = tokens;
}

/// 정해 둔 규칙대로 응답하는 가짜 서버입니다.
class FakeServer implements HttpClientAdapter {
  FakeServer(this.respond);
  final (int, Object?) Function(RequestOptions options) respond;
  final requests = <String>[];

  @override
  void close({bool force = false}) {}

  @override
  Future<ResponseBody> fetch(RequestOptions options, Stream<Uint8List>? requestStream, Future<void>? cancelFuture) async {
    requests.add('${options.method} ${options.path}');
    await Future<void>.delayed(Duration.zero);
    final (status, body) = respond(options);
    return ResponseBody.fromString(jsonEncode(body), status, headers: {
      Headers.contentTypeHeader: ['application/json'],
    });
  }
}

void main() {
  late MemoryTokens tokens;
  late List<String> expired;

  DioTransport transportFor(FakeServer server) {
    final dio = Dio()..httpClientAdapter = server;
    return DioTransport(baseUrl: Uri.parse('https://api.example.com/'), tokens: tokens, onExpired: () => expired.add('expired'), dio: dio);
  }

  setUp(() {
    tokens = MemoryTokens({'accessToken': 'old', 'refreshToken': 'r1'});
    expired = [];
  });

  group('DioTransport', () {
    FakeServer rotating() => FakeServer((options) {
      if (options.path == '/auth/refresh') return (200, {'accessToken': 'new', 'refreshToken': 'r2'});
      return options.headers['authorization'] == 'Bearer new' ? (200, {'ok': true}) : (401, {'message': '만료'});
    });

    test('동시에 만료돼도 재발급은 한 번만 하고 모두 재시도한다', () async {
      final server = rotating();
      final transport = transportFor(server);
      await Future.wait([transport.request('GET', '/a'), transport.request('GET', '/b')]);
      expect(server.requests.where((r) => r.contains('/auth/refresh')).length, 1);
      expect(tokens.value!['refreshToken'], 'r2');
    });

    test('웹뷰가 오래된 토큰으로 요청하면 재발급 없이 저장값을 준다', () async {
      tokens.value = {'accessToken': 'already-new', 'refreshToken': 'r2'};
      final server = rotating();
      final next = await transportFor(server).refresh('old');
      expect(next!['accessToken'], 'already-new');
      expect(server.requests, isEmpty);
    });

    test('재발급 토큰이 만료되면 세션을 지우고 알린다', () async {
      final transport = transportFor(FakeServer((_) => (401, {'message': '만료'})));
      await expectLater(transport.request('GET', '/a'), throwsA(isA<ApiException>().having((e) => e.status, 'status', 401)));
      expect(tokens.value, isNull);
      expect(expired, ['expired']);
    });

    test('재발급이 서버 오류면 로그아웃시키지 않는다', () async {
      final transport = transportFor(FakeServer((options) => options.path == '/auth/refresh' ? (500, {}) : (401, {})));
      await expectLater(transport.request('GET', '/a'), throwsA(isA<ApiException>()));
      expect(tokens.value, isNotNull);
      expect(expired, isEmpty);
    });

    test('서버의 안내 문구를 전달한다', () async {
      final transport = transportFor(FakeServer((_) => (400, {'message': '금칙어가 있습니다.'})));
      await expectLater(transport.request('POST', '/a'), throwsA(isA<ApiException>().having((e) => e.message, 'message', '금칙어가 있습니다.')));
    });
  });

  group('DemoTransport', () {
    test('웹이 준비된 뒤 목업으로 요청을 보내고 응답을 돌려준다', () async {
      final scripts = <String>[];
      final transport = DemoTransport(tokens: tokens, runJavaScript: (script) async => scripts.add(script));
      final pending = transport.request('GET', '/posts');
      await Future<void>.delayed(Duration.zero);
      expect(scripts, isEmpty);
      transport.markReady();
      await Future<void>.delayed(Duration.zero);
      await Future<void>.delayed(Duration.zero);
      expect(scripts.single, contains('/posts'));
      expect(scripts.single, contains('old'));
      transport.complete(1, 200, {'items': []});
      expect(await pending, {'items': []});
    });

    test('목업의 오류를 ApiException으로 바꾼다', () async {
      final transport = DemoTransport(tokens: tokens, runJavaScript: (_) async {})..markReady();
      final pending = transport.request('GET', '/posts');
      final expectation = expectLater(pending, throwsA(isA<ApiException>().having((e) => e.status, 'status', 403)));
      await Future<void>.delayed(Duration.zero);
      await Future<void>.delayed(Duration.zero);
      transport.complete(1, 403, {'message': '권한'});
      await expectation;
    });
  });
}
