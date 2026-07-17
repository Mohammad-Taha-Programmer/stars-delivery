import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'app_event.dart';
import 'app_state.dart';

class AppBloc extends Bloc<AppEvent, AppState> {
  AppBloc() : super(const AppState()) {
    on<ToggleTheme>(_onToggleTheme);
    on<SetTheme>(_onSetTheme);
    on<ToggleLocale>(_onToggleLocale);
    on<SetLocale>(_onSetLocale);
  }

  void _onToggleTheme(ToggleTheme event, Emitter<AppState> emit) {
    emit(state.copyWith(
      themeMode: state.themeMode == ThemeMode.light ? ThemeMode.dark : ThemeMode.light,
    ));
  }

  void _onSetTheme(SetTheme event, Emitter<AppState> emit) {
    emit(state.copyWith(themeMode: event.mode));
  }

  void _onToggleLocale(ToggleLocale event, Emitter<AppState> emit) {
    emit(state.copyWith(
      locale: state.locale.languageCode == 'ar' ? const Locale('en') : const Locale('ar'),
    ));
  }

  void _onSetLocale(SetLocale event, Emitter<AppState> emit) {
    emit(state.copyWith(locale: event.locale));
  }
}
