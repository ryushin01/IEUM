class BridgeException implements Exception {
  const BridgeException(this.code, this.message);

  final String code;
  final String message;
}
