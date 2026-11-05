import 'bottom_menu.dart';

const _guestPrefixes = ['/login', '/signup', '/forgot-password', '/reset-password', '/auth/', '/terms', '/privacy'];

/// 로그인 전 화면에서는 하단 메뉴를 숨기고 웹뷰만 보여 줍니다.
bool isGuestPath(String path) => _guestPrefixes.any(path.startsWith);

/// 대화방은 입력창이 아래에 있어 하단 메뉴를 숨깁니다.
bool isChatRoom(String path) => RegExp(r'^/dm/[^/]+').hasMatch(path);

bool isHomePath(String path) => path == '/' || path.isEmpty;

MenuTab tabForPath(String path) {
  if (isHomePath(path)) return MenuTab.home;
  if (path == '/posts/new') return MenuTab.write;
  if (path.startsWith('/dm')) return MenuTab.messages;
  if (path.startsWith('/me') || path.startsWith('/settings') || path.startsWith('/admin')) return MenuTab.me;
  return MenuTab.none;
}

String pathForTab(MenuTab tab) => switch (tab) {
  MenuTab.home => '/',
  MenuTab.me => '/me',
  MenuTab.write => '/posts/new',
  MenuTab.messages => '/dm',
  MenuTab.none => '/',
};
