import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'models.dart';

sealed class RealtimeEvent {
  const RealtimeEvent();

  static RealtimeEvent? fromJson(Map<String, dynamic> json) => switch (json['type']) {
    'message' => MessageEvent(Message.fromJson(Map<String, dynamic>.from(json['message'] as Map))),
    'read' => ReadEvent(json['conversationId'] as String),
    _ => null,
  };
}

class MessageEvent extends RealtimeEvent {
  const MessageEvent(this.message);
  final Message message;
}

class ReadEvent extends RealtimeEvent {
  const ReadEvent(this.conversationId);
  final String conversationId;
}

/// 끊겼다 다시 연결되면 놓친 메시지를 받아 오도록 알립니다.
class ReconnectedEvent extends RealtimeEvent {
  const ReconnectedEvent();
}

abstract class RealtimeSource {
  Stream<RealtimeEvent> get events;
  void start();
  void stop();

  /// 앱이 화면으로 돌아왔을 때 기다리지 않고 바로 연결합니다.
  void reconnectNow();
}

/// 받기 전용 소켓입니다. 토큰은 주소가 아니라 첫 메시지로 보냅니다.
class WebSocketRealtime implements RealtimeSource {
  WebSocketRealtime({
    required this.url,
    required this.accessToken,
    required this.refreshToken,
    this.maxDelay = const Duration(seconds: 30),
    this.baseDelay = const Duration(seconds: 1),
  });

  final Uri url;
  final Future<String?> Function() accessToken;

  /// 인증이 거부되면 부릅니다. 세션이 끝났으면 false입니다.
  final Future<bool> Function() refreshToken;
  final Duration maxDelay;
  final Duration baseDelay;

  final _events = StreamController<RealtimeEvent>.broadcast();
  WebSocket? _socket;
  Timer? _timer;
  var _attempts = 0;
  var _running = false;
  var _connectedBefore = false;
  var _generation = 0;

  @override
  Stream<RealtimeEvent> get events => _events.stream;

  @override
  void start() {
    if (_running) return;
    _running = true;
    _connect();
  }

  @override
  void stop() {
    _running = false;
    _generation++;
    _connectedBefore = false;
    _timer?.cancel();
    _socket?.close();
    _socket = null;
  }

  @override
  void reconnectNow() {
    if (!_running || _socket != null) return;
    _timer?.cancel();
    _attempts = 0;
    _connect();
  }

  Future<void> _connect() async {
    final generation = ++_generation;
    try {
      final token = await accessToken();
      if (token == null || generation != _generation) return;
      final socket = await WebSocket.connect(url.toString()).timeout(const Duration(seconds: 15));
      if (generation != _generation) {
        await socket.close();
        return;
      }
      _socket = socket;
      socket.add(jsonEncode({'type': 'auth', 'token': token}));
      socket.listen(
        _onData,
        onDone: () => _onClosed(socket, generation),
        onError: (_) {},
        cancelOnError: false,
      );
    } on Exception {
      if (generation == _generation) _schedule();
    }
  }

  void _onData(dynamic data) {
    final json = jsonDecode(data as String) as Map<String, dynamic>;
    if (json['type'] == 'ready') {
      _attempts = 0;
      if (_connectedBefore) _events.add(const ReconnectedEvent());
      _connectedBefore = true;
      return;
    }
    final event = RealtimeEvent.fromJson(json);
    if (event != null) _events.add(event);
  }

  Future<void> _onClosed(WebSocket socket, int generation) async {
    if (generation != _generation) return;
    _socket = null;
    if (socket.closeCode == 4401) {
      final refreshed = await refreshToken().catchError((_) => true);
      if (!refreshed || generation != _generation) return;
    }
    _schedule();
  }

  void _schedule() {
    if (!_running) return;
    final delay = baseDelay * (1 << _attempts.clamp(0, 5));
    _attempts++;
    _timer = Timer(delay > maxDelay ? maxDelay : delay, _connect);
  }
}

/// 데모: 웹 목업이 만든 이벤트를 브릿지로 받습니다.
class DemoRealtime implements RealtimeSource {
  final _events = StreamController<RealtimeEvent>.broadcast();

  @override
  Stream<RealtimeEvent> get events => _events.stream;

  void receive(Map<String, dynamic> json) {
    final event = RealtimeEvent.fromJson(json);
    if (event != null) _events.add(event);
  }

  @override
  void start() {}
  @override
  void stop() {}
  @override
  void reconnectNow() {}
}
