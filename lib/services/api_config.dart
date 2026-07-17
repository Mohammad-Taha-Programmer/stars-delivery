import 'dart:io';
import 'package:dio/dio.dart';

class ApiConfig {
  static String serverUrl = 'http://192.168.1.10:3000';
  static String apiUrl = 'http://192.168.1.10:3000/api';
  static String? detectedArea;
  static bool _initialized = false;

  static Future<bool> _isReachable(String base) async {
    try {
      final dio = Dio(BaseOptions(
        baseUrl: base,
        connectTimeout: const Duration(seconds: 3),
        receiveTimeout: const Duration(seconds: 3),
      ));
      final res = await dio.get('/api/health');
      return res.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  static Future<void> init() async {
    if (_initialized) return;
    _initialized = true;

    try {
      if (Platform.isAndroid) {
        final dio = Dio(BaseOptions(
          baseUrl: serverUrl,
          connectTimeout: const Duration(seconds: 3),
          receiveTimeout: const Duration(seconds: 3),
        ));
        final res = await dio.get('/api/config');
        final ip = res.data['lanIp'] as String?;
        if (ip != null && ip.isNotEmpty) {
          final candidate = 'http://$ip:3000';
          // Only switch if the advertised address actually responds
          if (candidate != serverUrl && await _isReachable(candidate)) {
            serverUrl = candidate;
            apiUrl = '$candidate/api';
          }
          return;
        }
      }
    } catch (_) {
      // fallback to defaults
    }
  }
}
