import 'package:flutter/material.dart';

import '../app/theme.dart';
import '../data/models.dart';
import '../feed/post_card.dart';

enum MenuTab { home, me, write, messages, none }

/// sprout의 GNB 구성에 메시지를 더한 하단 메뉴입니다.
class BottomMenu extends StatelessWidget {
  const BottomMenu({super.key, required this.tab, required this.unread, required this.me, required this.onSelect, required this.onScrollTop});

  final MenuTab tab;
  final int unread;
  final Me? me;
  final void Function(MenuTab tab) onSelect;
  final VoidCallback onScrollTop;

  @override
  Widget build(BuildContext context) {
    final colors = IeumColors.of(context);
    final profile = me;
    return DecoratedBox(
      decoration: BoxDecoration(color: colors.bg, border: Border(top: BorderSide(color: colors.border))),
      child: SizedBox(
        height: 56,
        child: Row(
          children: [
            _Item(label: '홈', selected: tab == MenuTab.home, onTap: () => onSelect(MenuTab.home), child: const Icon(Icons.home_outlined)),
            _Item(
              label: '내 정보',
              selected: tab == MenuTab.me,
              onTap: () => onSelect(MenuTab.me),
              child: profile == null
                  ? const Icon(Icons.person_outline)
                  : DecoratedBox(
                      decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: colors.muted, width: 2)),
                      child: UserAvatar(nickname: profile.nickname, url: profile.avatarUrl, size: 26),
                    ),
            ),
            _Item(label: '새 게시글', selected: tab == MenuTab.write, onTap: () => onSelect(MenuTab.write), child: const Icon(Icons.add_box_outlined)),
            _Item(
              label: unread > 0 ? '메시지, 읽지 않은 메시지 $unread개' : '메시지',
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
            _Item(label: '맨 위로', selected: false, onTap: onScrollTop, child: const Icon(Icons.vertical_align_top)),
          ],
        ),
      ),
    );
  }
}

class _Item extends StatelessWidget {
  const _Item({required this.label, required this.selected, required this.onTap, required this.child});

  final String label;
  final bool selected;
  final VoidCallback onTap;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final colors = IeumColors.of(context);
    final foreground = selected ? IeumColors.ink : colors.muted;
    return Expanded(
      child: Semantics(
        button: true,
        selected: selected,
        label: label,
        excludeSemantics: true,
        child: InkWell(
          onTap: onTap,
          child: Center(
            child: Container(
              width: 52,
              height: 36,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: selected ? IeumColors.lime : Colors.transparent,
                borderRadius: BorderRadius.circular(18),
              ),
              child: IconTheme(data: IconThemeData(color: foreground, size: 24), child: child),
            ),
          ),
        ),
      ),
    );
  }
}
