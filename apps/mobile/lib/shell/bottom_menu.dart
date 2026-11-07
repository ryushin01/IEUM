import 'package:flutter/material.dart';

import '../app/theme.dart';

enum MenuTab { home, me, write, messages, none }

/// 윗선으로 구분한 평평한 하단 메뉴입니다. 웹의 AppShell과 같은 구성입니다.
class BottomMenu extends StatelessWidget {
  const BottomMenu({super.key, required this.tab, required this.unread, required this.onSelect, required this.onScrollTop});

  final MenuTab tab;
  final int unread;
  final void Function(MenuTab tab) onSelect;
  final VoidCallback onScrollTop;

  @override
  Widget build(BuildContext context) {
    final colors = IeumColors.of(context);
    return DecoratedBox(
      decoration: BoxDecoration(
        color: colors.surface,
        border: Border(top: BorderSide(color: colors.border)),
      ),
      child: ConstrainedBox(
        constraints: const BoxConstraints(minHeight: 64),
        child: IntrinsicHeight(
          child: Row(
            children: [
              _Item(label: '홈', selected: tab == MenuTab.home, onTap: () => onSelect(MenuTab.home), child: const Icon(Icons.home_outlined)),
              _Item(
                label: '메시지',
                semanticLabel: unread > 0 ? '메시지, 읽지 않은 메시지 $unread개' : '메시지',
                selected: tab == MenuTab.messages,
                onTap: () => onSelect(MenuTab.messages),
                child: Badge(
                  isLabelVisible: unread > 0,
                  backgroundColor: colors.error,
                  textColor: colors.bg,
                  label: Text(unread > 99 ? '99+' : '$unread'),
                  child: const Icon(Icons.chat_bubble_outline),
                ),
              ),
              _Item(label: '내 정보', selected: tab == MenuTab.me, onTap: () => onSelect(MenuTab.me), child: const Icon(Icons.person_outline)),
              _Item(label: '맨 위로', selected: false, onTap: onScrollTop, child: const Icon(Icons.vertical_align_top)),
            ],
          ),
        ),
      ),
    );
  }
}

class _Item extends StatelessWidget {
  const _Item({required this.label, required this.selected, required this.onTap, required this.child, this.semanticLabel});

  final String label;
  final String? semanticLabel;
  final bool selected;
  final VoidCallback onTap;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final colors = IeumColors.of(context);
    final foreground = selected ? colors.primary : colors.muted;
    return Expanded(
      child: Semantics(
        button: true,
        selected: selected,
        label: semanticLabel ?? label,
        onTap: onTap,
        excludeSemantics: true,
        child: InkWell(
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 6),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                SizedBox(height: 26, child: Center(child: IconTheme(data: IconThemeData(color: foreground, size: 22), child: child))),
                const SizedBox(height: 2),
                Text(label, style: TextStyle(fontSize: 11, height: 1.2, fontWeight: selected ? FontWeight.w600 : FontWeight.w400, color: foreground)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
