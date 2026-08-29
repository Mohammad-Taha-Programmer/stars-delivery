import 'dart:convert';

class JwtToken {
  static Map<String, dynamic>? _payload(String token) {
    final parts = token.split('.');
    if (parts.length != 3) return null;

    try {
      final normalized = base64Url.normalize(parts[1]);
      final decoded = utf8.decode(base64Url.decode(normalized));
      final value = jsonDecode(decoded);

      if (value is! Map<String, dynamic>) return null;
      return value;
    } catch (_) {
      return null;
    }
  }

  static DateTime? expiresAt(String token) {
    final payload = _payload(token);
    final exp = payload?['exp'];

    if (exp is! num) return null;

    return DateTime.fromMillisecondsSinceEpoch(exp.toInt() * 1000, isUtc: true);
  }

  static bool isRestorable(
    String token, {
    DateTime? now,
    Duration clockSkew = const Duration(seconds: 30),
  }) {
    final payload = _payload(token);

    if (payload == null) return false;

    final id = payload['id'];
    final role = payload['role'];
    final expiry = expiresAt(token);

    if (id is! String || id.trim().isEmpty) return false;
    if (role != 'customer' && role != 'provider') return false;
    if (expiry == null) return false;

    final current = (now ?? DateTime.now()).toUtc();

    return expiry.isAfter(current.add(clockSkew));
  }
}
