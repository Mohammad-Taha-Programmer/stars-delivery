import 'package:flutter_bloc/flutter_bloc.dart';
import 'offer_event.dart';
import 'offer_state.dart';
import '../../services/offer_service.dart';

class OfferBloc extends Bloc<OfferEvent, OfferState> {
  final OfferService _s = OfferService();
  OfferBloc() : super(OfferInitial()) {
    on<SubmitOfferEvent>(_onSubmit);
    on<LoadOffersEvent>(_onLoad);
    on<AcceptOfferEvent>(_onAccept);
  }
  Future<void> _onSubmit(SubmitOfferEvent e, Emitter<OfferState> emit) async {
    emit(OfferLoading()); try {
      await _s.submitOffer(e.token, e.orderId, e.price, e.estimatedTime); emit(OfferSuccess());
    } catch (ex) { emit(OfferError(message: ex.toString().replaceFirst('Exception: ', ''))); }
  }
  Future<void> _onLoad(LoadOffersEvent e, Emitter<OfferState> emit) async {
    emit(OfferLoading()); try {
      final o = await _s.getOffers(e.token, e.orderId); emit(OffersLoaded(offers: o));
    } catch (ex) { emit(OfferError(message: ex.toString().replaceFirst('Exception: ', ''))); }
  }
  Future<void> _onAccept(AcceptOfferEvent e, Emitter<OfferState> emit) async {
    emit(OfferLoading()); try {
      await _s.acceptOffer(e.token, e.offerId);
      final offers = await _s.getOffers(e.token, e.orderId);
      emit(OffersLoaded(offers: offers));
    } catch (ex) { emit(OfferError(message: ex.toString().replaceFirst('Exception: ', ''))); }
  }
}