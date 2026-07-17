import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../services/provider_service.dart';
import '../bloc/provider/provider_bloc.dart';
import '../bloc/provider/provider_event.dart';
import '../bloc/app/app_bloc.dart';
import '../services/responsive.dart';
import '../services/localization_service.dart';

class ProviderActiveOrdersScreen extends StatefulWidget {
  final String token;
  const ProviderActiveOrdersScreen({super.key, required this.token});
  @override
  State<ProviderActiveOrdersScreen> createState() =>
      _ProviderActiveOrdersScreenState();
}

class _ProviderActiveOrdersScreenState
    extends State<ProviderActiveOrdersScreen> {
  final ProviderService _service = ProviderService();
  List<Map<String, dynamic>>? _orders;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadOrders();
  }

  Future<void> _loadOrders() async {
    if (!mounted) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final orders = await _service.getMyOrders(widget.token);
      if (!mounted) return;
      setState(() {
        _orders = orders;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _loading = false;
      });
    }
  }

  String _statusLabel(String? s) {
    switch (s) {
      case 'accepted':
        return AppLocalization.get(context, 'status_accepted');
      case 'fulfilling':
        return AppLocalization.get(context, 'status_fulfilling');
      case 'completed':
        return AppLocalization.get(context, 'status_completed');
      default:
        return s ?? '';
    }
  }

  Color _statusColor(String? s) {
    switch (s) {
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

  Future<void> _markFulfilling(String orderId) async {
    try {
      await _service.markFulfilling(widget.token, orderId);
      _loadOrders();
      if (mounted) {
        context.read<ProviderBloc>().add(
          LoadProviderStats(token: widget.token),
        );
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(AppLocalization.get(context, 'status_updated')),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted)
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceFirst('Exception: ', '')),
            backgroundColor: Colors.red,
          ),
        );
    }
  }

  Future<void> _markComplete(String orderId) async {
    try {
      await _service.markComplete(widget.token, orderId);
      _loadOrders();
      if (mounted) {
        context.read<ProviderBloc>().add(
          LoadProviderStats(token: widget.token),
        );
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(AppLocalization.get(context, 'order_completed_msg')),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted)
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceFirst('Exception: ', '')),
            backgroundColor: Colors.red,
          ),
        );
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
            AppLocalization.get(context, 'active_orders_btn'),
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
                : _error != null
                ? Center(
                    child: Text(
                      _error!,
                      style: const TextStyle(color: Colors.red),
                    ),
                  )
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
                        final isActive =
                            o['status'] == 'accepted' ||
                            o['status'] == 'fulfilling';
                        if (!isActive) return const SizedBox.shrink();
                        return Card(
                          margin: const EdgeInsets.only(bottom: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        typeLabels[o['type']] ??
                                            o['type'] ??
                                            '',
                                        style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 16,
                                        ),
                                      ),
                                    ),
                                    Container(
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
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  o['description'] ?? '',
                                  style: TextStyle(color: Colors.grey[700]),
                                ),
                                if (o['price'] != null) ...[
                                  const SizedBox(height: 6),
                                  Text(
                                    '${AppLocalization.get(context, 'price')}: ${o['price']} ${AppLocalization.get(context, 'shekel')}',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      color: Colors.green,
                                    ),
                                  ),
                                ],
                                if (o['status'] == 'accepted') ...[
                                  const SizedBox(height: 12),
                                  SizedBox(
                                    width: double.infinity,
                                    child: ElevatedButton(
                                      onPressed: () => _markFulfilling(
                                        o['_id']?.toString() ?? '',
                                      ),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: Colors.purple,
                                        foregroundColor: Colors.white,
                                        shape: RoundedRectangleBorder(
                                          borderRadius: BorderRadius.circular(
                                            8,
                                          ),
                                        ),
                                      ),
                                      child: Text(
                                        AppLocalization.get(
                                          context,
                                          'start_delivery',
                                        ),
                                        style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                                if (o['status'] == 'fulfilling') ...[
                                  const SizedBox(height: 12),
                                  SizedBox(
                                    width: double.infinity,
                                    child: ElevatedButton(
                                      onPressed: () => _markComplete(
                                        o['_id']?.toString() ?? '',
                                      ),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: Colors.green,
                                        foregroundColor: Colors.white,
                                        shape: RoundedRectangleBorder(
                                          borderRadius: BorderRadius.circular(
                                            8,
                                          ),
                                        ),
                                      ),
                                      child: Text(
                                        AppLocalization.get(
                                          context,
                                          'confirm_delivery',
                                        ),
                                        style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ],
                            ),
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
