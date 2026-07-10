import 'package:flutter_test/flutter_test.dart';
import 'package:stars_delivery/main.dart';

void main() {
  testWidgets('App shows login screen', (WidgetTester tester) async {
    await tester.pumpWidget(const StarsDeliveryApp());
    expect(find.text('Stars Delivery'), findsOneWidget);
    expect(find.text('Customer'), findsOneWidget);
    expect(find.text('Provider'), findsOneWidget);
  });
}