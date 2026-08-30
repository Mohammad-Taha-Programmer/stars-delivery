import 'package:equatable/equatable.dart';

abstract class PasswordRecoveryEvent extends Equatable {
  const PasswordRecoveryEvent();

  @override
  List<Object?> get props => [];
}

class RequestPasswordRecoveryCode extends PasswordRecoveryEvent {
  final String email;

  const RequestPasswordRecoveryCode({required this.email});

  @override
  List<Object?> get props => [email];
}

class SubmitPasswordRecoveryReset extends PasswordRecoveryEvent {
  final String email;
  final String code;
  final String newPassword;
  final String confirmPassword;

  const SubmitPasswordRecoveryReset({
    required this.email,
    required this.code,
    required this.newPassword,
    required this.confirmPassword,
  });

  // Deliberately exclude OTP/password values from Equatable
  // stringification/debug output.
  @override
  List<Object?> get props => [email];
}

class RestartPasswordRecovery extends PasswordRecoveryEvent {
  const RestartPasswordRecovery();
}
