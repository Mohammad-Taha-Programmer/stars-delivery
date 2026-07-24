import 'dart:convert';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'auth_event.dart';
import 'auth_state.dart';
import '../../services/auth_service.dart';
import '../../models/user_model.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final AuthService _authService = AuthService();

  AuthBloc() : super(AuthInitial()) {
    on<CheckAuthEvent>(_onCheckAuth);
    on<LoginEvent>(_onLogin);
    on<RegisterEvent>(_onRegister);
    on<ToggleAuthModeEvent>(_onToggle);
    on<LogoutEvent>(_onLogout);
    add(CheckAuthEvent());
  }

  Future<void> _onCheckAuth(CheckAuthEvent event, Emitter<AuthState> emit) async {
    final prefs = await SharedPreferences.getInstance();
    final savedToken = prefs.getString('auth_token');
    final savedUser = prefs.getString('auth_user');
    if (savedToken != null && savedUser != null) {
      try {
        final user = UserModel.fromJson(jsonDecode(savedUser));
        emit(AuthSuccess(user: user, token: savedToken));
        return;
      } catch (_) {
        await prefs.remove('auth_token');
        await prefs.remove('auth_user');
      }
    }
  }

  Future<void> _onLogin(LoginEvent event, Emitter<AuthState> emit) async {
    emit(AuthLoading());
    try {
      final data = await _authService.login(event.email, event.password, event.role);
      final user = UserModel.fromJson(data['user']);
      final token = data['token'].toString();
      await _saveAuth(user, token);
      emit(AuthSuccess(user: user, token: token));
    } catch (e) {
      emit(AuthError(message: e.toString().replaceFirst('Exception: ', '')));
    }
  }

  Future<void> _onRegister(RegisterEvent event, Emitter<AuthState> emit) async {
    emit(AuthLoading());
    try {
      final data = await _authService.register(
        event.fullName, event.email, event.phone, event.password, event.role, event.area,
        privacyPolicy: event.privacyPolicy,
      );
      // Provider signups go through admin approval
      if (data['pending'] == true) {
        emit(AuthInitial());
        emit(AuthError(message: data['message'] ?? 'تم تقديم الطلب بنجاح، حسابك قيد المراجعة'));
        return;
      }
      final user = UserModel.fromJson(data['user']);
      final token = data['token'].toString();
      await _saveAuth(user, token);
      emit(AuthSuccess(user: user, token: token));
    } catch (e) {
      emit(AuthError(message: e.toString().replaceFirst('Exception: ', '')));
    }
  }

  void _onToggle(ToggleAuthModeEvent event, Emitter<AuthState> emit) {
    emit(AuthInitial());
  }

  Future<void> _onLogout(LogoutEvent event, Emitter<AuthState> emit) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('auth_user');
    emit(AuthInitial());
  }

  Future<void> _saveAuth(UserModel user, String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
    await prefs.setString('auth_user', jsonEncode(user.toJson()));
  }
}
