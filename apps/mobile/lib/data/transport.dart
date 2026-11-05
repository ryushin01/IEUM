class ApiException implements Exception {
  const ApiException(this.status, this.message);

  /// 0이면 네트워크 오류입니다.
  final int status;
  final String message;

  @override
  String toString() => message;
}

/// 저장소는 요청이 실제 API로 가는지 데모 목업으로 가는지 모릅니다.
abstract class ApiTransport {
  Future<dynamic> request(String method, String path, {Object? body});
}
