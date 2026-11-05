import 'package:flutter/material.dart';

/// 웹을 불러오지 못해도 앱이 빈 화면으로 멈추지 않게 합니다.
class OfflineView extends StatelessWidget {
  const OfflineView({super.key, required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.wifi_off_rounded, size: 48, semanticLabel: '연결 끊김'),
            const SizedBox(height: 16),
            Text('연결할 수 없습니다', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            const Text('네트워크 연결을 확인한 뒤 다시 시도해 주세요.', textAlign: TextAlign.center),
            const SizedBox(height: 24),
            FilledButton(
              style: FilledButton.styleFrom(minimumSize: const Size(160, 48)),
              onPressed: onRetry,
              child: const Text('다시 시도'),
            ),
          ],
        ),
      ),
    );
  }
}
