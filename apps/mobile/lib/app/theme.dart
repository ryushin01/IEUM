import 'package:flutter/material.dart';

/// 웹의 sprout 팔레트(apps/web/src/shared/theme/theme.css.ts)와 같은 값입니다.
class IeumColors {
  const IeumColors({
    required this.bg,
    required this.surface,
    required this.text,
    required this.muted,
    required this.border,
    required this.like,
    required this.error,
  });

  static const lime = Color(0xFFC4E538);
  static const ink = Color(0xFF222222);
  static const paper = Color(0xFFFFFFFF);
  static const official = Color(0xFF2E86DE);

  static const light = IeumColors(
    bg: paper,
    surface: Color(0xFFFAFAFA),
    text: ink,
    muted: Color(0xFF666666),
    border: Color(0xFFE0E0E0),
    like: Color(0xFFD63A2A),
    error: Color(0xFFBB2649),
  );
  static const dark = IeumColors(
    bg: ink,
    surface: Color(0xFF2C2C2C),
    text: paper,
    muted: Color(0xFFCCCCCC),
    border: Color(0xFF4D4D4D),
    like: Color(0xFFFF7B6B),
    error: Color(0xFFFF9DB1),
  );

  final Color bg;
  final Color surface;
  final Color text;
  final Color muted;
  final Color border;
  final Color like;
  final Color error;

  static IeumColors of(BuildContext context) => Theme.of(context).brightness == Brightness.dark ? dark : light;
}

ThemeData ieumTheme(Brightness brightness) {
  final colors = brightness == Brightness.dark ? IeumColors.dark : IeumColors.light;
  return ThemeData(
    useMaterial3: true,
    brightness: brightness,
    fontFamily: 'Stylish',
    scaffoldBackgroundColor: colors.bg,
    colorScheme: ColorScheme.fromSeed(
      seedColor: IeumColors.lime,
      brightness: brightness,
      primary: IeumColors.lime,
      onPrimary: IeumColors.ink,
      surface: colors.bg,
      onSurface: colors.text,
      error: colors.error,
    ),
    inputDecorationTheme: InputDecorationTheme(
      isDense: true,
      hintStyle: TextStyle(color: colors.muted),
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(4), borderSide: BorderSide(color: colors.border)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(4), borderSide: BorderSide(color: colors.border)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(4), borderSide: BorderSide(color: colors.text)),
    ),
  );
}
