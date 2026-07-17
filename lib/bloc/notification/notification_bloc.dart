import 'package:flutter_bloc/flutter_bloc.dart';
import 'notification_event.dart';
import 'notification_state.dart';
import '../../services/notification_service.dart';

class NotificationBloc extends Bloc<NotificationEvent, NotificationState> {
  final NotificationService _s = NotificationService();
  NotificationBloc() : super(NotificationInitial()) {
    on<LoadNotifications>(_onLoad);
    on<MarkNotificationRead>(_onMarkRead);
    on<MarkAllNotificationsRead>(_onMarkAll);
  }
  Future<void> _onLoad(LoadNotifications e, Emitter<NotificationState> emit) async {
    emit(NotificationLoading()); try {
      final n = await _s.getNotifications(e.token);
      final u = await _s.getUnreadCount(e.token);
      emit(NotificationsLoaded(notifications: n, unreadCount: u));
    } catch (ex) { emit(NotificationError(message: ex.toString().replaceFirst('Exception: ', ''))); }
  }
  Future<void> _onMarkRead(MarkNotificationRead e, Emitter<NotificationState> emit) async {
    await _s.markRead(e.token, e.id); add(LoadNotifications(token: e.token));
  }
  Future<void> _onMarkAll(MarkAllNotificationsRead e, Emitter<NotificationState> emit) async {
    await _s.markAllRead(e.token); add(LoadNotifications(token: e.token));
  }
}