import 'package:equatable/equatable.dart';

abstract class NotificationEvent extends Equatable {
  const NotificationEvent();
  @override List<Object?> get props => [];
}
class LoadNotifications extends NotificationEvent {
  final String token;
  const LoadNotifications({required this.token});
  @override List<Object?> get props => [token];
}
class MarkNotificationRead extends NotificationEvent {
  final String token, id;
  const MarkNotificationRead({required this.token, required this.id});
  @override List<Object?> get props => [token, id];
}
class MarkAllNotificationsRead extends NotificationEvent {
  final String token;
  const MarkAllNotificationsRead({required this.token});
  @override List<Object?> get props => [token];
}