import 'package:equatable/equatable.dart';
import '../../models/notification_model.dart';

abstract class NotificationState extends Equatable {
  @override List<Object?> get props => [];
}
class NotificationInitial extends NotificationState {}
class NotificationLoading extends NotificationState {}
class NotificationsLoaded extends NotificationState {
  final List<NotificationModel> notifications; final int unreadCount;
  NotificationsLoaded({required this.notifications, required this.unreadCount});
  @override List<Object?> get props => [notifications, unreadCount];
}
class NotificationError extends NotificationState {
  final String message;
  NotificationError({required this.message});
  @override List<Object?> get props => [message];
}