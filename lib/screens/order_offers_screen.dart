import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../bloc/offer/offer_bloc.dart';
import '../bloc/offer/offer_event.dart';
import '../bloc/offer/offer_state.dart';
import '../services/responsive.dart';
import '../services/localization_service.dart';
import '../bloc/app/app_bloc.dart';

class OrderOffersScreen extends StatefulWidget {
  final String token, orderId;
  const OrderOffersScreen({
    super.key,
    required this.token,
    required this.orderId,
  });
  @override
  State<OrderOffersScreen> createState() => _OrderOffersScreenState();
}

class _OrderOffersScreenState extends State<OrderOffersScreen> {
  @override
  void initState() {
    super.initState();
    context.read<OfferBloc>().add(
      LoadOffersEvent(token: widget.token, orderId: widget.orderId),
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
            AppLocalization.get(context, 'offers_list'),
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
            child: BlocBuilder<OfferBloc, OfferState>(
              builder: (context, state) {
                if (state is OfferLoading)
                  return const Center(child: CircularProgressIndicator());
                if (state is OffersLoaded) {
                  if (state.offers.isEmpty)
                    return Center(
                      child: Text(
                        AppLocalization.get(context, 'no_offers'),
                        style: const TextStyle(
                          color: Colors.grey,
                          fontSize: 16,
                        ),
                      ),
                    );
                  return RefreshIndicator(
                    onRefresh: () async {
                      final bloc = context.read<OfferBloc>();
                      bloc.add(LoadOffersEvent(
                        token: widget.token,
                        orderId: widget.orderId,
                      ));
                      await bloc.stream.firstWhere((s) => s is! OfferLoading);
                    },
                    child: ListView.builder(
                    padding: EdgeInsets.symmetric(
                      horizontal: Responsive.paddingHorizontal(context),
                      vertical: Responsive.paddingVertical(context),
                    ),
                    itemCount: state.offers.length,
                    itemBuilder: (_, i) {
                      final o = state.offers[i];
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
                                  const Icon(
                                    Icons.person,
                                    color: Colors.orange,
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          o.providerName,
                                          style: const TextStyle(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 16,
                                          ),
                                        ),
                                        if (o.providerPublicId.isNotEmpty)
                                          Text(
                                            '#${o.providerPublicId}',
                                            style: TextStyle(
                                              fontSize: 12,
                                              color: Colors.orange[700],
                                              fontWeight: FontWeight.w500,
                                            ),
                                          ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    '${o.price} ${AppLocalization.get(context, 'shekel')}',
                                    style: const TextStyle(
                                      color: Colors.green,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 18,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              if (o.providerPhone.isNotEmpty) ...[
                                Row(
                                  children: [
                                    const Icon(Icons.phone, size: 14, color: Colors.grey),
                                    const SizedBox(width: 4),
                                    Text(
                                      o.status == 'accepted'
                                          ? o.providerPhone
                                          : _maskPhone(o.providerPhone),
                                      style: TextStyle(
                                        fontSize: 13,
                                        color: Colors.grey[700],
                                      ),
                                    ),
                                  ],
                                ),
                              const SizedBox(height: 8),
                              if (o.orderDescription.isNotEmpty)
                                Text(
                                  o.orderDescription,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(fontSize: 13, color: Colors.grey[700]),
                                ),
                              if (o.orderArea.isNotEmpty) ...[
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    Icon(Icons.location_on, size: 14, color: Colors.grey[600]),
                                    const SizedBox(width: 4),
                                    Text(
                                      o.orderArea,
                                      style: TextStyle(fontSize: 13, color: Colors.grey[600]),
                                    ),
                                  ],
                                ),
                              ],
                              const SizedBox(height: 12),
                              ],
                              _buildOfferAction(context, o),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                  );
                }
                if (state is OfferError)
                  return Center(
                    child: Text(
                      state.message,
                      style: const TextStyle(color: Colors.red),
                    ),
                  );
                return const SizedBox();
              },
            ),
          ),
        ),
      ),
    );
  }

  String _maskPhone(String phone) {
    if (phone.length <= 4) return '***';
    return '${phone.substring(0, phone.length - 3)}***';
  }

  Widget _buildOfferAction(BuildContext context, dynamic o) {
    if (o.status == 'accepted') {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.green,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          AppLocalization.get(context, 'accepted'),
          textAlign: TextAlign.center,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
      );
    }
    if (o.status == 'rejected') {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.red[300],
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          AppLocalization.get(context, 'rejected'),
          textAlign: TextAlign.center,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
      );
    }
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton.icon(
        onPressed: () =>
            context.read<OfferBloc>().add(AcceptOfferEvent(
              token: widget.token,
              offerId: o.id,
              orderId: widget.orderId,
            )),
        icon: const Icon(Icons.check_circle, size: 20, color: Colors.white),
        label: Text(
          AppLocalization.get(context, 'accept'),
          style: const TextStyle(color: Colors.white),
        ),
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.green,
          padding: const EdgeInsets.symmetric(vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
        ),
      ),
    );
  }
}
