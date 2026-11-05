import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ieum/shell/offline_view.dart';

void main() {
  testWidgets('다시 시도를 누르면 콜백을 호출한다', (tester) async {
    var retried = 0;
    await tester.pumpWidget(MaterialApp(home: Scaffold(body: OfflineView(onRetry: () => retried++))));
    expect(find.text('연결할 수 없습니다'), findsOneWidget);
    await tester.tap(find.text('다시 시도'));
    expect(retried, 1);
  });
}
