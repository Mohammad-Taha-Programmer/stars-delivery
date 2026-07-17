import 'package:flutter/material.dart';
import 'package:equatable/equatable.dart';

class AppState extends Equatable {
  final ThemeMode themeMode;
  final Locale locale;

  const AppState({
    this.themeMode = ThemeMode.light,
    this.locale = const Locale('ar'),
  });

  AppState copyWith({ThemeMode? themeMode, Locale? locale}) {
    return AppState(
      themeMode: themeMode ?? this.themeMode,
      locale: locale ?? this.locale,
    );
  }

  @override
  List<Object?> get props => [themeMode, locale];
}
