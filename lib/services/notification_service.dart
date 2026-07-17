import 'package:dio/dio.dart';
import '../models/notification_model.dart';
import 'api_config.dart';

class NotificationService {
  late final Dio _dio;
  NotificationService() {
    _dio = Dio(BaseOptions(baseUrl: ApiConfig.apiUrl, connectTimeout: const Duration(seconds: 30), receiveTimeout: const Duration(seconds: 30)));
  }

  Future<List<NotificationModel>> getNotifications(String token) async {
    final r = await _dio.get('/notifications',
      options: Options(headers: {'Authorization': 'Bearer $token'}));
    return (r.data as List).map((j) => NotificationModel.fromJson(j)).toList();
  }

  Future<int> getUnreadCount(String token) async {
    final r = await _dio.get('/notifications/unread-count',
      options: Options(headers: {'Authorization': 'Bearer $token'}));
    return r.data['count'] ?? 0;
  }

  Future<void> markRead(String token, String id) async {
    await _dio.put('/notifications/$id/read',
      options: Options(headers: {'Authorization': 'Bearer $token'}));
  }

  Future<void> markAllRead(String token) async {
    await _dio.put('/notifications/read-all',
      options: Options(headers: {'Authorization': 'Bearer $token'}));
  }
}
