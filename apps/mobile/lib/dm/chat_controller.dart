import 'dart:async';

import 'package:get/get.dart';

import '../data/dm_repository.dart';
import '../data/models.dart';
import '../data/realtime.dart';

class ChatController extends GetxController {
  ChatController({required this.conversationId, required this.repository, required this.realtime, required this.onRead});

  final String conversationId;
  final DmRepository repository;
  final RealtimeSource realtime;

  /// 읽음 처리 후 안 읽은 수를 새로 받습니다.
  final void Function() onRead;

  final info = Rxn<ConversationInfo>();

  /// 최신순입니다. 화면은 reverse 목록으로 표시합니다.
  final messages = <Message>[].obs;
  final loading = true.obs;
  final loadingOlder = false.obs;
  final sending = false.obs;
  final error = RxnString();
  final sendError = RxnString();
  String? _cursor;
  StreamSubscription<RealtimeEvent>? _subscription;

  bool get hasOlder => _cursor != null;

  @override
  void onInit() {
    super.onInit();
    _subscription = realtime.events.listen(_onEvent);
    load();
  }

  @override
  void onClose() {
    _subscription?.cancel();
    super.onClose();
  }

  Future<void> load() async {
    loading.value = true;
    error.value = null;
    try {
      final results = await Future.wait([repository.fetchConversation(conversationId), repository.fetchMessages(conversationId)]);
      info.value = results[0] as ConversationInfo;
      final page = results[1] as MessagePage;
      messages.assignAll(page.items);
      _cursor = page.nextCursor;
      await _markRead();
    } on Exception catch (e) {
      error.value = e.toString();
    } finally {
      loading.value = false;
    }
  }

  Future<void> loadOlder() async {
    final cursor = _cursor;
    if (cursor == null || loadingOlder.value) return;
    loadingOlder.value = true;
    try {
      final page = await repository.fetchMessages(conversationId, cursor: cursor);
      _insertAll(page.items);
      _cursor = page.nextCursor;
    } on Exception {
      // 다시 올리면 또 시도합니다.
    } finally {
      loadingOlder.value = false;
    }
  }

  /// 성공하면 true입니다. 실패하면 입력 내용을 남기도록 false입니다.
  Future<bool> send(String text) async {
    final body = text.trim();
    if (body.isEmpty || sending.value) return false;
    sending.value = true;
    sendError.value = null;
    try {
      _add(await repository.send(conversationId, body));
      return true;
    } on Exception catch (e) {
      sendError.value = e.toString();
      return false;
    } finally {
      sending.value = false;
    }
  }

  void _onEvent(RealtimeEvent event) {
    switch (event) {
      case MessageEvent(:final message) when message.conversationId == conversationId:
        _add(message);
        if (message.senderId == info.value?.other.id) _markRead();
      case ReadEvent(conversationId: final id) when id == conversationId:
        final now = DateTime.now();
        final otherId = info.value?.other.id;
        // toList: assignAll이 목록을 먼저 비우므로 지연 평가하면 모두 사라집니다.
        messages.assignAll(messages.map((m) => m.senderId == otherId ? m : m.markedRead(now)).toList());
      case ReconnectedEvent():
        load();
      default:
    }
  }

  /// 보낸 응답과 소켓 이벤트가 겹쳐도 한 번만 넣습니다.
  void _add(Message message) {
    if (messages.any((m) => m.id == message.id)) return;
    messages.insert(0, message);
  }

  void _insertAll(List<Message> older) {
    final known = messages.map((m) => m.id).toSet();
    messages.addAll(older.where((m) => !known.contains(m.id)));
  }

  Future<void> _markRead() async {
    final otherId = info.value?.other.id;
    if (!messages.any((m) => m.senderId == otherId && m.readAt == null)) return;
    try {
      await repository.markRead(conversationId);
      final now = DateTime.now();
      messages.assignAll(messages.map((m) => m.senderId == otherId ? m.markedRead(now) : m).toList());
      onRead();
    } on Exception {
      // 다음에 열 때 다시 처리합니다.
    }
  }
}
