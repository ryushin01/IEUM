import 'package:flutter_test/flutter_test.dart';
import 'package:ieum/feed/time_ago.dart';
import 'package:ieum/shell/bottom_menu.dart';
import 'package:ieum/shell/route_rules.dart';

void main() {
  test('경로에 맞는 메뉴를 고른다', () {
    expect(tabForPath('/'), MenuTab.home);
    expect(tabForPath('/posts/new'), MenuTab.write);
    expect(tabForPath('/dm/abc'), MenuTab.messages);
    expect(tabForPath('/settings/blocks'), MenuTab.me);
    expect(tabForPath('/posts/abc'), MenuTab.none);
  });

  test('로그인 전 화면과 대화방에서는 메뉴를 숨긴다', () {
    expect(isGuestPath('/login'), isTrue);
    expect(isGuestPath('/auth/callback'), isTrue);
    expect(isGuestPath('/settings'), isFalse);
    expect(isChatRoom('/dm/abc'), isTrue);
    expect(isChatRoom('/dm'), isFalse);
  });

  test('웹과 같은 규칙으로 시간을 표시한다', () {
    final now = DateTime(2026, 11, 5, 12);
    expect(timeAgo(now.subtract(const Duration(seconds: 30)), now: now), '방금 전');
    expect(timeAgo(now.subtract(const Duration(minutes: 30)), now: now), '30분 전');
    expect(timeAgo(now.subtract(const Duration(hours: 3)), now: now), '3시간 전');
    expect(timeAgo(now.subtract(const Duration(days: 3)), now: now), '3일 전');
    expect(timeAgo(DateTime(2026, 10, 1), now: now), '2026년 10월 1일');
  });
}
