import 'package:dio/dio.dart';
import 'api_config.dart';

class ReportService {
  late final Dio _dio;

  ReportService() {
    _dio = Dio(BaseOptions(
      baseUrl: ApiConfig.apiUrl,
      headers: {'Content-Type': 'application/json'},
      connectTimeout: const Duration(seconds: 8),
      receiveTimeout: const Duration(seconds: 8),
    ));
  }

  Future<Map<String, dynamic>> submitReport({
    required String token,
    required String reportedPublicId,
    required String reportType,
    required String content,
  }) async {
    final res = await _dio.post('/reports',
      data: {
        'reportedPublicId': reportedPublicId,
        'reportType': reportType,
        'content': content,
      },
      options: Options(headers: {'Authorization': 'Bearer $token'}),
    );
    return res.data;
  }

  Future<List<Map<String, dynamic>>> getMyReports(String token) async {
    final res = await _dio.get('/reports/my',
      options: Options(headers: {'Authorization': 'Bearer $token'}),
    );
    return List<Map<String, dynamic>>.from(res.data);
  }
}
