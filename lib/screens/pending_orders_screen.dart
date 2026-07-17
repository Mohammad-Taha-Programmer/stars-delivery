import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../bloc/offer/offer_bloc.dart';
import '../bloc/app/app_bloc.dart';
import '../services/responsive.dart';
import '../services/localization_service.dart';
import '../services/api_config.dart';
import '../widgets/image_preview.dart';
import 'submit_offer_screen.dart';

class PendingOrdersScreen extends StatelessWidget {
  final List<Map<String, dynamic>> orders;
  final String token;
  const PendingOrdersScreen({
    super.key,
    required this.orders,
    required this.token,
  });

  Widget _buildCustomerRow(BuildContext context, Map<String, dynamic> o) {
    final c = o['customerId'];
    final String name;
    final String pid;
    if (c is Map) {
      name = (c['fullName'] ?? '').toString();
      pid = (c['publicId'] ?? '').toString();
    } else {
      name = '';
      pid = '';
    }
    return Row(
      children: [
        const Icon(Icons.person_outline, size: 14, color: Colors.orange),
        const SizedBox(width: 4),
        Text(
          name.isNotEmpty ? name : AppLocalization.get(context, 'unknown'),
          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
        ),
        if (pid.isNotEmpty) ...[
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
            decoration: BoxDecoration(
              color: Colors.orange[50],
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.orange[200]!),
            ),
            child: Text(
              '#$pid',
              style: TextStyle(fontSize: 11, color: Colors.orange[800], fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ],
    );
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
            AppLocalization.get(context, 'new_orders_title'),
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
            child: orders.isEmpty
                ? Center(
                    child: Text(
                      AppLocalization.get(context, 'no_new_orders'),
                      style: const TextStyle(fontSize: 16, color: Colors.grey),
                    ),
                  )
                : ListView.builder(
                    padding: EdgeInsets.symmetric(
                      horizontal: Responsive.paddingHorizontal(context),
                      vertical: Responsive.paddingVertical(context),
                    ),
                    itemCount: orders.length,
                    itemBuilder: (context, index) {
                      final o = orders[index];
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
                        elevation: 1,
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                typeLabels[o['type']] ?? o['type'] ?? '',
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 4),
                              _buildCustomerRow(context, o),
                              const SizedBox(height: 6),
                              Text(
                                o['description'] ?? '',
                                style: TextStyle(color: Colors.grey[700]),
                              ),
                              const SizedBox(height: 6),
                              Row(
                                children: [
                                  const Icon(
                                    Icons.phone,
                                    size: 14,
                                    color: Colors.grey,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    o['phone'] ??
                                        AppLocalization.get(
                                          context,
                                          'hidden_phone',
                                        ),
                                    style: TextStyle(
                                      color: Colors.grey[500],
                                      fontSize: 13,
                                    ),
                                  ),
                                ],
                              ),
                              if (o['area'] != null &&
                                  o['area'].toString().isNotEmpty) ...[
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    const Icon(
                                      Icons.location_on,
                                      size: 14,
                                      color: Colors.grey,
                                    ),
                                    const SizedBox(width: 4),
                                    Text(
                                      o['area'].toString(),
                                      style: TextStyle(
                                        color: Colors.grey[500],
                                        fontSize: 13,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                              if (o['images'] != null &&
                                  (o['images'] as List).isNotEmpty) ...[
                                const SizedBox(height: 8),
                                SizedBox(
                                  height: 60,
                                  child: ListView.separated(
                                    scrollDirection: Axis.horizontal,
                                    itemCount: (o['images'] as List).length,
                                    separatorBuilder: (_, i) =>
                                        const SizedBox(width: 8),
                                    itemBuilder: (_, i) {
                                      final img = (o['images'] as List)[i].toString();
                                      final imageUrl = img.startsWith('http') ? img : '${ApiConfig.serverUrl}$img';
                                      return GestureDetector(
                                        onTap: () => ImagePreview.show(context, imageUrl),
                                        child: ClipRRect(
                                          borderRadius: BorderRadius.circular(8),
                                          child: Image.network(
                                            imageUrl,
                                            width: 60,
                                            height: 60,
                                            fit: BoxFit.cover,
                                            errorBuilder: (_, e1, e2) =>
                                                Container(
                                                  width: 60,
                                                  height: 60,
                                                  color: Colors.grey[200],
                                                  child: const Icon(
                                                    Icons.image_not_supported,
                                                    color: Colors.grey,
                                                  ),
                                                ),
                                          ),
                                        ),
                                      );
                                    },
                                  ),
                                ),
                              ],
                              const SizedBox(height: 12),
                              SizedBox(
                                width: double.infinity,
                                child: ElevatedButton(
                                  onPressed: () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (_) => BlocProvider(
                                          create: (_) => OfferBloc(),
                                          child: SubmitOfferScreen(
                                            token: token,
                                            orderId: o['_id']?.toString() ?? '',
                                          ),
                                        ),
                                      ),
                                    );
                                  },
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.orange,
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                  ),
                                  child: Text(
                                    AppLocalization.get(
                                      context,
                                      'submit_offer_btn',
                                    ),
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ),
      ),
    );
  }
}
