import 'package:flutter_test/flutter_test.dart';
import 'package:stars_delivery/main.dart';

void main() {
  testWidgets('App shows login screen', (WidgetTester tester) async {
    await tester.pumpWidget(const StarsDeliveryApp());
    expect(find.text('ستارز دليفري'), findsOneWidget);
    expect(find.text('عميل'), findsOneWidget);
    expect(find.text('سائق'), findsOneWidget);
  });
}