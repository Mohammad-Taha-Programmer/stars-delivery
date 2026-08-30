import 'package:equatable/equatable.dart';

enum PasswordRecoveryStage { requestEmail, enterCode }

class PasswordRecoveryState extends Equatable {
  static const Object _unset = Object();

  final PasswordRecoveryStage stage;
  final bool isLoading;
  final String email;
  final String? errorCode;
  final String? errorMessage;
  final bool completed;

  const PasswordRecoveryState({
    required this.stage,
    required this.isLoading,
    required this.email,
    required this.errorCode,
    required this.errorMessage,
    required this.completed,
  });

  const PasswordRecoveryState.initial()
    : stage = PasswordRecoveryStage.requestEmail,
      isLoading = false,
      email = '',
      errorCode = null,
      errorMessage = null,
      completed = false;

  PasswordRecoveryState copyWith({
    PasswordRecoveryStage? stage,
    bool? isLoading,
    String? email,
    Object? errorCode = _unset,
    Object? errorMessage = _unset,
    bool? completed,
  }) {
    return PasswordRecoveryState(
      stage: stage ?? this.stage,
      isLoading: isLoading ?? this.isLoading,
      email: email ?? this.email,
      errorCode: identical(errorCode, _unset)
          ? this.errorCode
          : errorCode as String?,
      errorMessage: identical(errorMessage, _unset)
          ? this.errorMessage
          : errorMessage as String?,
      completed: completed ?? this.completed,
    );
  }

  @override
  List<Object?> get props => [
    stage,
    isLoading,
    email,
    errorCode,
    errorMessage,
    completed,
  ];
}
