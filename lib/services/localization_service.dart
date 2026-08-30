import 'package:flutter/material.dart';

class AppLocalization {
  final Locale locale;
  AppLocalization(this.locale);

  static bool _isAr(Locale l) => l.languageCode == 'ar';

  static String of(BuildContext context) {
    final loc = Localizations.localeOf(context).languageCode;
    return loc;
  }

  static bool isArabic(BuildContext context) => of(context) == 'ar';

  // Centralized string lookup
  static String get(BuildContext context, String key) {
    final ar = _isAr(Localizations.localeOf(context));
    return _strings[key]?[ar ? 'ar' : 'en'] ?? key;
  }

  static final Map<String, Map<String, String>> _strings = {
    // App
    'app_title': {'ar': 'تطبيق التوصيل السريع', 'en': 'Stars Delivery'},
    'stars_delivery': {'ar': 'ستارز دليفري', 'en': 'Stars Delivery'},
    'welcome_back': {'ar': 'مرحباً بعودتك', 'en': 'Welcome back!'},
    'create_account_hint': {'ar': 'إنشاء حساب جديد', 'en': 'Create your account'},

    // Roles
    'customer': {'ar': 'عميل', 'en': 'Customer'},
    'provider': {'ar': 'سائق', 'en': 'Provider'},
    'customer_subtitle': {'ar': 'أحتاج توصيل', 'en': 'Need delivery'},
    'provider_subtitle': {'ar': 'أقدم خدمة التوصيل', 'en': 'Offer delivery'},

    // Auth
    'sign_in': {'ar': 'تسجيل الدخول', 'en': 'Sign In'},
    'sign_up': {'ar': 'إنشاء حساب', 'en': 'Sign Up'},
    'create_account': {'ar': 'إنشاء حساب', 'en': 'Create Account'},
    'full_name': {'ar': 'الاسم الكامل', 'en': 'Full Name'},
    'phone_number': {'ar': 'رقم الهاتف', 'en': 'Phone Number'},
    'email': {'ar': 'البريد الإلكتروني', 'en': 'Email'},
    'password': {'ar': 'كلمة المرور', 'en': 'Password'},
    'area_region': {'ar': 'المنطقة', 'en': 'Area / Region'},
    'no_account': {'ar': 'ليس لديك حساب؟ ', 'en': "Don't have an account? "},
    'have_account': {'ar': 'لديك حساب بالفعل؟ ', 'en': 'Already have an account? '},
    'required': {'ar': 'مطلوب', 'en': 'Required'},
    'invalid_email': {'ar': 'بريد إلكتروني غير صالح', 'en': 'Invalid email'},
    'min_password': {'ar': 'بين 12 و128 حرفاً', 'en': '12-128 characters'},
    'confirm_password': {'ar': 'تأكيد كلمة المرور', 'en': 'Confirm Password'},
    'password_mismatch': {'ar': 'كلمتا المرور غير متطابقتين', 'en': 'Passwords do not match'},
    'forgot_password': {
      'ar': 'نسيت كلمة المرور؟',
      'en': 'Forgot password?',
    },
    'password_recovery': {
      'ar': 'استعادة كلمة المرور',
      'en': 'Password Recovery',
    },
    'recovery_email_instructions': {
      'ar': 'أدخل البريد الإلكتروني المرتبط بحسابك.',
      'en': 'Enter the email address associated with your account.',
    },
    'send_recovery_code': {
      'ar': 'إرسال رمز الاستعادة',
      'en': 'Send Recovery Code',
    },
    'recovery_code': {
      'ar': 'رمز الاستعادة',
      'en': 'Recovery Code',
    },
    'recovery_code_generic_notice': {
      'ar': 'إذا كان هناك حساب مؤهل مرتبط بهذا البريد، فسيتم إرسال رمز الاستعادة إليه.',
      'en': 'If an eligible account exists for this email, a recovery code will be sent.',
    },
    'new_password': {
      'ar': 'كلمة المرور الجديدة',
      'en': 'New Password',
    },
    'reset_password': {
      'ar': 'تغيير كلمة المرور',
      'en': 'Reset Password',
    },
    'change_recovery_email': {
      'ar': 'استخدام بريد إلكتروني آخر',
      'en': 'Use a different email',
    },
    'invalid_recovery_code': {
      'ar': 'يجب أن يتكون رمز الاستعادة من 8 أرقام.',
      'en': 'Recovery code must contain exactly 8 digits.',
    },
    'recovery_invalid': {
      'ar': 'رمز الاستعادة غير صالح أو منتهي الصلاحية.',
      'en': 'The recovery code is invalid or expired.',
    },
    'recovery_rate_limited': {
      'ar': 'تم إجراء محاولات كثيرة. حاول مرة أخرى لاحقاً.',
      'en': 'Too many recovery attempts. Please try again later.',
    },
    'recovery_unavailable': {
      'ar': 'خدمة استعادة كلمة المرور غير متاحة حالياً.',
      'en': 'Password recovery is temporarily unavailable.',
    },
    'recovery_failed': {
      'ar': 'تعذر إكمال استعادة كلمة المرور. حاول مرة أخرى.',
      'en': 'Password recovery could not be completed. Please try again.',
    },
    'recovery_reset_success': {
      'ar': 'تم تغيير كلمة المرور. سجل الدخول باستخدام كلمة المرور الجديدة.',
      'en': 'Password changed. Sign in with your new password.',
    },

    // Create Order
    'delivery_location': {'ar': 'موقع التوصيل', 'en': 'Delivery Location'},
    'location_hint': {'ar': 'إلى أين يأتيك السائق؟', 'en': 'Where should the driver come to you?'},
    'invalid_phone': {'ar': 'رقم هاتف غير صالح', 'en': 'Invalid phone number'},

    // Home
    'new_order': {'ar': 'إنشاء طلب جديد', 'en': 'New Order'},
    'my_orders': {'ar': 'طلباتي', 'en': 'My Orders'},
    'offers_title': {'ar': 'عروض اسعار السائقين', 'en': 'Driver Price Offers'},
    'report_30': {'ar': 'تقرير الطلبات - آخر 30 يوم', 'en': 'Orders Report - Last 30 Days'},

    // Order types
    'product': {'ar': 'طلب منتج', 'en': 'Product Order'},
    'people': {'ar': 'طلب توصيل أشخاص', 'en': 'People Transport'},
    'goods': {'ar': 'طلب نقل بضاعة', 'en': 'Goods Transport'},
    'product_label': {'ar': 'المنتج المطلوب', 'en': 'Required Product'},
    'people_label': {'ar': 'خدمة النقل المطلوبة', 'en': 'Transport Service'},
    'goods_label': {'ar': 'الشحنة المطلوبة', 'en': 'Required Shipment'},
    'desc_hint': {'ar': 'اشرح ماذا تريد بالضبط، ليتسنى للسائق اعطائك عرض سعر بقيمة التوصيل وليس بقيمة المنتجات المطلوبة', 'en': 'Describe what you need so the driver can give a delivery price quote'},
    'phone_label': {'ar': 'رقم الهاتف للتواصل', 'en': 'Contact Phone'},
    'phone_hint': {'ar': 'هذا الرقم لن يظهر للسائق إلا عند قبولك لعرض السعر', 'en': 'Phone hidden until you accept an offer'},
    'submit_order': {'ar': 'إرسال الطلب', 'en': 'Submit Order'},
    'order_sent': {'ar': 'تم إرسال الطلب إلى مقدمي الخدمة', 'en': 'Order sent to providers'},
    'max_3_photos': {'ar': 'يمكنك إضافة 3 صور كحد أقصى', 'en': 'Maximum 3 images allowed'},
    'add_photos': {'ar': 'إضافة صور (حد أقصى 3)', 'en': 'Add Photos (Max 3)'},
    'add_more_photos': {'ar': 'إضافة صورة أخرى', 'en': 'Add Another Photo'},

    // Order statuses
    'status_pending': {'ar': 'قيد الانتظار', 'en': 'Pending'},
    'status_offered': {'ar': 'عروض متوفرة', 'en': 'Offers Available'},
    'status_accepted': {'ar': 'تم قبول عرض', 'en': 'Offer Accepted'},
    'status_fulfilling': {'ar': 'جاري التوصيل', 'en': 'Delivering'},
    'status_completed': {'ar': 'تم التوصيل', 'en': 'Completed'},

    // Provider dashboard
    'provider_dashboard': {'ar': 'لوحة تحكم السائق', 'en': 'Provider Dashboard'},
    'daily_earnings': {'ar': 'أرباحك هذا اليوم', 'en': 'Daily Earnings'},
    'monthly_earnings': {'ar': 'أرباحك هذا الشهر', 'en': 'Monthly Earnings'},
    'today_orders': {'ar': ' طلبات اليوم', 'en': ' orders today'},
    'order_count': {'ar': ' طلب', 'en': ' orders'},
    'pending_orders_btn': {'ar': 'طلبات جديدة تنتظر تقديم عرض سعر', 'en': 'New Orders Awaiting Your Offer'},
    'offered_orders_btn': {'ar': 'الطلبات التي تم تقديم عرض سعر لها', 'en': 'Orders With Submitted Offers'},
    'active_orders_btn': {'ar': 'طلباتي النشطة - التوصيل والتسليم', 'en': 'My Active Orders - Delivery'},
    'platform_commission': {'ar': 'عمولة المنصة (مستحقة الدفع):', 'en': 'Platform Commission (Due):'},
    'commission_body': {'ar': ' شيكل بناء على الطلبات الناجحة', 'en': ' ILS based on successful orders'},
    'ils': {'ar': 'ILS', 'en': 'ILS'},
    'shekel': {'ar': 'شيكل', 'en': 'SHE'},
    'successful_orders': {'ar': 'طلب ناجح', 'en': 'Successful Orders'},
    'commission_detail': {'ar': 'شيكل بناء على الطلبات الناجحة', 'en': 'SHE based on completed orders'},

    // Offers
    'delivery_price': {'ar': 'سعر التوصيل (شيكل)', 'en': 'Delivery Price (ILS)'},
    'delivery_time': {'ar': 'الوقت المطلوب لتوصيل الطرد', 'en': 'Estimated Delivery Time'},
    'custom_time': {'ar': 'وقت مخصص (دقائق)', 'en': 'Custom Time (minutes)'},
    'submit_offer': {'ar': 'تقديم عرض سعر', 'en': 'Submit Offer'},
    'send_offer': {'ar': 'إرسال العرض', 'en': 'Send Offer'},
    'price_required': {'ar': 'السعر مطلوب', 'en': 'Price required'},
    'invalid_price': {'ar': 'سعر غير صالح', 'en': 'Invalid price'},
    'offer_sent': {'ar': 'تم إرسال عرض السعر', 'en': 'Offer sent successfully'},
    'your_price': {'ar': 'سعر التوصيل', 'en': 'Delivery Price'},
    'price_hint': {'ar': 'أدخل سعر التوصيل بالشيكل', 'en': 'Enter delivery price in SHE'},
    'offers_list': {'ar': 'عروض الأسعار', 'en': 'Price Offers'},
    'no_offers': {'ar': 'لا توجد عروض بعد', 'en': 'No offers yet'},
    'accepted': {'ar': 'مقبول', 'en': 'Accepted'},
    'rejected': {'ar': 'مرفوض', 'en': 'Rejected'},
    'accept_offer': {'ar': 'قبول العرض', 'en': 'Accept Offer'},

    // Notifications
    'notifications': {'ar': 'الإشعارات', 'en': 'Notifications'},
    'mark_all_read': {'ar': 'تحديد الكل كمقروء', 'en': 'Mark All as Read'},
    'no_notifications': {'ar': 'لا توجد إشعارات', 'en': 'No notifications'},

    // Pending orders
    'new_orders_title': {'ar': 'الطلبات الجديدة', 'en': 'New Orders'},
    'no_new_orders': {'ar': 'لا توجد طلبات جديدة', 'en': 'No new orders'},
    'hidden_phone': {'ar': 'رقم مخفي', 'en': 'Hidden Phone'},
    'submit_offer_btn': {'ar': 'تقديم عرض سعر', 'en': 'Submit Offer'},

    // General
    'loading': {'ar': 'جاري التحميل...', 'en': 'Loading...'},
    'error': {'ar': 'خطأ', 'en': 'Error'},
    'back': {'ar': 'رجوع', 'en': 'Back'},
    'save': {'ar': 'حفظ', 'en': 'Save'},
    'cancel': {'ar': 'إلغاء', 'en': 'Cancel'},
    'confirm': {'ar': 'تأكيد', 'en': 'Confirm'},
    'no_orders': {'ar': 'لا توجد طلبات', 'en': 'No orders'},
    'order_details': {'ar': 'تفاصيل الطلب', 'en': 'Order Details'},
    'description': {'ar': 'الوصف', 'en': 'Description'},
    'images': {'ar': 'الصور', 'en': 'Images'},
    'phone_hidden': {'ar': 'رقم مخفي', 'en': 'Hidden Phone'},
    'settings': {'ar': 'الإعدادات', 'en': 'Settings'},
    'language': {'ar': 'اللغة', 'en': 'Language'},
    'theme': {'ar': 'المظهر', 'en': 'Theme'},
    'light': {'ar': 'فاتح', 'en': 'Light'},
    'dark': {'ar': 'داكن', 'en': 'Dark'},

    // Real-time
    'new_offer_received': {'ar': 'عرض سعر جديد:', 'en': 'New offer:'},

    // Offers screen
    'driver_offers_for': {'ar': 'عروض السائقين للطلب', 'en': 'Driver Offers for Order'},
    'accept': {'ar': 'قبول', 'en': 'Accept'},
    'offers_not_loaded': {'ar': 'اضغط على الطلب لعرض عروض الأسعار', 'en': 'Tap order to view offers'},

    // My orders screen
    'tap_to_view_offers': {'ar': 'اضغط لعرض العروض', 'en': 'Tap to view offers'},

    // Active orders
    'start_delivery': {'ar': 'بدء التوصيل', 'en': 'Start Delivering'},
    'confirm_delivery': {'ar': 'تأكيد التسليم', 'en': 'Confirm Delivery'},
    'status_updated': {'ar': 'تم تحديث الحالة', 'en': 'Status Updated'},
    'order_completed_msg': {'ar': 'تم اكتمال الطلب بنجاح', 'en': 'Order completed successfully'},
    'price': {'ar': 'السعر', 'en': 'Price'},

    // Provider dashboard
    'offered_orders_btn': {'ar': 'الطلبات التي تم تقديم عرض سعر لها', 'en': 'Orders With Submitted Offers'},

    // Reports
    'report_driver': {'ar': 'الابلاغ عن سائق', 'en': 'Report a Driver'},
    'report_customer': {'ar': 'الابلاغ عن زبون', 'en': 'Report a Customer'},
    'report_sent': {'ar': 'تم إرسال البلاغ بنجاح', 'en': 'Report sent successfully'},
    'in_review': {'ar': 'قيد المراجعة', 'en': 'In Review'},
    'in_progress': {'ar': 'قيد المعالجة', 'en': 'In Progress'},
    'resolved': {'ar': 'تم الحل', 'en': 'Resolved'},
    'enter_id': {'ar': 'أدخل ID الشخص المراد الإبلاغ عنه', 'en': 'Enter the ID of the person to report'},
    'problem_desc': {'ar': 'وصف المشكلة', 'en': 'Problem Description'},
    'explain_problem': {'ar': 'اشرح المشكلة التي تواجهها', 'en': 'Explain the problem you are facing'},
    'send_report_btn': {'ar': 'إرسال البلاغ', 'en': 'Send Report'},
    'last_reports': {'ar': 'آخر البلاغات', 'en': 'Previous Reports'},
    'no_reports': {'ar': 'لا توجد بلاغات سابقة', 'en': 'No previous reports'},
    'support_team': {'ar': 'الدعم الفني', 'en': 'Support Team'},
    'you': {'ar': 'أنت', 'en': 'You'},

    // Chat
    'start_chat': {'ar': 'ابدأ محادثة مع فريق الدعم', 'en': 'Start a conversation with support'},
    'type_message': {'ar': 'اكتب رسالتك...', 'en': 'Type your message...'},

    // Time
    'est_time': {'ar': 'الوقت المطلوب: %d دقيقة', 'en': 'Estimated time: %d minutes'},
    'minutes_suffix': {'ar': 'د', 'en': 'm'},

    // Offered orders
    'no_offered_orders': {'ar': 'لا توجد طلبات', 'en': 'No orders'},
    'awaiting_response': {'ar': 'بانتظار الرد', 'en': 'Awaiting Response'},

    // Contact form
    'name_field': {'ar': 'الاسم', 'en': 'Name'},
    'email_field': {'ar': 'البريد الإلكتروني', 'en': 'Email'},
    'phone_field': {'ar': 'رقم الجوال', 'en': 'Phone Number'},
    'message_field': {'ar': 'رسالتك', 'en': 'Your Message'},
    'message_hint': {'ar': 'اكتب مشكلتك هنا...', 'en': 'Type your issue here...'},
    'contact_success': {'ar': 'تم إرسال رسالتك. سنتواصل معك قريباً.', 'en': 'Message sent. We will contact you soon.'},
    'contact_failed': {'ar': 'فشل الإرسال. حاول مرة أخرى.', 'en': 'Send failed. Try again.'},
  };
}