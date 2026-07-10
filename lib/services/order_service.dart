import 'dart:io';
import 'package:dio/dio.dart';

class OrderService {
  late final Dio _dio;

  OrderService() {
    final baseUrl = _getBaseUrl();
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
    ));
  }

  String _getBaseUrl() {
    try {
      if (Platform.isAndroid) {
        return 'http://10.0.2.2:3000/api';
      }
    } catch (_) {}
    return 'http://192.168.1.8:3000/api';
  }

  Future<Map<String, dynamic>> createOrder(
      String token, String type, String description, String phone, List<String> imagePaths) async {
    try {
      final formData = FormData();
      formData.fields.addAll([
        MapEntry('type', type),
        MapEntry('description', description),
        MapEntry('phone', phone),
      ]);
      for (final path in imagePaths) {
        formData.files.add(MapEntry(
          'images',
          await MultipartFile.fromFile(path),
        ));
      }

      final response = await _dio.post('/orders',
        data: formData,
        options: Options(headers: { 'Authorization': 'Bearer $token' }),
      );
      return response.data;
    } on DioException catch (e) {
      final message = e.response?.data?['error'] ?? 'Failed to create order';
      throw Exception(message);
    }
  }
}