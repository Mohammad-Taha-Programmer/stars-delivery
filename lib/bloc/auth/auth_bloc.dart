import 'package:flutter_bloc/flutter_bloc.dart';
import 'auth_event.dart';
import 'auth_state.dart';
import '../../services/auth_service.dart';
import '../../models/user_model.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final AuthService _authService = AuthService();

  AuthBloc() : super(AuthInitial()) {
    on<LoginEvent>(_onLogin);
    on<RegisterEvent>(_onRegister);
    on<ToggleAuthModeEvent>(_onToggle);
  }

  Future<void> _onLogin(LoginEvent event, Emitter<AuthState> emit) async {
    emit(AuthLoading());
    try {
      final data = await _authService.login(event.email, event.password, event.role);
      emit(AuthSuccess(
        user: UserModel.fromJson(data['user']),
        token: data['token'],
      ));
    } catch (e) {
      emit(AuthError(message: e.toString().replaceFirst('Exception: ', '')));
    }
  }

  Future<void> _onRegister(RegisterEvent event, Emitter<AuthState> emit) async {
    emit(AuthLoading());
    try {
      final data = await _authService.register(
        event.fullName, event.email, event.phone, event.password, event.role, event.area,
      );
      emit(AuthSuccess(
        user: UserModel.fromJson(data['user']),
        token: data['token'],
      ));
    } catch (e) {
      emit(AuthError(message: e.toString().replaceFirst('Exception: ', '')));
    }
  }

  void _onToggle(ToggleAuthModeEvent event, Emitter<AuthState> emit) {
    emit(AuthInitial());
  }
}