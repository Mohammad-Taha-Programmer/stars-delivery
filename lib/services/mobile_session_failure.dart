import 'dart:async';

import 'package:dio/dio.dart';

class MobileSessionFailureEvent {
  final int statusCode;
  final String code;
  final String _bearerToken;

  const MobileSessionFailureEvent._({
    required this.statusCode,
    required this.code,
    required this._bearerToken,
  });

  bool belongsTo(String token) => _bearerToken == token;
}

class MobileSessionFailure {
  static final MobileSessionFailure instance = MobileSessionFailure();

  static const Set<String> _unauthorizedCodes = {
    'AUTH_REQUIRED',
    'SESSION_INVALID',
    'TOKEN_EXPIRED',
  };

  final StreamController<MobileSessionFailureEvent> _controller =
      StreamController<MobileSessionFailureEvent>.broadcast(sync: true);

  Stream<MobileSessionFailureEvent> get onRejected => _controller.stream;

  bool shouldReject(DioException error) {
    if (_bearerToken(error.requestOptions) == null) {
      return false;
    }

    final response = error.response;
    final status = response?.statusCode;
    final code = _responseCode(response?.data);

    if (status == 401 && code != null && _unauthorizedCodes.contains(code)) {
      return true;
    }

    return status == 403 && code == 'ACCOUNT_INACTIVE';
  }

  bool report(DioException error) {
    if (!shouldReject(error)) {
      return false;
    }

    final response = error.response;
    final status = response!.statusCode!;
    final code = _responseCode(response.data)!;
    final bearerToken = _bearerToken(error.requestOptions)!;

    _controller.add(
      MobileSessionFailureEvent._(
        statusCode: status,
        code: code,
        bearerToken: bearerToken,
      ),
    );

    return true;
  }

  String? _bearerToken(RequestOptions request) {
    for (final entry in request.headers.entries) {
      if (entry.key.toLowerCase() != 'authorization') {
        continue;
      }

      final value = entry.value?.toString().trim() ?? '';

      final match = RegExp(
        r'^Bearer\s+(\S+)$',
        caseSensitive: false,
      ).firstMatch(value);

      return match?.group(1);
    }

    return null;
  }

  String? _responseCode(dynamic data) {
    if (data is! Map) {
      return null;
    }

    final value = data['code'];

    if (value is! String || value.trim().isEmpty) {
      return null;
    }

    return value.trim();
  }
}
