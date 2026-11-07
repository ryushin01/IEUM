import 'package:flutter/material.dart';

/// 카닥 앱을 참고한 디자인 토큰입니다. 웹의 apps/web/src/shared/theme/theme.css.ts와 같은 값을 유지합니다.
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
    required this.ink,
    required this.onInk,
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
    bg: Color(0xFFF5F6F8),
    surface: Color(0xFFFFFFFF),
    text: Color(0xFF2B2D38),
    muted: Color(0xFF646A75),
    border: Color(0xFFECEEF1),
    control: Color(0xFF8A8F98),
    primary: Color(0xFF0B6BE0),
    onPrimary: Color(0xFFFFFFFF),
    ink: Color(0xFF31313B),
    onInk: Color(0xFFFFFFFF),
    header: Color(0xFFFFFFFF),
    onHeader: Color(0xFF2B2D38),
    like: Color(0xFF0B6BE0),
    official: Color(0xFF0B6BE0),
    error: Color(0xFFD3222A),
    avatarBg: Color(0xFFE3E6EA),
    onAvatar: Color(0xFF2B2D38),
    bubbleOther: Color(0xFFF0F1F4),
  );
  static const dark = IeumColors(
    bg: Color(0xFF111318),
    surface: Color(0xFF1B1E25),
    text: Color(0xFFEEF0F3),
    muted: Color(0xFFA9AFBA),
    border: Color(0xFF2C303A),
    control: Color(0xFF7F8693),
    primary: Color(0xFF5EA3FF),
    onPrimary: Color(0xFF10131A),
    ink: Color(0xFFEEF0F3),
    onInk: Color(0xFF1B1E25),
    header: Color(0xFF1B1E25),
    onHeader: Color(0xFFEEF0F3),
    like: Color(0xFF5EA3FF),
    official: Color(0xFF5EA3FF),
    error: Color(0xFFFF8A8F),
    avatarBg: Color(0xFF3A3F4A),
    onAvatar: Color(0xFFEEF0F3),
    bubbleOther: Color(0xFF2A2E37),
  );

  /// 회색 구획 띠의 두께입니다.
  static const band = 8.0;

  final Color bg;
  final Color surface;
  final Color text;
  final Color muted;
  final Color border;
  final Color control;
  final Color primary;
  final Color onPrimary;
  final Color ink;
  final Color onInk;
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
  OutlineInputBorder border(Color color) =>
      OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: color));
  return ThemeData(
    useMaterial3: true,
    brightness: brightness,
    fontFamily: 'Pretendard',
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
        textStyle: const TextStyle(fontFamily: 'Pretendard', fontWeight: FontWeight.w600, fontSize: 14, letterSpacing: -.14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      isDense: true,
      filled: true,
      fillColor: colors.surface,
      hintStyle: TextStyle(color: colors.muted),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      border: border(colors.control),
      enabledBorder: border(colors.control),
      focusedBorder: border(colors.text),
    ),
  );
}
