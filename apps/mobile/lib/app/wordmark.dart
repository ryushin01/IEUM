import 'package:flutter/material.dart';

/// 넓은 비례로 직접 그린 IEUM 로고입니다. 웹의 shared/ui/Logo.tsx와 같은 도형입니다.
class IeumWordmark extends StatelessWidget {
  const IeumWordmark({super.key, required this.height, required this.color, required this.dotColor});

  final double height;
  final Color color;
  final Color dotColor;

  @override
  Widget build(BuildContext context) => CustomPaint(size: Size(height * 4.25, height), painter: _WordmarkPainter(color, dotColor));
}

class _WordmarkPainter extends CustomPainter {
  const _WordmarkPainter(this.color, this.dotColor);

  final Color color;
  final Color dotColor;

  static void _polygon(Path path, List<double> points) {
    path.moveTo(points[0], points[1]);
    for (var i = 2; i < points.length; i += 2) {
      path.lineTo(points[i], points[i + 1]);
    }
    path.close();
  }

  static final Path _letters = () {
    final path = Path();
    _polygon(path, [0, 0, 18, 0, 18, 100, 0, 100]);
    _polygon(path, [34, 0, 130, 0, 130, 16, 52, 16, 52, 42, 123, 42, 123, 58, 52, 58, 52, 84, 130, 84, 130, 100, 34, 100]);
    path
      ..moveTo(146, 0)
      ..lineTo(164, 0)
      ..lineTo(164, 60)
      ..cubicTo(164, 76, 177, 85, 197, 85)
      ..cubicTo(217, 85, 230, 76, 230, 60)
      ..lineTo(230, 0)
      ..lineTo(248, 0)
      ..lineTo(248, 60)
      ..cubicTo(248, 86, 228, 100, 197, 100)
      ..cubicTo(166, 100, 146, 86, 146, 60)
      ..close();
    _polygon(path, [264, 0, 289, 0, 324, 76, 359, 0, 384, 0, 384, 100, 366, 100, 366, 31, 333, 100, 315, 100, 282, 31, 282, 100, 264, 100]);
    return path;
  }();

  @override
  void paint(Canvas canvas, Size size) {
    canvas.scale(size.height / 100);
    canvas.drawPath(_letters, Paint()..color = color);
    canvas.drawCircle(const Offset(412, 87), 13, Paint()..color = dotColor);
  }

  @override
  bool shouldRepaint(_WordmarkPainter old) => old.color != color || old.dotColor != dotColor;
}
