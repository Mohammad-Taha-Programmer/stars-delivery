class Validators {
  static String? email(String? value) {
    if (value == null || value.trim().isEmpty) return 'مطلوب / Required';
    final emailRegex = RegExp(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$');
    if (!emailRegex.hasMatch(value.trim())) return 'بريد إلكتروني غير صالح / Invalid email';
    return null;
  }

  static String? password(String? value) {
    if (value == null || value.isEmpty) return 'مطلوب / Required';
    if (value.length < 6) return '6 أحرف على الأقل / Min 6 characters';
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