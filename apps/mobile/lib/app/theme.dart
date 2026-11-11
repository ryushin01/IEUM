import 'package:flutter/material.dart';

/// 닷슬래시대시 앱을 참고한 단색 디자인 토큰입니다. 웹의 apps/web/src/shared/theme/theme.css.ts와 같은 값을 유지합니다.
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
    required this.accent,
    required this.onAccent,
    required this.accentSoft,
    required this.header,
    required this.onHeader,
    required this.like,
    required this.official,
    required this.error,
    required this.avatarBg,
    required this.onAvatar,
    required this.bubbleOther,
  });

  static const light = IeumColors(
    bg: Color(0xFFFFFFFF),
    surface: Color(0xFFFFFFFF),
    text: Color(0xFF111214),
    muted: Color(0xFF62656E),
    border: Color(0xFFE6E7EA),
    control: Color(0xFF8A8D96),
    primary: Color(0xFF111214),
    onPrimary: Color(0xFFFFFFFF),
    accent: Color(0xFF1A1AFF),
    onAccent: Color(0xFFFFFFFF),
    accentSoft: Color(0xFFF0F1F3),
    header: Color(0xFFFFFFFF),
    onHeader: Color(0xFF111214),
    like: Color(0xFF1A1AFF),
    official: Color(0xFF1A1AFF),
    error: Color(0xFFD3222A),
    avatarBg: Color(0xFFEBECEF),
    onAvatar: Color(0xFF111214),
    bubbleOther: Color(0xFFF0F1F3),
  );
  static const dark = IeumColors(
    bg: Color(0xFF111214),
    surface: Color(0xFF111214),
    text: Color(0xFFF4F5F7),
    muted: Color(0xFF9A9DA6),
    border: Color(0xFF2A2C32),
    control: Color(0xFF6F727B),
    primary: Color(0xFFFFFFFF),
    onPrimary: Color(0xFF111214),
    accent: Color(0xFF4545FF),
    onAccent: Color(0xFFFFFFFF),
    accentSoft: Color(0xFF24262C),
    header: Color(0xFF111214),
    onHeader: Color(0xFFF4F5F7),
    like: Color(0xFF9D9DFF),
    official: Color(0xFF9D9DFF),
    error: Color(0xFFFF6B5E),
    avatarBg: Color(0xFF2A2C32),
    onAvatar: Color(0xFFF4F5F7),
    bubbleOther: Color(0xFF24262C),
  );

  final Color bg;
  final Color surface;
  final Color text;
  final Color muted;
  final Color border;
  final Color control;
  final Color primary;
  final Color onPrimary;
  final Color accent;
  final Color onAccent;
  final Color accentSoft;
  final Color header;
  final Color onHeader;
  final Color like;
  final Color official;
  final Color error;
  final Color avatarBg;
  final Color onAvatar;
  final Color bubbleOther;

  static IeumColors of(BuildContext context) => Theme.of(context).brightness == Brightness.dark ? dark : light;
}

ThemeData ieumTheme(Brightness brightness) {
  final colors = brightness == Brightness.dark ? IeumColors.dark : IeumColors.light;
  UnderlineInputBorder border(Color color, {double width = 1}) => UnderlineInputBorder(borderSide: BorderSide(color: color, width: width));
  return ThemeData(
    useMaterial3: true,
    brightness: brightness,
    fontFamily: 'AstaSans',
    textTheme: const TextTheme(
      titleLarge: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, letterSpacing: -.2),
      titleMedium: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, letterSpacing: -.15),
      bodyLarge: TextStyle(fontSize: 14, letterSpacing: -.14),
      bodyMedium: TextStyle(fontSize: 14, letterSpacing: -.14),
      bodySmall: TextStyle(fontSize: 12, letterSpacing: -.12),
      labelLarge: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, letterSpacing: -.14),
    ),
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
        minimumSize: const Size(56, 44),
        textStyle: const TextStyle(fontFamily: 'AstaSans', fontWeight: FontWeight.w600, fontSize: 14, letterSpacing: -.14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      isDense: true,
      filled: false,
      hintStyle: TextStyle(color: colors.muted),
      contentPadding: const EdgeInsets.symmetric(vertical: 12),
      border: border(colors.control),
      enabledBorder: border(colors.control),
      focusedBorder: border(colors.text, width: 2),
    ),
  );
}
