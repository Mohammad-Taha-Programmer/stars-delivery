import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../bloc/order/order_bloc.dart';
import '../models/user_model.dart';
import 'create_order_screen.dart';
import 'login_screen.dart';

class HomeScreen extends StatelessWidget {
  final UserModel user;
  final String role;
  final String token;

  const HomeScreen({super.key, required this.user, required this.role, required this.token});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Row(
          children: [
            Icon(Icons.rocket_launch, color: Colors.blue[700], size: 28),
            const SizedBox(width: 8),
            Text(
              'تطبيق التوصيل السريع',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.blue[700],
              ),
            ),
          ],
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.red),
            onPressed: () {
              Navigator.pushAndRemoveUntil(
                context,
                MaterialPageRoute(builder: (_) => const LoginScreen()),
                (route) => false,
              );
            },
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
        child: Column(
          children: [
            _ActionButton(
              icon: Icons.add_circle_outline,
              label: 'إنشاء طلب جديد',
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => BlocProvider(
                      create: (_) => OrderBloc(),
                      child: CreateOrderScreen(user: user, token: token),
                    ),
                  ),
                );
              },
            ),
            const SizedBox(height: 16),
            _ActionButton(
              icon: Icons.local_offer_outlined,
              label: 'عروض اسعار السائقين',
              onTap: () {},
            ),
            const SizedBox(height: 16),
            _ActionButton(
              icon: Icons.assessment_outlined,
              label: 'تقرير الطلبات - آخر 30 يوم',
              onTap: () {},
            ),
          ],
        ),
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _ActionButton({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: onTap,
        style: ElevatedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 24),
          backgroundColor: Colors.white,
          foregroundColor: Colors.blue[700],
          side: BorderSide(color: Colors.grey[300]!),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          elevation: 0,
        ),
        child: Row(
          children: [
            Icon(icon, size: 28),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                label,
                textAlign: TextAlign.right,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}