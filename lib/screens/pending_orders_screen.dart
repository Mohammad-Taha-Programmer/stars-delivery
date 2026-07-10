import 'package:flutter/material.dart';

class PendingOrdersScreen extends StatelessWidget {
  final List<Map<String, dynamic>> orders;

  const PendingOrdersScreen({super.key, required this.orders});

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0,
          title: const Text(
            'الطلبات الجديدة',
            style: TextStyle(color: Colors.black87, fontWeight: FontWeight.bold),
          ),
          centerTitle: true,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.black87),
            onPressed: () => Navigator.pop(context),
          ),
        ),
        body: orders.isEmpty
            ? const Center(child: Text('لا توجد طلبات جديدة', style: TextStyle(fontSize: 16, color: Colors.grey)))
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: orders.length,
                itemBuilder: (context, index) {
                  final o = orders[index];
                  final typeLabels = {
                    'product': 'طلب منتج',
                    'people': 'طلب توصيل أشخاص',
                    'goods': 'طلب نقل بضاعة',
                  };
                  return Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    elevation: 1,
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            typeLabels[o['type']] ?? o['type'] ?? '',
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 8),
                          Text(o['description'] ?? '', style: TextStyle(color: Colors.grey[700])),
                          if (o['images'] != null && (o['images'] as List).isNotEmpty) ...[
                            const SizedBox(height: 8),
                            SizedBox(
                              height: 60,
                              child: ListView.separated(
                                scrollDirection: Axis.horizontal,
                                itemCount: (o['images'] as List).length,
                                separatorBuilder: (_, i) => const SizedBox(width: 8),
                                itemBuilder: (_, i) {
                                  final img = (o['images'] as List)[i];
                                  return ClipRRect(
                                    borderRadius: BorderRadius.circular(8),
                                    child: Image.network('http://192.168.1.8:3000$img',
                                        width: 60, height: 60, fit: BoxFit.cover,
                                        errorBuilder: (_, e1, e2) => Container(
                                          width: 60, height: 60,
                                          color: Colors.grey[200],
                                          child: const Icon(Icons.image_not_supported, color: Colors.grey),
                                        )),
                                  );
                                },
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
    );
  }
}