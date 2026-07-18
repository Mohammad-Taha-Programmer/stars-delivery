import 'package:equatable/equatable.dart';

abstract class ProviderEvent extends Equatable {
  const ProviderEvent();
  @override
  List<Object?> get props => [];
}

class LoadProviderStats extends ProviderEvent {
  final String token;
  const LoadProviderStats({required this.token});
  @override
  List<Object?> get props => [token];
}

class LoadPendingOrders extends ProviderEvent {
  final String token;
  const LoadPendingOrders({required this.token});
  @override List<Object?> get props => [token];
}
class LoadOfferedOrders extends ProviderEvent {
  final String token;
  const LoadOfferedOrders({required this.token});
  @override List<Object?> get props => [token];
}