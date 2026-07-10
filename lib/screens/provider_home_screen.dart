import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../bloc/provider/provider_bloc.dart';
import '../bloc/provider/provider_event.dart';
import '../bloc/provider/provider_state.dart';
import '../models/user_model.dart';
import 'login_screen.dart';
import 'pending_orders_screen.dart';

class ProviderHomeScreen extends StatefulWidget {
  final UserModel user;
  final String token;

  const ProviderHomeScreen({super.key, required this.user, required this.token});

  @override
  State<ProviderHomeScreen> createState() => _ProviderHomeScreenState();
}

class _ProviderHomeScreenState extends State<ProviderHomeScreen> {
  @override
  void initState() {
    super.initState();
    context.read<ProviderBloc>().add(LoadProviderStats(token: widget.token));
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0,
          title: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'لوحة تحكم السائق',
                style: TextStyle(color: Colors.black87, fontWeight: FontWeight.bold, fontSize: 18),
              ),
              const SizedBox(width: 8),
              Icon(Icons.motorcycle, color: Colors.orange[700], size: 28),
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
        body: BlocConsumer<ProviderBloc, ProviderState>(
          listener: (context, state) {
            if (state is ProviderStatsLoaded && state.pendingOrders != null) {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => PendingOrdersScreen(orders: state.pendingOrders!),
                ),
              );
            }
          },
          builder: (context, state) {
            if (state is ProviderLoading) {
              return const Center(child: CircularProgressIndicator());
            }
            if (state is ProviderError) {
              return Center(child: Text(state.message, style: const TextStyle(color: Colors.red)));
            }
            if (state is ProviderStatsLoaded) {
              final s = state.stats;
              return Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.all(20),
                            decoration: BoxDecoration(
                              color: Colors.blue[50],
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('مجموع أرباحك اليوم', style: TextStyle(fontSize: 14, color: Colors.black54)),
                                const SizedBox(height: 8),
                                Text('${s.dailyEarnings.toStringAsFixed(0)} ILS',
                                    style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.black87)),
                                const SizedBox(height: 4),
                                Text('مقابل ${s.totalSuccessful}  طلب ناجح',
                                    style: const TextStyle(fontSize: 13, color: Colors.black54)),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.all(20),
                            decoration: BoxDecoration(
                              color: Colors.green[50],
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('أرباحك هذا الشهر كامل', style: TextStyle(fontSize: 14, color: Colors.black54)),
                                const SizedBox(height: 8),
                                Text('${s.monthlyEarnings.toStringAsFixed(0)} ILS',
                                    style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.black87)),
                                const SizedBox(height: 4),
                                Text('مقابل ${s.totalSuccessful}  طلب ناجح',
                                    style: const TextStyle(fontSize: 13, color: Colors.black54)),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () {
                          context.read<ProviderBloc>().add(LoadPendingOrders(token: widget.token));
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white,
                          side: const BorderSide(color: Colors.red, width: 2),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          padding: const EdgeInsets.symmetric(vertical: 18),
                        ),
                        child: Column(
                          children: [
                            const Text(
                              'طلبات جديدة تنتظر تقديم عرض سعر',
                              style: TextStyle(color: Colors.black87, fontSize: 15, fontWeight: FontWeight.w500),
                            ),
                            const SizedBox(height: 4),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  '${s.pendingOrdersCount}',
                                  style: const TextStyle(color: Colors.red, fontSize: 20, fontWeight: FontWeight.bold),
                                ),
                                const Text(
                                  ' طلب',
                                  style: TextStyle(color: Colors.red, fontSize: 16, fontWeight: FontWeight.w500),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.orange[50],
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'عمولة المنصة (مستحقة الدفع):',
                            style: TextStyle(fontSize: 14, color: Colors.black54),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            '${s.monthlyCommission.toStringAsFixed(0)} شيكل بناء على الطلبات الناجحة',
                            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.orange),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            }
            return const SizedBox();
          },
        ),
      ),
    );
  }
}