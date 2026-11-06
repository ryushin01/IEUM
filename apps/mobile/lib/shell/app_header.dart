import 'package:flutter/material.dart';

import '../app/theme.dart';

/// Flutter 화면 공통 헤더입니다. 웹뷰 헤더와 같은 모습입니다.
class AppHeader extends StatelessWidget {
  const AppHeader({super.key, required this.dark, required this.onToggleTheme, this.onBack, this.onWrite});

  final bool dark;
  final VoidCallback onToggleTheme;
  final VoidCallback? onBack;

  /// 있으면 오른쪽에 글쓰기 버튼을 보여 줍니다.
  final VoidCallback? onWrite;

  @override
  Widget build(BuildContext context) {
    final colors = IeumColors.of(context);
    final write = onWrite;
    return DecoratedBox(
      decoration: BoxDecoration(
        color: colors.header,
        border: Border(bottom: BorderSide(color: colors.border)),
      ),
      // 글자 크기를 키워도 한 줄에 들어가도록 머리글만 배율을 제한합니다.
      child: MediaQuery.withClampedTextScaling(
        maxScaleFactor: 1.3,
        child: ConstrainedBox(
          constraints: const BoxConstraints(minHeight: 56),
          child: Padding(
            padding: EdgeInsets.only(left: onBack == null ? 16 : 4, right: 16),
            child: Row(
              children: [
                if (onBack != null)
                  IconButton(
                    tooltip: '뒤로 가기',
                    onPressed: onBack,
                    constraints: const BoxConstraints(minWidth: 44, minHeight: 44),
                    icon: Icon(Icons.arrow_back, color: colors.onHeader),
                  ),
                Semantics(
                  label: 'IEUM',
                  excludeSemantics: true,
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text('IEUM', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, letterSpacing: .5, color: colors.onHeader, height: 1)),
                      const SizedBox(width: 4),
                      Padding(
                        padding: const EdgeInsets.only(bottom: 3),
                        child: Container(
                          width: 7,
                          height: 7,
                          decoration: BoxDecoration(color: colors.primary, shape: BoxShape.circle),
                        ),
                      ),
                    ],
                  ),
                ),
                const Spacer(),
                Semantics(
                  label: '다크 모드',
                  onTap: onToggleTheme,
                  toggled: dark,
                  excludeSemantics: true,
                  child: Switch(
                    value: dark,
                    onChanged: (_) => onToggleTheme(),
                    activeThumbColor: Colors.white,
                    activeTrackColor: IeumColors.dark.primary,
                    inactiveThumbColor: Colors.white,
                    inactiveTrackColor: IeumColors.light.ink,
                    trackOutlineColor: const WidgetStatePropertyAll(Colors.transparent),
                  ),
                ),
                if (write != null) ...[
                  const SizedBox(width: 8),
                  _WriteButton(onTap: write),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// 진한 알약 모양의 글쓰기 버튼입니다.
class _WriteButton extends StatelessWidget {
  const _WriteButton({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = IeumColors.of(context);
    return Semantics(
      button: true,
      label: '글쓰기',
      onTap: onTap,
      excludeSemantics: true,
      child: Material(
        color: colors.ink,
        shape: const StadiumBorder(),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: ConstrainedBox(
            constraints: const BoxConstraints(minHeight: 44),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.edit_outlined, size: 16, color: colors.onInk),
                  const SizedBox(width: 4),
                  Text('글쓰기', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: colors.onInk)),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
