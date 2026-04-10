import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:golf_baccarat_tracker/main.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const GolfBaccaratTrackerApp());

    // Verify that the app starts with the Game Setup screen
    expect(find.text('Game Setup'), findsOneWidget);
  });
}
