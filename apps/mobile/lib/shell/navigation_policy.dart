enum NavigationAction { allowInWebView, openExternally, block }

/// 웹뷰에는 우리 웹만 띄우고, 메일과 외부 https는 시스템 앱으로 넘깁니다.
NavigationAction decideNavigation(Uri target, Uri webOrigin) {
  if ((target.scheme == 'http' || target.scheme == 'https') && target.origin == webOrigin.origin) {
    return NavigationAction.allowInWebView;
  }
  if (target.scheme == 'about' && target.path == 'blank') return NavigationAction.allowInWebView;
  if (target.scheme == 'mailto' || target.scheme == 'https') return NavigationAction.openExternally;
  return NavigationAction.block;
}

/// 브릿지는 우리 웹이 열려 있을 때만 응답합니다.
bool isTrustedPage(String? currentUrl, Uri webOrigin) {
  if (currentUrl == null) return false;
  final uri = Uri.tryParse(currentUrl);
  return uri != null && (uri.scheme == 'http' || uri.scheme == 'https') && uri.origin == webOrigin.origin;
}
