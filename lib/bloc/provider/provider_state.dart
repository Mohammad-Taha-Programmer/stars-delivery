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
  ProviderStatsLoaded({required this.stats, this.pendingOrders});
  @override
  List<Object?> get props => [stats, pendingOrders];
}

class ProviderError extends ProviderState {
  final String message;
  ProviderError({required this.message});
  @override
  List<Object?> get props => [message];
}