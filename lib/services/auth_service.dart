import 'dart:io';
import 'package:dio/dio.dart';

class AuthService {
  late final Dio _dio;

  AuthService() {
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

  Future<Map<String, dynamic>> login(String email, String password, String role) async {
    try {
      final response = await _dio.post('/auth/login', data: {
        'email': email,
        'password': password,
        'role': role,
      });
      return response.data;
    } on DioException catch (e) {
      final message = e.response?.data?['error'] ?? _dioErrorMessage(e);
      throw Exception(message);
    }
  }

  Future<Map<String, dynamic>> register(
      String fullName, String email, String phone, String password, String role, String area) async {
    try {
      final response = await _dio.post('/auth/register', data: {
        'fullName': fullName,
        'email': email,
        'phone': phone,
        'password': password,
        'role': role,
        'area': area,
      });
      return response.data;
    } on DioException catch (e) {
      final message = e.response?.data?['error'] ?? _dioErrorMessage(e);
      throw Exception(message);
    }
  }

  String _dioErrorMessage(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.receiveTimeout:
        return 'Connection timed out. Check your network.';
      case DioExceptionType.connectionError:
        return 'Cannot connect to server. Make sure the backend is running.';
      default:
        return 'Something went wrong. Please try again.';
    }
  }
}