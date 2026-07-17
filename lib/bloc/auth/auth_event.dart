import 'package:equatable/equatable.dart';

abstract class AuthEvent extends Equatable {
  const AuthEvent();

  @override
  List<Object?> get props => [];
}

class CheckAuthEvent extends AuthEvent {}

class LoginEvent extends AuthEvent {
  final String email;
  final String password;
  final String role;

  const LoginEvent({
    required this.email,
    required this.password,
    required this.role,
  });

  @override
  List<Object?> get props => [email, password, role];
}

class RegisterEvent extends AuthEvent {
  final String fullName;
  final String email;
  final String phone;
  final String password;
  final String role;
  final String area;

  const RegisterEvent({
    required this.fullName,
    required this.email,
    required this.phone,
    required this.password,
    required this.role,
    required this.area,
  });

  @override
  List<Object?> get props => [fullName, email, phone, password, role, area];
}

class ToggleAuthModeEvent extends AuthEvent {
  final bool isLogin;

  const ToggleAuthModeEvent({required this.isLogin});

  @override
  List<Object?> get props => [isLogin];
}

class LogoutEvent extends AuthEvent {}
