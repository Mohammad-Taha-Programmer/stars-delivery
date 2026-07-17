import 'package:equatable/equatable.dart';

abstract class OrderEvent extends Equatable {
  const OrderEvent();
  @override
  List<Object?> get props => [];
}

class CreateOrderEvent extends OrderEvent {
  final String token;
  final String type;
  final String description;
  final String phone;
  final List<String> imagePaths;
  final String? area;

  const CreateOrderEvent({
    required this.token,
    required this.type,
    required this.description,
    required this.phone,
    this.imagePaths = const [],
    this.area,
  });

  @override
  List<Object?> get props => [token, type, description, phone, imagePaths, area];
}