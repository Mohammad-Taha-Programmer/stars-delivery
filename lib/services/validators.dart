class Validators {
  static const int minPasswordLength = 12;
  static const int maxPasswordLength = 128;

  static const Set<String> _insecurePasswords = {
    'admin123',
    'do-not-store-a-real-password-here',
    'changeme',
    'change-me',
    'change me',
  };

  static final RegExp _obviousPlaceholderPattern =
      RegExp(r'^(change|replace|your|example|placeholder|dummy)[-_ ]');

  static String? email(String? value) {
    if (value == null || value.trim().isEmpty) return 'مطلوب / Required';
    final emailRegex = RegExp(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$');
    if (!emailRegex.hasMatch(value.trim())) return 'بريد إلكتروني غير صالح / Invalid email';
    return null;
  }

  static String? password(String? value) {
    if (value == null || value.isEmpty) return 'مطلوب / Required';

    final normalized = value.trim().toLowerCase();

    if (value.trim().length < minPasswordLength ||
        value.length > maxPasswordLength) {
      return 'بين 12 و128 حرفاً / 12-128 characters';
    }

    if (_insecurePasswords.contains(normalized) ||
        _obviousPlaceholderPattern.hasMatch(normalized)) {
      return 'اختر كلمة مرور غير افتراضية / Avoid obvious placeholder passwords';
    }

    return null;
  }

  static String? phone(String? value) {
    if (value == null || value.trim().isEmpty) return 'مطلوب / Required';
    final phoneRegex = RegExp(r'^(\+?[0-9]{7,15})$');
    if (!phoneRegex.hasMatch(value.trim())) return 'رقم غير صالح / Invalid number';
    return null;
  }

  static String? required(String? value) {
    if (value == null || value.trim().isEmpty) return 'مطلوب / Required';
    return null;
  }

  static String? price(String? value) {
    if (value == null || value.trim().isEmpty) return 'مطلوب / Required';
    final price = double.tryParse(value.trim());
    if (price == null || price <= 0) return 'يجب أن يكون السعر أكبر من 0 / Price must be > 0';
    return null;
  }
}