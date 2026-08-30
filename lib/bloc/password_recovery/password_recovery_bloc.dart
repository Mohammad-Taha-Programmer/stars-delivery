import 'package:flutter_bloc/flutter_bloc.dart';

import '../../services/password_recovery_service.dart';
import 'password_recovery_event.dart';
import 'password_recovery_state.dart';

class PasswordRecoveryBloc
    extends Bloc<PasswordRecoveryEvent, PasswordRecoveryState> {
  final PasswordRecoveryGateway _gateway;

  PasswordRecoveryBloc({PasswordRecoveryGateway? gateway})
    : _gateway = gateway ?? PasswordRecoveryService(),
      super(const PasswordRecoveryState.initial()) {
    on<RequestPasswordRecoveryCode>(_onRequestCode);

    on<SubmitPasswordRecoveryReset>(_onReset);

    on<RestartPasswordRecovery>(_onRestart);
  }

  String _normalizeEmail(String value) => value.trim().toLowerCase();

  Future<void> _onRequestCode(
    RequestPasswordRecoveryCode event,
    Emitter<PasswordRecoveryState> emit,
  ) async {
    if (state.isLoading) {
      return;
    }

    final email = _normalizeEmail(event.email);

    emit(
      PasswordRecoveryState(
        stage: PasswordRecoveryStage.requestEmail,
        isLoading: true,
        email: email,
        errorCode: null,
        errorMessage: null,
        completed: false,
      ),
    );

    try {
      await _gateway.requestCode(email);

      emit(
        PasswordRecoveryState(
          stage: PasswordRecoveryStage.enterCode,
          isLoading: false,
          email: email,
          errorCode: null,
          errorMessage: null,
          completed: false,
        ),
      );
    } on PasswordRecoveryException catch (error) {
      emit(
        PasswordRecoveryState(
          stage: PasswordRecoveryStage.requestEmail,
          isLoading: false,
          email: email,
          errorCode: error.code,
          errorMessage: error.message,
          completed: false,
        ),
      );
    } catch (_) {
      emit(
        PasswordRecoveryState(
          stage: PasswordRecoveryStage.requestEmail,
          isLoading: false,
          email: email,
          errorCode: null,
          errorMessage: null,
          completed: false,
        ),
      );
    }
  }

  Future<void> _onReset(
    SubmitPasswordRecoveryReset event,
    Emitter<PasswordRecoveryState> emit,
  ) async {
    if (state.isLoading) {
      return;
    }

    final email = _normalizeEmail(event.email);

    emit(
      PasswordRecoveryState(
        stage: PasswordRecoveryStage.enterCode,
        isLoading: true,
        email: email,
        errorCode: null,
        errorMessage: null,
        completed: false,
      ),
    );

    try {
      await _gateway.resetPassword(
        email: email,
        code: event.code,
        newPassword: event.newPassword,
        confirmPassword: event.confirmPassword,
      );

      emit(
        PasswordRecoveryState(
          stage: PasswordRecoveryStage.enterCode,
          isLoading: false,
          email: email,
          errorCode: null,
          errorMessage: null,
          completed: true,
        ),
      );
    } on PasswordRecoveryException catch (error) {
      emit(
        PasswordRecoveryState(
          stage: PasswordRecoveryStage.enterCode,
          isLoading: false,
          email: email,
          errorCode: error.code,
          errorMessage: error.message,
          completed: false,
        ),
      );
    } catch (_) {
      emit(
        PasswordRecoveryState(
          stage: PasswordRecoveryStage.enterCode,
          isLoading: false,
          email: email,
          errorCode: null,
          errorMessage: null,
          completed: false,
        ),
      );
    }
  }

  void _onRestart(
    RestartPasswordRecovery event,
    Emitter<PasswordRecoveryState> emit,
  ) {
    if (state.isLoading) {
      return;
    }

    emit(const PasswordRecoveryState.initial());
  }
}
