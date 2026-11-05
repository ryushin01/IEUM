import 'token_store.dart';

/// 웹뷰의 로그인·로그아웃을 앱 화면에 알립니다.
class ObservableTokenStore implements TokenStore {
  ObservableTokenStore(this._inner, this.onChanged);

  final TokenStore _inner;
  final void Function(bool loggedIn) onChanged;

  @override
  Future<Map<String, dynamic>?> read() => _inner.read();

  @override
  Future<void> write(Map<String, dynamic> tokens) async {
    await _inner.write(tokens);
    onChanged(true);
  }

  @override
  Future<void> clear() async {
    await _inner.clear();
    onChanged(false);
  }
}
