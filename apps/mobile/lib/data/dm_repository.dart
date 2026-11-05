import 'models.dart';
import 'transport.dart';

abstract class DmRepository {
  Future<List<ConversationSummary>> fetchConversations();
  Future<ConversationInfo> fetchConversation(String id);
  Future<MessagePage> fetchMessages(String id, {String? cursor});
  Future<Message> send(String id, String body);
  Future<void> markRead(String id);
}

class ApiDmRepository implements DmRepository {
  const ApiDmRepository(this.transport);

  final ApiTransport transport;

  @override
  Future<List<ConversationSummary>> fetchConversations() async {
    final data = await transport.request('GET', '/conversations') as List<dynamic>;
    return data.map((e) => ConversationSummary.fromJson(Map<String, dynamic>.from(e as Map))).toList();
  }

  @override
  Future<ConversationInfo> fetchConversation(String id) async {
    final data = await transport.request('GET', '/conversations/$id') as Map;
    return ConversationInfo.fromJson(Map<String, dynamic>.from(data));
  }

  @override
  Future<MessagePage> fetchMessages(String id, {String? cursor}) async {
    final query = cursor == null ? '' : '?cursor=${Uri.encodeQueryComponent(cursor)}';
    final data = await transport.request('GET', '/conversations/$id/messages$query') as Map;
    return MessagePage(
      items: (data['items'] as List<dynamic>).map((e) => Message.fromJson(Map<String, dynamic>.from(e as Map))).toList(),
      nextCursor: data['nextCursor'] as String?,
    );
  }

  @override
  Future<Message> send(String id, String body) async {
    final data = await transport.request('POST', '/conversations/$id/messages', body: {'body': body}) as Map;
    return Message.fromJson(Map<String, dynamic>.from(data));
  }

  @override
  Future<void> markRead(String id) async {
    await transport.request('POST', '/conversations/$id/read');
  }
}
