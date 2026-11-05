import 'package:flutter/material.dart';

/// 톡톡 디자인 토큰입니다. 웹의 apps/web/src/shared/theme/theme.css.ts와 같은 값을 유지합니다.
class IeumColors {
  const IeumColors({
    required this.bg,
    required this.surface,
    required this.text,
    required this.muted,
    required this.border,
    required this.control,
    required this.primary,
    required this.onPrimary,
    required this.primaryStrong,
    required this.accentSoft,
    required this.onAccentSoft,
    required this.header,
    required this.onHeader,
    required this.like,
    required this.likeSoft,
    required this.official,
    required this.error,
    required this.bubbleOther,
    required this.shadow,
  });

  static const accent = Color(0xFFC4E538);
  static const ink = Color(0xFF1F1B1C);

  static const light = IeumColors(
    bg: Color(0xFFF4F4F6),
    surface: Color(0xFFFFFFFF),
    text: ink,
    muted: Color(0xFF625B5F),
    border: Color(0xFFDEDBDD),
    control: Color(0xFF8A8387),
    primary: Color(0xFFD9252F),
    onPrimary: Color(0xFFFFFFFF),
    primaryStrong: Color(0xFF9E1019),
    accentSoft: Color(0xFFEAF6C2),
    onAccentSoft: Color(0xFF2F3A00),
    header: Color(0xFFD9252F),
    onHeader: Color(0xFFFFFFFF),
    like: Color(0xFFB3131D),
    likeSoft: Color(0xFFFFE9EA),
    official: Color(0xFF1F6FC4),
    error: Color(0xFFB3131D),
    bubbleOther: Color(0xFFFFFFFF),
    shadow: Color(0x141F1B1C),
  );
  static const dark = IeumColors(
    bg: Color(0xFF161314),
    surface: Color(0xFF262223),
    text: Color(0xFFF7F4F4),
    muted: Color(0xFFC9C2C5),
    border: Color(0xFF4A4446),
    control: Color(0xFF8F888B),
    primary: Color(0xFFFF6B72),
    onPrimary: Color(0xFF161314),
    primaryStrong: Color(0xFFA83A40),
    accentSoft: Color(0xFF39401A),
    onAccentSoft: Color(0xFFE4F39A),
    header: Color(0xFF2A1416),
    onHeader: Color(0xFFF7F4F4),
    like: Color(0xFFFFC2C5),
    likeSoft: Color(0xFF4A2024),
    official: Color(0xFF6FB4F5),
    error: Color(0xFFFF9DB1),
    bubbleOther: Color(0xFF3A3536),
    shadow: Color(0x00000000),
  );

  final Color bg;
  final Color surface;
  final Color text;
  final Color muted;
  final Color border;
  final Color control;
  final Color primary;
  final Color onPrimary;
  final Color primaryStrong;
  final Color accentSoft;
  final Color onAccentSoft;
  final Color header;
  final Color onHeader;
  final Color like;
  final Color likeSoft;
  final Color official;
  final Color error;
  final Color bubbleOther;
  final Color shadow;

  static IeumColors of(BuildContext context) => Theme.of(context).brightness == Brightness.dark ? dark : light;
}

ThemeData ieumTheme(Brightness brightness) {
  final colors = brightness == Brightness.dark ? IeumColors.dark : IeumColors.light;
  OutlineInputBorder border(Color color) =>
      OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: color));
  return ThemeData(
    useMaterial3: true,
    brightness: brightness,
    fontFamily: 'GothicA1',
    scaffoldBackgroundColor: colors.bg,
    colorScheme: ColorScheme.fromSeed(
      seedColor: colors.primary,
      brightness: brightness,
      primary: colors.primary,
      onPrimary: colors.onPrimary,
      surface: colors.bg,
      onSurface: colors.text,
      error: colors.error,
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: colors.primary,
        foregroundColor: colors.onPrimary,
        minimumSize: const Size(56, 48),
        textStyle: const TextStyle(fontFamily: 'GothicA1', fontWeight: FontWeight.w700, fontSize: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      isDense: true,
      filled: true,
      fillColor: colors.surface,
      hintStyle: TextStyle(color: colors.muted),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
      border: border(colors.control),
      enabledBorder: border(colors.control),
      focusedBorder: border(colors.text),
    ),
  );
}
