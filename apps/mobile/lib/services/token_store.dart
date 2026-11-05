import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

abstract class TokenStore {
  Future<Map<String, dynamic>?> read();
  Future<void> write(Map<String, dynamic> tokens);
  Future<void> clear();
}

/// iOS Keychain, Android Keystore 기반 저장소에 로그인 토큰을 보관합니다.
class SecureTokenStore implements TokenStore {
  SecureTokenStore([FlutterSecureStorage? storage]) : _storage = storage ?? const FlutterSecureStorage();

  static const _key = 'ieum.tokens';
  final FlutterSecureStorage _storage;

  @override
  Future<Map<String, dynamic>?> read() async {
    final raw = await _storage.read(key: _key);
    if (raw == null) return null;
    return jsonDecode(raw) as Map<String, dynamic>;
  }

  @override
  Future<void> write(Map<String, dynamic> tokens) => _storage.write(key: _key, value: jsonEncode(tokens));

  @override
  Future<void> clear() => _storage.delete(key: _key);
}
