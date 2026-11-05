import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';

import '../bridge/bridge_error.dart';

abstract class MediaService {
  /// 서버 없는 데모에서 쓰는 data URL 읽기입니다.
  Future<List<String>> read(List<String> fileIds);
  Future<List<String>> pick({required String source, required int maxCount});
  Future<List<String>> upload({
    required List<String> fileIds,
    required String accessToken,
    required Uri uploadUrl,
  });
}

/// 사진 선택과 업로드를 네이티브에서 처리합니다.
/// 선택과 업로드를 나눠, 고르는 동안 토큰이 만료돼도 다시 고르지 않고 재시도할 수 있습니다.
class NativeMediaService implements MediaService {
  NativeMediaService({ImagePicker? picker, Dio? dio})
    : _picker = picker ?? ImagePicker(),
      _dio = dio ?? Dio(BaseOptions(connectTimeout: const Duration(seconds: 15), sendTimeout: const Duration(minutes: 2)));

  static const _maxDimension = 1600.0;
  static const _quality = 85;

  final ImagePicker _picker;
  final Dio _dio;
  final _picked = <String, XFile>{};
  var _nextId = 0;

  @override
  Future<List<String>> pick({required String source, required int maxCount}) async {
    try {
      final files = await _select(source, maxCount);
      return files.map((file) {
        final id = 'f${_nextId++}';
        _picked[id] = file;
        return id;
      }).toList();
    } on PlatformException catch (error) {
      if (error.code.contains('access_denied')) {
        throw const BridgeException('permission_denied', '설정에서 사진 또는 카메라 권한을 허용해 주세요.');
      }
      if (error.code == 'no_available_camera') {
        throw const BridgeException('no_camera', '사용할 수 있는 카메라가 없습니다.');
      }
      throw const BridgeException('pick_failed', '사진을 가져오지 못했습니다.');
    }
  }

  @override
  Future<List<String>> read(List<String> fileIds) async {
    final urls = <String>[];
    for (final id in fileIds) {
      final file = _picked.remove(id);
      if (file == null) throw const BridgeException('file_not_found', '사진을 다시 선택해 주세요.');
      final bytes = await file.readAsBytes();
      final mime = file.mimeType ?? (file.name.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');
      urls.add('data:$mime;base64,${base64Encode(bytes)}');
    }
    return urls;
  }

  Future<List<XFile>> _select(String source, int maxCount) async {
    if (source == 'camera') {
      final file = await _picker.pickImage(source: ImageSource.camera, maxWidth: _maxDimension, maxHeight: _maxDimension, imageQuality: _quality);
      return file == null ? [] : [file];
    }
    if (maxCount <= 1) {
      final file = await _picker.pickImage(source: ImageSource.gallery, maxWidth: _maxDimension, maxHeight: _maxDimension, imageQuality: _quality);
      return file == null ? [] : [file];
    }
    final files = await _picker.pickMultiImage(limit: maxCount, maxWidth: _maxDimension, maxHeight: _maxDimension, imageQuality: _quality);
    return files.take(maxCount).toList();
  }

  @override
  Future<List<String>> upload({
    required List<String> fileIds,
    required String accessToken,
    required Uri uploadUrl,
  }) async {
    final urls = <String>[];
    for (final id in fileIds) {
      final file = _picked[id];
      if (file == null) throw const BridgeException('file_not_found', '사진을 다시 선택해 주세요.');
      try {
        final response = await _dio.postUri<Map<String, dynamic>>(
          uploadUrl,
          data: FormData.fromMap({'file': await MultipartFile.fromFile(file.path, filename: file.name)}),
          options: Options(headers: {'authorization': 'Bearer $accessToken'}),
        );
        urls.add(response.data!['url'] as String);
      } on DioException catch (error) {
        final status = error.response?.statusCode;
        if (status == 401) throw const BridgeException('unauthorized', '로그인이 만료되었습니다.');
        final body = error.response?.data;
        final message = body is Map && body['message'] is String ? body['message'] as String : '사진을 올리지 못했습니다. 네트워크를 확인해 주세요.';
        throw BridgeException('upload_failed', message);
      }
    }
    fileIds.forEach(_picked.remove);
    return urls;
  }
}
