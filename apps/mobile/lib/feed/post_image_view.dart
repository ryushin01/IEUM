import 'dart:convert';

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
      return Image.memory(base64Decode(url.substring(url.indexOf(',') + 1)), fit: fit, alignment: alignment, semanticLabel: label, errorBuilder: failed);
    }
    return Image.network(url, fit: fit, alignment: alignment, semanticLabel: label, errorBuilder: failed);
  }
}
