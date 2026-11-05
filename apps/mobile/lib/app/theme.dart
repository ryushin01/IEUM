import 'package:flutter/material.dart';

/// 웹의 sprout 팔레트와 같은 값입니다.
class IeumColors {
  static const lime = Color(0xFFC4E538);
  static const ink = Color(0xFF222222);
  static const paper = Color(0xFFFFFFFF);
}

ThemeData ieumTheme(Brightness brightness) {
  final dark = brightness == Brightness.dark;
  return ThemeData(
    useMaterial3: true,
    brightness: brightness,
    scaffoldBackgroundColor: dark ? IeumColors.ink : IeumColors.paper,
    colorScheme: ColorScheme.fromSeed(
      seedColor: IeumColors.lime,
      brightness: brightness,
      primary: IeumColors.lime,
      onPrimary: IeumColors.ink,
    ),
  );
}
