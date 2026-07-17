import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../bloc/offer/offer_bloc.dart';
import 'order_offers_screen.dart';
import '../services/order_service.dart';
import '../services/responsive.dart';
import '../services/localization_service.dart';
import '../bloc/app/app_bloc.dart';

class MyOrdersScreen extends StatefulWidget {
  final String token;
  const MyOrdersScreen({super.key, required this.token});
  @override
  State<MyOrdersScreen> createState() => _MyOrdersScreenState();
}

class _MyOrdersScreenState extends State<MyOrdersScreen> {
  final OrderService _orderService = OrderService();
  List<Map<String, dynamic>>? _orders;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadOrders();
  }

  Future<void> _loadOrders() async {
    try {
      final orders = await _orderService.getMyOrders(widget.token);
      setState(() {
        _orders = orders;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  String _statusLabel(String? status) {
    switch (status) {
      case 'pending':
        return AppLocalization.get(context, 'status_pending');
      case 'offered':
        return AppLocalization.get(context, 'status_offered');
      case 'accepted':
        return AppLocalization.get(context, 'status_accepted');
      case 'fulfilling':
        return AppLocalization.get(context, 'status_fulfilling');
      case 'completed':
        return AppLocalization.get(context, 'status_completed');
      default:
        return status ?? '';
    }
  }

  Color _statusColor(String? status) {
    switch (status) {
      case 'pending':
        return Colors.orange;
      case 'offered':
        return Colors.blue;
      case 'accepted':
        return Colors.teal;
      case 'fulfilling':
        return Colors.purple;
      case 'completed':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isAr = context.watch<AppBloc>().state.locale.languageCode == 'ar';
    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0,
          title: Text(
            AppLocalization.get(context, 'my_orders'),
            style: const TextStyle(
              color: Colors.black87,
              fontWeight: FontWeight.bold,
            ),
          ),
          centerTitle: true,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.black87),
            onPressed: () => Navigator.pop(context),
          ),
        ),
        body: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 600),
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _orders == null || _orders!.isEmpty
                ? Center(
                    child: Text(
                      AppLocalization.get(context, 'no_orders'),
                      style: const TextStyle(color: Colors.grey, fontSize: 16),
                    ),
                  )
                : RefreshIndicator(
                    onRefresh: _loadOrders,
                    child: ListView.builder(
                      padding: EdgeInsets.symmetric(
                        horizontal: Responsive.paddingHorizontal(context),
                        vertical: Responsive.paddingVertical(context),
                      ),
                      itemCount: _orders!.length,
                      itemBuilder: (_, i) {
                        final o = _orders![i];
                        final typeLabels = {
                          'product': AppLocalization.get(context, 'product'),
                          'people': AppLocalization.get(context, 'people'),
                          'goods': AppLocalization.get(context, 'goods'),
                        };
                        return Card(
                          margin: const EdgeInsets.only(bottom: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: ListTile(
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 8,
                            ),
                            title: Text(
                              typeLabels[o['type']] ?? o['type'] ?? '',
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            subtitle: Text(
                              o['description'] ?? '',
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                            trailing: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: _statusColor(
                                  o['status'],
                                ).withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(
                                _statusLabel(o['status']),
                                style: TextStyle(
                                  color: _statusColor(o['status']),
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => BlocProvider(
                                    create: (_) => OfferBloc(),
                                    child: OrderOffersScreen(
                                      token: widget.token,
                                      orderId: o['_id']?.toString() ?? '',
                                    ),
                                  ),
                                ),
                              ).then((_) => _loadOrders());
                            },
                          ),
                        );
                      },
                    ),
                  ),
          ),
        ),
      ),
    );
  }
}
