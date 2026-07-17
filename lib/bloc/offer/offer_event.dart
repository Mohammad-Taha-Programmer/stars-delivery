import 'package:equatable/equatable.dart';

abstract class OfferEvent extends Equatable {
  const OfferEvent();
  @override List<Object?> get props => [];
}
class SubmitOfferEvent extends OfferEvent {
  final String token, orderId; final double price;
  const SubmitOfferEvent({required this.token, required this.orderId, required this.price});
  @override List<Object?> get props => [token, orderId, price];
}
class LoadOffersEvent extends OfferEvent {
  final String token, orderId;
  const LoadOffersEvent({required this.token, required this.orderId});
  @override List<Object?> get props => [token, orderId];
}
class AcceptOfferEvent extends OfferEvent {
  final String token, offerId, orderId;
  const AcceptOfferEvent({required this.token, required this.offerId, required this.orderId});
  @override List<Object?> get props => [token, offerId, orderId];
}