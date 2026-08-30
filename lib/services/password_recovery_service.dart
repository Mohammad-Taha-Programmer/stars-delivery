import 'package:dio/dio.dart';

import 'api_config.dart';

class PasswordRecoveryException implements Exception {
  final int? statusCode;
  final String? code;
  final String message;

  const PasswordRecoveryException({
    required this.statusCode,
    required this.code,
    required this.message,
  });

  @override
  String toString() => message;
}

abstract interface class PasswordRecoveryGateway {
  Future<void> requestCode(String email);

  Future<void> resetPassword({
    required String email,
    required String code,
    required String newPassword,
    required String confirmPassword,
  });
}

class PasswordRecoveryService implements PasswordRecoveryGateway {
  late final Dio _dio;

  PasswordRecoveryService({Dio? dio}) {
    _dio =
        dio ??
        Dio(
          BaseOptions(
            baseUrl: ApiConfig.apiUrl,
            headers: const {'Content-Type': 'application/json'},
            connectTimeout: const Duration(seconds: 30),
            receiveTimeout: const Duration(seconds: 30),
          ),
        );
  }

  String _normalizeEmail(String value) => value.trim().toLowerCase();

  @override
  Future<void> requestCode(String email) async {
    try {
      await _dio.post(
        '/auth/password-recovery/request',
        data: {'email': _normalizeEmail(email)},
      );
    } on DioException catch (error) {
      throw _recoveryException(error);
    }
  }

  @override
  Future<void> resetPassword({
    required String email,
    required String code,
    required String newPassword,
    required String confirmPassword,
  }) async {
    try {
      await _dio.post(
        '/auth/password-recovery/reset',
        data: {
          'email': _normalizeEmail(email),
          'code': code.trim(),
          'newPassword': newPassword,
          'confirmPassword': confirmPassword,
        },
      );
    } on DioException catch (error) {
      throw _recoveryException(error);
    }
  }

  PasswordRecoveryException _recoveryException(DioException error) {
    final data = error.response?.data;

    String? code;
    String? message;

    if (data is Map) {
      final rawCode = data['code'];

      final rawMessage = data['error'] ?? data['message'];

      if (rawCode is String) {
        code = rawCode.trim();
      }

      if (rawMessage is String && rawMessage.trim().isNotEmpty) {
        message = rawMessage.trim();
      }
    }

    return PasswordRecoveryException(
      statusCode: error.response?.statusCode,
      code: code,
      message: message ?? _dioErrorMessage(error),
    );
  }

  String _dioErrorMessage(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.receiveTimeout:
        return 'Connection timed out. Check your network.';

      case DioExceptionType.connectionError:
        return 'Cannot connect to server.';

      default:
        return 'Password recovery could not be completed.';
    }
  }
}
