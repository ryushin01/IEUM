import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:ieum/data/realtime.dart';

const messageJson = {
  'type': 'message',
  'message': {'id': 'm1', 'conversationId': 'c1', 'senderId': 'u', 'body': '안녕', 'readAt': null, 'createdAt': '2026-11-05T00:00:00Z'},
};

/// 실제 WebSocket 서버로 연결, 인증, 재연결을 검사합니다.
void main() {
  late HttpServer server;
  late List<String> tokensSeen;
  late List<WebSocket> sockets;
  late WebSocketRealtime realtime;
  late int refreshes;
  var refreshResult = true;
  var accepted = true;

  setUp(() async {
    tokensSeen = [];
    sockets = [];
    refreshes = 0;
    refreshResult = true;
    accepted = true;
    server = await HttpServer.bind(InternetAddress.loopbackIPv4, 0);
    server.listen((request) async {
      final socket = await WebSocketTransformer.upgrade(request);
      sockets.add(socket);
      socket.listen((data) {
        final json = jsonDecode(data as String) as Map<String, dynamic>;
        tokensSeen.add(json['token'] as String);
        if (accepted) {
          socket.add(jsonEncode({'type': 'ready'}));
        } else {
          accepted = true;
          socket.close(4401, 'unauthorized');
        }
      });
    });
    realtime = WebSocketRealtime(
      url: Uri.parse('ws://127.0.0.1:${server.port}/ws'),
      accessToken: () async => 'token-$refreshes',
      refreshToken: () async {
        refreshes++;
        return refreshResult;
      },
      baseDelay: const Duration(milliseconds: 20),
    );
  });

  tearDown(() async {
    realtime.stop();
    await server.close(force: true);
  });

  Future<void> until(bool Function() condition) async {
    for (var i = 0; i < 200 && !condition(); i++) {
      await Future<void>.delayed(const Duration(milliseconds: 10));
    }
    expect(condition(), isTrue);
  }

  test('토큰을 첫 메시지로 보내고 이벤트를 전달한다', () async {
    final events = <RealtimeEvent>[];
    realtime.events.listen(events.add);
    realtime.start();
    await until(() => tokensSeen.isNotEmpty);
    expect(tokensSeen, ['token-0']);
    sockets.single.add(jsonEncode(messageJson));
    await until(() => events.isNotEmpty);
    expect((events.single as MessageEvent).message.body, '안녕');
  });

  test('끊기면 다시 연결하고 놓친 메시지를 받도록 알린다', () async {
    final events = <RealtimeEvent>[];
    realtime.events.listen(events.add);
    realtime.start();
    await until(() => tokensSeen.length == 1);
    await Future<void>.delayed(const Duration(milliseconds: 20));
    await sockets.single.close(1000);
    await until(() => events.whereType<ReconnectedEvent>().isNotEmpty);
    expect(sockets.length, 2);
  });

  test('인증이 거부되면 재발급 후 새 토큰으로 연결한다', () async {
    accepted = false;
    realtime.start();
    await until(() => tokensSeen.length == 2);
    expect(refreshes, 1);
    expect(tokensSeen, ['token-0', 'token-1']);
  });

  test('세션이 끝났으면 다시 연결하지 않는다', () async {
    accepted = false;
    refreshResult = false;
    realtime.start();
    await until(() => refreshes == 1);
    await Future<void>.delayed(const Duration(milliseconds: 150));
    expect(sockets.length, 1);
  });

  test('멈추면 다시 연결하지 않는다', () async {
    realtime.start();
    await until(() => tokensSeen.length == 1);
    realtime.stop();
    await Future<void>.delayed(const Duration(milliseconds: 150));
    expect(sockets.length, 1);
  });
}
