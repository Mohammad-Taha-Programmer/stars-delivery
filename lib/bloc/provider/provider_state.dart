import 'package:equatable/equatable.dart';
import '../../models/provider_stats.dart';

abstract class ProviderState extends Equatable {
  @override
  List<Object?> get props => [];
}

class ProviderInitial extends ProviderState {}

class ProviderLoading extends ProviderState {}

class ProviderStatsLoaded extends ProviderState {
  final ProviderStats stats;
  final List<Map<String, dynamic>>? pendingOrders;
  final List<Map<String, dynamic>>? offeredOrders;
  ProviderStatsLoaded({required this.stats, this.pendingOrders, this.offeredOrders});
  @override
  List<Object?> get props => [stats, pendingOrders, offeredOrders];
}

class ProviderError extends ProviderState {
  final String message;
  ProviderError({required this.message});
  @override
  List<Object?> get props => [message];
}