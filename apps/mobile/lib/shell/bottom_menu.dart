import 'package:flutter/material.dart';

import '../app/theme.dart';
import '../data/models.dart';
import '../feed/post_card.dart';

enum MenuTab { home, me, write, messages, none }

/// 가운데에 큰 글쓰기 버튼이 있는 하단 메뉴입니다. 웹의 AppShell과 같은 구성입니다.
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
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        boxShadow: [BoxShadow(color: colors.shadow, blurRadius: 16, offset: const Offset(0, -4))],
      ),
      child: SizedBox(
        height: 72,
        child: Row(
          children: [
            _Item(label: '홈', selected: tab == MenuTab.home, onTap: () => onSelect(MenuTab.home), child: Icon(tab == MenuTab.home ? Icons.home : Icons.home_outlined)),
            _Item(
              label: '내 정보',
              selected: tab == MenuTab.me,
              onTap: () => onSelect(MenuTab.me),
              child: profile == null
                  ? const Icon(Icons.person_outline)
                  : DecoratedBox(
                      // 프로필 링
                      decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: colors.primary, width: 2)),
                      child: Padding(padding: const EdgeInsets.all(2), child: UserAvatar(nickname: profile.nickname, url: profile.avatarUrl, size: 22)),
                    ),
            ),
            _WriteButton(selected: tab == MenuTab.write, onTap: () => onSelect(MenuTab.write)),
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
            _Item(label: '맨 위로', selected: false, onTap: onScrollTop, child: const Icon(Icons.vertical_align_top)),
          ],
        ),
      ),
    );
  }
}

class _WriteButton extends StatelessWidget {
  const _WriteButton({required this.selected, required this.onTap});

  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = IeumColors.of(context);
    return Expanded(
      child: Semantics(
        button: true,
        selected: selected,
        label: '새 게시글',
        excludeSemantics: true,
        child: Center(
          child: Transform.translate(
            offset: const Offset(0, -10),
            child: DecoratedBox(
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                boxShadow: [BoxShadow(color: colors.primaryStrong, offset: const Offset(0, 4))],
              ),
              child: Material(
                color: colors.primary,
                shape: const CircleBorder(),
                clipBehavior: Clip.antiAlias,
                child: InkWell(
                  onTap: onTap,
                  child: SizedBox.square(dimension: 56, child: Icon(Icons.add, size: 30, color: colors.onPrimary)),
                ),
              ),
            ),
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
    final foreground = selected ? colors.primary : colors.text;
    return Expanded(
      child: Semantics(
        button: true,
        selected: selected,
        label: semanticLabel ?? label,
        excludeSemantics: true,
        child: InkWell(
          onTap: onTap,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              SizedBox(height: 28, child: Center(child: IconTheme(data: IconThemeData(color: foreground, size: 24), child: child))),
              const SizedBox(height: 2),
              Text(label, style: TextStyle(fontSize: 12, height: 1.2, fontWeight: selected ? FontWeight.w800 : FontWeight.w700, color: foreground)),
            ],
          ),
        ),
      ),
    );
  }
}
