import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'bloc/auth/auth_bloc.dart';
import 'screens/login_screen.dart';

void main() {
  runApp(const StarsDeliveryApp());
}

class StarsDeliveryApp extends StatelessWidget {
  const StarsDeliveryApp({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => AuthBloc(),
      child: MaterialApp(
        title: 'Stars Delivery',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF1a237e)),
          useMaterial3: true,
        ),
        home: const LoginScreen(),
      ),
    );
  }
}