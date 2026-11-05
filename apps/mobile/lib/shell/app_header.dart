import 'package:flutter/material.dart';

import '../app/theme.dart';

/// Flutter 화면 공통 헤더입니다. 웹뷰 헤더와 같은 모습입니다.
class AppHeader extends StatelessWidget {
  const AppHeader({super.key, required this.dark, required this.onToggleTheme, this.onBack});

  final bool dark;
  final VoidCallback onToggleTheme;
  final VoidCallback? onBack;

  @override
  Widget build(BuildContext context) {
    final colors = IeumColors.of(context);
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: DecoratedBox(
        decoration: BoxDecoration(color: colors.bg, border: Border(bottom: BorderSide(color: colors.border))),
        child: Stack(
          alignment: Alignment.center,
          children: [
            if (onBack != null)
              Positioned(
                left: 4,
                child: IconButton(
                  tooltip: '뒤로 가기',
                  onPressed: onBack,
                  constraints: const BoxConstraints(minWidth: 44, minHeight: 44),
                  icon: Icon(Icons.arrow_back, color: colors.text),
                ),
              ),
            Semantics(
              label: 'IEUM',
              excludeSemantics: true,
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text('IEUM', style: TextStyle(fontSize: 26, letterSpacing: 1.5, color: colors.text, height: 1)),
                  const SizedBox(width: 6),
                  Container(
                    width: 11,
                    height: 11,
                    decoration: BoxDecoration(color: IeumColors.lime, shape: BoxShape.circle, border: Border.all(color: colors.text)),
                  ),
                ],
              ),
            ),
            Positioned(
              right: 4,
              child: Semantics(
                label: '다크 모드',
                toggled: dark,
                excludeSemantics: true,
                child: Switch(
                  value: dark,
                  onChanged: (_) => onToggleTheme(),
                  activeThumbColor: IeumColors.ink,
                  activeTrackColor: IeumColors.lime,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
