import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../bloc/auth/auth_bloc.dart';
import '../bloc/auth/auth_event.dart';
import '../bloc/auth/auth_state.dart';
import '../bloc/app/app_bloc.dart';
import '../bloc/app/app_event.dart';
import '../bloc/provider/provider_bloc.dart';
import '../services/responsive.dart';
import '../services/localization_service.dart';
import '../services/api_config.dart';
import 'home_screen.dart';
import 'provider_home_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  bool _isLogin = true;
  String _selectedRole = 'customer';
  List<String> _areas = [];
  List<String> _areasAr = []; // Always Arabic for saving
  static const _areaEnToAr = {
    'Jerusalem (Quds)': 'القدس', 'Ramallah': 'رام الله والبيرة', 'Hebron': 'الخليل',
    'Nablus': 'نابلس', 'Bethlehem': 'بيت لحم', 'Jericho': 'أريحا',
    'Salfit': 'سلفيت', 'Jenin': 'جنين', 'Tulkarm': 'طولكرم',
    'Qalqilya': 'قلقيلية', 'Tubas': 'طوباس',
    'Gaza': 'غزة', 'Khan Yunis': 'خان يونس', 'Rafah': 'رفح',
    'Deir El Balah': 'دير البلح', 'North Gaza': 'شمال غزة',
    'Haifa': 'حيفا', 'Acre': 'عكا', 'Nazareth': 'الناصرة', 'Jaffa': 'يافا',
  };

  // Ensure all keys are trimmed for matching
  static final _areaEnToArTrimmed = {for (var k in _areaEnToAr.keys) k.trim(): _areaEnToAr[k]!};

  String _areaLabel(String enName, bool isAr) {
    if (isAr) return _areaEnToArTrimmed[enName.trim()] ?? enName.replaceFirst(' (Quds)', '').trim();
    return enName.replaceFirst(' (Quds)', '').trim();
  }
  String? _selectedArea;

  @override
  void initState() {
    super.initState();
    _loadAreas();
  }

  Future<void> _loadAreas() async {
    try {
      final json = await rootBundle.loadString('assets/countries+states+cities.json');
      final list = jsonDecode(json) as List;
      final palestine = list.cast<Map<String, dynamic>>().firstWhere(
        (c) => c['iso2'] == 'PS',
      );
      final states = palestine['states'] as List;
      final names = states.cast<Map<String, dynamic>>().map((s) => s['name'].toString()).toList();
      // Add interior/cross-area cities not in the JSON
      final allNames = [...names, 'Haifa', 'Acre', 'Nazareth', 'Jaffa'];
      setState(() {
        _areas = allNames;
        _areasAr = allNames.map((n) => _areaEnToArTrimmed[n.trim()] ?? n.trim()).toList();
      });
    } catch (_) {}
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _nameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isMobile = Responsive.isMobile(context);
    final hPad = Responsive.paddingHorizontal(context);
    final isAr = context.watch<AppBloc>().state.locale.languageCode == 'ar';
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 480),
              child: Padding(
                padding: EdgeInsets.symmetric(horizontal: hPad, vertical: Responsive.paddingVertical(context)),
                child: Column(
                  children: [
                    // Language toggle
                    Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        TextButton(
                          onPressed: () => context.read<AppBloc>().add(ToggleLocale()),
                          child: Text(isAr ? 'EN' : 'ع', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey[700], fontSize: 16)),
                        ),
                      ],
                    ),
                    SizedBox(height: isMobile ? 40 : 20),
                // Logo & Title
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
color: Colors.white.withValues(alpha: 0.9),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.local_shipping, size: 64, color: Color(0xFF1a237e)),
                ),
                const SizedBox(height: 16),
                Text(
                  AppLocalization.get(context, 'stars_delivery'),
                  style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                    color: Colors.grey[800],
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  _isLogin
                      ? AppLocalization.get(context, 'welcome_back')
                      : AppLocalization.get(context, 'create_account_hint'),
                  style: TextStyle(fontSize: 16, color: Colors.grey[600]),
                ),
                const SizedBox(height: 40),
                // Role Selection Cards
                Row(
                  children: [
                    Expanded(
                      child: _RoleCard(
                        icon: Icons.person,
                        title: AppLocalization.get(context, 'customer'),
                        subtitle: AppLocalization.get(context, 'customer_subtitle'),
                        isSelected: _selectedRole == 'customer',
                        onTap: () => setState(() => _selectedRole = 'customer'),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: _RoleCard(
                        icon: Icons.delivery_dining,
                        title: AppLocalization.get(context, 'provider'),
                        subtitle: AppLocalization.get(context, 'provider_subtitle'),
                        isSelected: _selectedRole == 'provider',
                        onTap: () => setState(() => _selectedRole = 'provider'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 32),
                // Form Card
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
color: Colors.black.withValues(alpha: 0.1),
                        blurRadius: 20,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        if (!_isLogin) ...[
                          TextFormField(
                            controller: _nameController,
                            decoration: _inputDecoration(AppLocalization.get(context, 'full_name'), Icons.person_outline),
                            validator: (v) => v!.isEmpty ? AppLocalization.get(context, 'required') : null,
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _phoneController,
                            decoration: _inputDecoration(AppLocalization.get(context, 'phone_number'), Icons.phone_outlined),
                            keyboardType: TextInputType.phone,
                            validator: (v) => v!.isEmpty ? AppLocalization.get(context, 'required') : null,
                          ),
                          const SizedBox(height: 16),
                          DropdownButtonFormField<String>(
                            initialValue: _selectedArea,
                            decoration: _inputDecoration(AppLocalization.get(context, 'area_region'), Icons.location_on_outlined),
                            items: _areas.asMap().entries.map((e) => DropdownMenuItem(
                              value: _areasAr[e.key],
                              child: Text(_areaLabel(e.value, isAr)),
                            )).toList(),
                            onChanged: (v) => setState(() => _selectedArea = v),
                            validator: (v) => v == null ? AppLocalization.get(context, 'required') : null,
                          ),
                          const SizedBox(height: 16),
                        ],
                        TextFormField(
                          controller: _emailController,
                          decoration: _inputDecoration(AppLocalization.get(context, 'email'), Icons.email_outlined),
                          keyboardType: TextInputType.emailAddress,
                          validator: (v) => v!.isEmpty ? AppLocalization.get(context, 'required') : null,
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: _passwordController,
                          decoration: _inputDecoration(AppLocalization.get(context, 'password'), Icons.lock_outline),
                          obscureText: true,
                          validator: (v) => v!.length < 6 ? AppLocalization.get(context, 'min_password') : null,
                        ),
                        const SizedBox(height: 24),
                        BlocConsumer<AuthBloc, AuthState>(
                          listener: (context, state) {
                            if (state is AuthSuccess) {
                              final home = state.user.role == 'provider'
                                  ? BlocProvider(
                                      create: (_) => ProviderBloc(),
                                      child: ProviderHomeScreen(
                                        user: state.user,
                                        token: state.token,
                                      ),
                                    )
                                  : HomeScreen(
                                      user: state.user,
                                      role: state.user.role,
                                      token: state.token,
                                    );
                              Navigator.pushReplacement(
                                context,
                                MaterialPageRoute(builder: (_) => home),
                              );
                            }
                            if (state is AuthError) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text(state.message), backgroundColor: Colors.red),
                              );
                            }
                          },
                          builder: (context, state) {
                            final isLoading = state is AuthLoading;
                            return ElevatedButton(
                              onPressed: isLoading ? null : _submit,
                              style: ElevatedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 16),
                                backgroundColor: const Color(0xFF1a237e),
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                              child: isLoading
                                ? const SizedBox(
                                    height: 20,
                                    width: 20,
                                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                  )
                                : Text(
                                    _isLogin ? AppLocalization.get(context, 'sign_in') : AppLocalization.get(context, 'create_account'),
                                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                                  ),
                            );
                          },
                        ),
                        const SizedBox(height: 16),
                        TextButton(
                          onPressed: () {
                            setState(() => _isLogin = !_isLogin);
                            context.read<AuthBloc>().add(ToggleAuthModeEvent(isLogin: _isLogin));
                          },
                          child: RichText(
                            text: TextSpan(
                              style: TextStyle(color: Colors.grey[600]),
                              children: [
                                TextSpan(
                                  text: _isLogin ? AppLocalization.get(context, 'no_account') : AppLocalization.get(context, 'have_account'),
                                ),
                                TextSpan(
                                  text: _isLogin ? AppLocalization.get(context, 'sign_up') : AppLocalization.get(context, 'sign_in'),
                                  style: const TextStyle(
                                    color: Color(0xFF1a237e),
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        TextButton.icon(
                          onPressed: () => _showContactDialog(),
                          icon: const Icon(Icons.headset_mic_outlined, size: 18, color: Colors.orange),
                          label: Text(AppLocalization.get(context, 'contact_support'), style: TextStyle(color: Colors.orange, fontSize: 14)),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 40),
              ],
            ),
          ),
          ),
        ),
        ),
      ),
    );
  }

  String get selectedRole => _selectedRole;

  InputDecoration _inputDecoration(String label, IconData icon) {
    return InputDecoration(
      labelText: label,
      prefixIcon: Icon(icon, color: const Color(0xFF1a237e)),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.grey.shade300),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.grey.shade300),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFF1a237e), width: 2),
      ),
    );
  }

  void _showContactDialog() {
    final nameCtrl = TextEditingController();
    final emailCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    final msgCtrl = TextEditingController();
    final formKey = GlobalKey<FormState>();
    showDialog(
      context: context,
      builder: (_) => StatefulBuilder(
        builder: (ctx, setDialogState) {
          bool sending = false;
          return AlertDialog(
            title: const Row(
              children: [
                Icon(Icons.headset_mic, color: Colors.orange),
                SizedBox(width: 8),
                Text('التواصل مع الدعم', style: TextStyle(fontSize: 16)),
              ],
            ),
            content: Form(
              key: formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextFormField(
                    controller: nameCtrl,
                    decoration: const InputDecoration(labelText: 'الاسم', border: OutlineInputBorder()),
                    validator: (v) => (v == null || v.trim().isEmpty) ? 'مطلوب' : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: emailCtrl,
                    decoration: const InputDecoration(labelText: 'البريد الإلكتروني', border: OutlineInputBorder()),
                    keyboardType: TextInputType.emailAddress,
                    validator: (v) => (v == null || v.trim().isEmpty) ? 'مطلوب' : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: phoneCtrl,
                    decoration: const InputDecoration(labelText: 'رقم الجوال', border: OutlineInputBorder()),
                    keyboardType: TextInputType.phone,
                    validator: (v) => (v == null || v.trim().isEmpty) ? 'مطلوب' : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: msgCtrl,
                    maxLines: 3,
                    decoration: const InputDecoration(
                      labelText: 'رسالتك',
                      hintText: 'اكتب مشكلتك هنا...',
                      border: OutlineInputBorder(),
                    ),
                    validator: (v) => (v == null || v.trim().isEmpty) ? 'مطلوب' : null,
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: sending ? null : () => Navigator.pop(ctx),
                child: const Text('إلغاء'),
              ),
              ElevatedButton(
                onPressed: sending ? null : () async {
                  if (!formKey.currentState!.validate()) return;
                  setDialogState(() => sending = true);
                  try {
                    final dio = Dio(BaseOptions(
                      baseUrl: ApiConfig.apiUrl,
                      connectTimeout: const Duration(seconds: 8),
                    ));
                    await dio.post('/chat/contact', data: {
                      'name': nameCtrl.text.trim(),
                      'email': emailCtrl.text.trim(),
                      'phone': phoneCtrl.text.trim(),
                      'text': msgCtrl.text.trim(),
                    });
                    if (!ctx.mounted) return;
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('تم إرسال رسالتك. سنتواصل معك قريباً.'), backgroundColor: Colors.green),
                    );
                  } catch (_) {
                    if (!ctx.mounted) return;
                    setDialogState(() => sending = false);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('فشل الإرسال. حاول مرة أخرى.'), backgroundColor: Colors.red),
                    );
                  }
                },
                style: ElevatedButton.styleFrom(backgroundColor: Colors.orange, foregroundColor: Colors.white),
                child: sending
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('إرسال'),
              ),
            ],
          );
        },
      ),
    );
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;

    final email = _emailController.text.trim();
    final password = _passwordController.text;

    if (_isLogin) {
      context.read<AuthBloc>().add(LoginEvent(email: email, password: password, role: _selectedRole));
    } else {
      context.read<AuthBloc>().add(RegisterEvent(
        fullName: _nameController.text.trim(),
        email: email,
        phone: _phoneController.text.trim(),
        password: password,
        role: _selectedRole,
        area: _selectedArea ?? '',
      ));
    }
  }
}

class _RoleCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final bool isSelected;
  final VoidCallback onTap;

  const _RoleCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 12),
        decoration: BoxDecoration(
          color: isSelected ? Colors.white : Colors.grey[100],
          borderRadius: BorderRadius.circular(16),
          border: isSelected
              ? Border.all(color: Colors.orange, width: 2)
              : null,
          boxShadow: isSelected
              ? [BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 10, offset: const Offset(0, 4))]
              : null,
        ),
        child: Column(
          children: [
            Icon(icon, size: 36, color: isSelected ? Colors.orange : Colors.grey[600]),
            const SizedBox(height: 8),
            Text(
              title,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: isSelected ? Colors.orange : Colors.grey[700],
              ),
            ),
            const SizedBox(height: 4),
            Text(
              subtitle,
              style: TextStyle(
                fontSize: 12,
                color: isSelected ? Colors.grey[600] : Colors.grey[500],
              ),
            ),
          ],
        ),
      ),
    );
  }
}