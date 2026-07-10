import 'dart:io';
import 'package:dio/dio.dart';
import '../models/provider_stats.dart';

class ProviderService {
  late final Dio _dio;

  ProviderService() {
    final baseUrl = _getBaseUrl();
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      headers: {'Content-Type': 'application/json'},
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
    ));
  }

  String _getBaseUrl() {
    try {
      if (Platform.isAndroid) {
        return 'http://192.168.1.8:3000/api';
      }
    } catch (_) {}
    return 'http://192.168.1.8:3000/api';
  }

  Future<ProviderStats> getStats(String token) async {
    try {
      final response = await _dio.get('/provider/stats',
        options: Options(headers: { 'Authorization': 'Bearer $token' }),
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
      );
      return List<Map<String, dynamic>>.from(response.data);
    } on DioException catch (e) {
      final msg = e.response?.data?['error']?.toString() ??
          'Failed to load pending orders';
      throw Exception(msg);
    }
  }
}