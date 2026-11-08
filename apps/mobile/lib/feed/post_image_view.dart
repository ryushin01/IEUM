import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/material.dart';

import '../app/theme.dart';

/// 데모 그림은 앱에 포함한 파일로, 데모에서 올린 사진은 data URL로, 나머지는 네트워크로 표시합니다.
class PostImageView extends StatelessWidget {
  const PostImageView({super.key, required this.url, required this.label, this.fit = BoxFit.cover, this.alignment = Alignment.center});

  final String url;
  final String label;
  final BoxFit fit;
  final Alignment alignment;

  static final _demoArt = RegExp(r'/demo/([a-z]+)\.svg$');

  /// 같은 바이트 배열을 넘겨야 Flutter 이미지 캐시를 함께 씁니다. 사진의 앞면과 흐린 배경, 다시 그릴 때 모두 해당합니다.
  static final _decoded = <String, Uint8List>{};
  static const _maxDecoded = 20;

  static Uint8List _decode(String url) {
    final bytes = _decoded.remove(url) ?? base64Decode(url.substring(url.indexOf(',') + 1));
    // 다시 넣어 가장 최근에 쓴 항목으로 만들고, 가장 오래 쓰지 않은 항목부터 버립니다.
    _decoded[url] = bytes;
    if (_decoded.length > _maxDecoded) _decoded.remove(_decoded.keys.first);
    return bytes;
  }

  @override
  Widget build(BuildContext context) {
    final colors = IeumColors.of(context);
    Widget failed(BuildContext context, Object error, StackTrace? stack) => ColoredBox(
      color: colors.surface,
      child: Center(child: Icon(Icons.broken_image_outlined, color: colors.muted, semanticLabel: '사진을 불러오지 못했습니다')),
    );
    final demo = _demoArt.firstMatch(url);
    if (demo != null) {
      return Image.asset('assets/demo/${demo.group(1)}.jpg', fit: fit, alignment: alignment, semanticLabel: label, errorBuilder: failed);
    }
    if (url.startsWith('data:')) {
      return Image.memory(_decode(url), fit: fit, alignment: alignment, semanticLabel: label, errorBuilder: failed);
    }
    return Image.network(url, fit: fit, alignment: alignment, semanticLabel: label, errorBuilder: failed);
  }
}
