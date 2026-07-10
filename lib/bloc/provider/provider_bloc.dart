import 'package:flutter_bloc/flutter_bloc.dart';
import 'provider_event.dart';
import 'provider_state.dart';
import '../../services/provider_service.dart';

class ProviderBloc extends Bloc<ProviderEvent, ProviderState> {
  final ProviderService _service = ProviderService();

  ProviderBloc() : super(ProviderInitial()) {
    on<LoadProviderStats>(_onLoadStats);
    on<LoadPendingOrders>(_onLoadPendingOrders);
  }

  Future<void> _onLoadStats(LoadProviderStats event, Emitter<ProviderState> emit) async {
    emit(ProviderLoading());
    try {
      final stats = await _service.getStats(event.token);
      emit(ProviderStatsLoaded(stats: stats));
    } catch (e) {
      emit(ProviderError(message: e.toString().replaceFirst('Exception: ', '')));
    }
  }

  Future<void> _onLoadPendingOrders(LoadPendingOrders event, Emitter<ProviderState> emit) async {
    final current = state;
    try {
      final orders = await _service.getPendingOrders(event.token);
      if (current is ProviderStatsLoaded) {
        emit(ProviderStatsLoaded(stats: current.stats, pendingOrders: orders));
      }
    } catch (e) {
      emit(ProviderError(message: e.toString().replaceFirst('Exception: ', '')));
    }
  }
}