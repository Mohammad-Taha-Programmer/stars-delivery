import 'package:dio/dio.dart';
import '../models/provider_stats.dart';
import 'api_config.dart';

class ProviderService {
  late final Dio _dio;

  ProviderService() {
    _dio = Dio(BaseOptions(
      baseUrl: ApiConfig.apiUrl,
      headers: {'Content-Type': 'application/json'},
      connectTimeout: const Duration(seconds: 8),
      receiveTimeout: const Duration(seconds: 8),
    ));
  }

  Future<ProviderStats> getStats(String token) async {
    try {
      final response = await _dio.get('/provider/stats',
        options: Options(headers: { 'Authorization': 'Bearer $token' }),
        queryParameters: ApiConfig.detectedArea != null
            ? {'area': ApiConfig.detectedArea} : null,
      );
      return ProviderStats.fromJson(response.data);
    } on DioException catch (e) {
      final msg = e.response?.data?['error']?.toString() ??
          e.response?.statusMessage ??
          'Failed to load stats';
      throw Exception('$msg (${e.type.name})');
    }
  }

  Future<List<Map<String, dynamic>>> getPendingOrders(String token) async {
    try {
      final response = await _dio.get('/provider/pending-orders',
        options: Options(headers: { 'Authorization': 'Bearer $token' }),
        queryParameters: ApiConfig.detectedArea != null
            ? {'area': ApiConfig.detectedArea} : null,
      );
      return List<Map<String, dynamic>>.from(response.data);
    } on DioException catch (e) {
      final msg = e.response?.data?['error']?.toString() ??
          'Failed to load pending orders';
      throw Exception(msg);
    }
  }

  Future<List<Map<String, dynamic>>> getMyOrders(String token) async {
    try {
      final response = await _dio.get('/provider/orders',
        options: Options(headers: { 'Authorization': 'Bearer $token' }),
      );
      return List<Map<String, dynamic>>.from(response.data);
    } on DioException catch (e) {
      throw Exception(e.response?.data?['error'] ?? 'Failed to load orders');
    }
  }

  Future<List<Map<String, dynamic>>> getOfferedOrders(String token) async {
    try {
      final response = await _dio.get('/provider/offered-orders',
        options: Options(headers: { 'Authorization': 'Bearer $token' }),
      );
      return List<Map<String, dynamic>>.from(response.data);
    } on DioException catch (e) {
      throw Exception(e.response?.data?['error'] ?? 'Failed to load offered orders');
    }
  }

  Future<void> markFulfilling(String token, String orderId) async {
    try {
      await _dio.put('/orders/$orderId/fulfilling',
        options: Options(headers: { 'Authorization': 'Bearer $token' }),
      );
    } on DioException catch (e) {
      throw Exception(e.response?.data?['error'] ?? 'Failed to update');
    }
  }

  Future<void> markComplete(String token, String orderId) async {
    try {
      await _dio.put('/orders/$orderId/complete',
        options: Options(headers: { 'Authorization': 'Bearer $token' }),
      );
    } on DioException catch (e) {
      throw Exception(e.response?.data?['error'] ?? 'Failed to complete');
    }
  }
}
