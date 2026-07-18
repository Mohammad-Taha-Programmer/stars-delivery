import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../services/responsive.dart';
import '../services/localization_service.dart';
import '../bloc/app/app_bloc.dart';

class OfferedOrdersScreen extends StatelessWidget {
  final List<Map<String, dynamic>> orders;
  final String token;
  final VoidCallback? onRefresh;
  const OfferedOrdersScreen({super.key, required this.orders, required this.token, this.onRefresh});

  @override
  Widget build(BuildContext context) {
    final isAr = context.read<AppBloc>().state.locale.languageCode == 'ar';
    final typeLabels = {
      'product': AppLocalization.get(context, 'product'),
      'people': AppLocalization.get(context, 'people'),
      'goods': AppLocalization.get(context, 'goods'),
    };
    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0,
          title: const Text('الطلبات التي تم تقديم عرض سعر لها', style: TextStyle(color: Colors.black87, fontWeight: FontWeight.bold, fontSize: 15)),
          centerTitle: true,
          leading: IconButton(icon: const Icon(Icons.arrow_back, color: Colors.black87), onPressed: () => Navigator.pop(context)),
        ),
        body: RefreshIndicator(
          onRefresh: () async { onRefresh?.call(); },
          child: Center(
            child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 600),
            child: orders.isEmpty
                ? ListView(children: const [Center(child: Padding(padding: EdgeInsets.all(40), child: Text('لا توجد طلبات', style: TextStyle(fontSize: 16, color: Colors.grey))))])
                : ListView.builder(
                    padding: EdgeInsets.symmetric(horizontal: Responsive.paddingHorizontal(context), vertical: Responsive.paddingVertical(context)),
                    itemCount: orders.length,
                    itemBuilder: (_, i) {
                      final o = orders[i];
                      final c = o['customerId'];
                      final name = c is Map ? (c['fullName'] ?? '') : '';
                      final pid = c is Map ? (c['publicId'] ?? '') : '';
                      return Card(
                        margin: const EdgeInsets.only(bottom: 10),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        child: Padding(
                          padding: const EdgeInsets.all(14),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(typeLabels[o['type']] ?? o['type'] ?? '', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                                  const Spacer(),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                    decoration: BoxDecoration(color: Colors.blue[50], borderRadius: BorderRadius.circular(10)),
                                    child: Text('بانتظار الرد', style: TextStyle(fontSize: 11, color: Colors.blue[700])),
                                  ),
                                ],
                              ),
                              if (name.isNotEmpty) ...[
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    const Icon(Icons.person_outline, size: 13, color: Colors.orange),
                                    const SizedBox(width: 4),
                                    Text(name, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
                                    if (pid.isNotEmpty) ...[
                                      const SizedBox(width: 6),
                                      Text('#$pid', style: TextStyle(fontSize: 11, color: Colors.orange[700])),
                                    ],
                                  ],
                                ),
                              ],
                              const SizedBox(height: 6),
                              Text(o['description'] ?? '', style: TextStyle(color: Colors.grey[700], fontSize: 13)),
                              if (o['area'] != null && o['area'].toString().isNotEmpty) ...[
                                const SizedBox(height: 3),
                                Row(children: [
                                  const Icon(Icons.location_on, size: 13, color: Colors.grey),
                                  const SizedBox(width: 4),
                                  Text(o['area'].toString(), style: TextStyle(fontSize: 12, color: Colors.grey[500])),
                                ]),
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
