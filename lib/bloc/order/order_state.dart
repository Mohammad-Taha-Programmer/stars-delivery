import 'package:equatable/equatable.dart';
import '../../models/order_model.dart';

abstract class OrderState extends Equatable {
  @override
  List<Object?> get props => [];
}

class OrderInitial extends OrderState {}

class OrderLoading extends OrderState {}

class OrderSuccess extends OrderState {
  final OrderModel order;

  OrderSuccess({required this.order});
  @override
  List<Object?> get props => [order];
}

class OrderError extends OrderState {
  final String message;
  OrderError({required this.message});
  @override
  List<Object?> get props => [message];
}