/// 웹의 shared/lib/time.ts와 같은 규칙입니다.
String timeAgo(DateTime value, {DateTime? now}) {
  final seconds = (now ?? DateTime.now()).difference(value).inSeconds;
  if (seconds < 60) return '방금 전';
  if (seconds < 3600) return '${seconds ~/ 60}분 전';
  if (seconds < 86400) return '${seconds ~/ 3600}시간 전';
  if (seconds < 86400 * 7) return '${seconds ~/ 86400}일 전';
  final local = value.toLocal();
  return '${local.year}년 ${local.month}월 ${local.day}일';
}
