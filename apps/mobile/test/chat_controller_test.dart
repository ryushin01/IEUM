import 'dart:async';


import 'package:flutter_test/flutter_test.dart';
import 'package:ieum/data/dm_repository.dart';
import 'package:ieum/data/models.dart';
import 'package:ieum/data/realtime.dart';
import 'package:ieum/data/transport.dart';
import 'package:ieum/dm/chat_controller.dart';

const me = 'me';
const peer = 'peer';

Message msg(String id, {String sender = peer, DateTime? readAt}) =>
    Message(id: id, conversationId: 'c1', senderId: sender, body: '본문 $id', createdAt: DateTime(2026), readAt: readAt);

class FakeDm implements DmRepository {
  final pages = <String?, MessagePage>{};
  final sent = <String>[];
  Exception? sendFailure;
  var reads = 0;
  var loads = 0;
  Completer<void>? sendGate;

  @override
  Future<ConversationInfo> fetchConversation(String id) async =>
      ConversationInfo(id: id, other: const PostAuthor(id: peer, nickname: '하늘빛'), canSend: true);

  @override
  Future<List<ConversationSummary>> fetchConversations() async => [];

  @override
  Future<MessagePage> fetchMessages(String id, {String? cursor}) async {
    loads++;
    return pages[cursor]!;
  }

  @override
  Future<void> markRead(String id) async => reads++;

  @override
  Future<Message> send(String id, String body) async {
    await sendGate?.future;
    if (sendFailure != null) throw sendFailure!;
    sent.add(body);
    return msg('sent-${sent.length}', sender: me);
  }
}

class FakeRealtime implements RealtimeSource {
  final _events = StreamController<RealtimeEvent>.broadcast();
  void emit(RealtimeEvent event) => _events.add(event);

  @override
  Stream<RealtimeEvent> get events => _events.stream;
  @override
  void reconnectNow() {}
  @override
  void start() {}
  @override
  void stop() {}
}

void main() {
  late FakeDm dm;
  late FakeRealtime realtime;
  late ChatController chat;
  late int readCallbacks;

  setUp(() async {
    dm = FakeDm()..pages[null] = MessagePage(items: [msg('m2'), msg('m1')], nextCursor: 'older');
    dm.pages['older'] = MessagePage(items: [msg('m0')]);
    realtime = FakeRealtime();
    readCallbacks = 0;
    chat = ChatController(conversationId: 'c1', repository: dm, realtime: realtime, onRead: () => readCallbacks++)..onInit();
    await pumpEventQueue();
  });

  tearDown(() => chat.onClose());

  test('열면 최신순으로 보여 주고 읽음 처리한다', () {
    expect(chat.messages.map((m) => m.id), ['m2', 'm1']);
    expect(dm.reads, 1);
    expect(readCallbacks, 1);
    expect(chat.messages.every((m) => m.readAt != null), isTrue);
  });

  test('이전 메시지를 뒤에 이어 붙이고 끝나면 멈춘다', () async {
    await chat.loadOlder();
    expect(chat.messages.map((m) => m.id), ['m2', 'm1', 'm0']);
    expect(chat.hasOlder, isFalse);
    final before = dm.loads;
    await chat.loadOlder();
    expect(dm.loads, before);
  });

  test('보낸 응답과 소켓 이벤트가 겹쳐도 한 번만 넣는다', () async {
    expect(await chat.send(' 안녕 '), isTrue);
    expect(dm.sent, ['안녕']);
    realtime.emit(MessageEvent(msg('sent-1', sender: me)));
    await pumpEventQueue();
    expect(chat.messages.where((m) => m.id == 'sent-1').length, 1);
    expect(chat.messages.first.id, 'sent-1');
  });

  test('받은 메시지는 바로 표시하고 읽음 처리한다', () async {
    final reads = dm.reads;
    realtime.emit(MessageEvent(msg('m3')));
    await pumpEventQueue();
    expect(chat.messages.first.id, 'm3');
    expect(dm.reads, reads + 1);
  });

  test('다른 대화의 메시지는 넣지 않는다', () async {
    realtime.emit(MessageEvent(Message(id: 'x', conversationId: 'other', senderId: peer, body: '다른 대화', createdAt: DateTime(2026))));
    await pumpEventQueue();
    expect(chat.messages.any((m) => m.id == 'x'), isFalse);
  });

  test('상대가 읽으면 내 메시지에 읽음을 표시한다', () async {
    await chat.send('안녕');
    expect(chat.messages.first.readAt, isNull);
    realtime.emit(const ReadEvent('c1'));
    await pumpEventQueue();
    expect(chat.messages.first.readAt, isNotNull);
  });

  test('다시 연결되면 놓친 메시지를 받아 온다', () async {
    final before = dm.loads;
    dm.pages[null] = MessagePage(items: [msg('m9'), msg('m2'), msg('m1')]);
    realtime.emit(const ReconnectedEvent());
    await pumpEventQueue();
    expect(dm.loads, before + 1);
    expect(chat.messages.first.id, 'm9');
  });

  test('보내는 중에 다시 보내도 한 번만 보낸다', () async {
    dm.sendGate = Completer<void>();
    final first = chat.send('안녕');
    expect(await chat.send('안녕'), isFalse);
    dm.sendGate!.complete();
    expect(await first, isTrue);
    expect(dm.sent.length, 1);
  });

  test('실패하면 안내하고 false를 돌려준다', () async {
    dm.sendFailure = const ApiException(403, '메시지를 보낼 수 없는 사용자입니다.');
    expect(await chat.send('안녕'), isFalse);
    expect(chat.sendError.value, '메시지를 보낼 수 없는 사용자입니다.');
  });

  test('빈 메시지는 보내지 않는다', () async {
    expect(await chat.send('   '), isFalse);
    expect(dm.sent, isEmpty);
  });
}
