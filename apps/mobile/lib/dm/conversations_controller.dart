import 'dart:async';

import 'package:get/get.dart';

import '../data/dm_repository.dart';
import '../data/models.dart';
import '../data/realtime.dart';

class ConversationsController extends GetxController {
  ConversationsController(this.repository, this.realtime);

  final DmRepository repository;
  final RealtimeSource realtime;

  final conversations = <ConversationSummary>[].obs;
  final loading = false.obs;
  final error = RxnString();
  StreamSubscription<RealtimeEvent>? _subscription;

  int get unread => conversations.fold(0, (sum, c) => sum + c.unreadCount);

  void startListening() {
    _subscription ??= realtime.events.listen((event) {
      if (event is! ReadEvent) reload();
    });
  }

  void stopListening() {
    _subscription?.cancel();
    _subscription = null;
    conversations.clear();
    error.value = null;
  }

  Future<void> reload() async {
    loading.value = true;
    error.value = null;
    try {
      conversations.assignAll(await repository.fetchConversations());
    } on Exception catch (e) {
      error.value = e.toString();
    } finally {
      loading.value = false;
    }
  }
}
