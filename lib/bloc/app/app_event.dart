import 'package:flutter/material.dart';
import 'package:equatable/equatable.dart';

abstract class AppEvent extends Equatable {
  const AppEvent();
  @override
  List<Object?> get props => [];
}

class ToggleTheme extends AppEvent {}

class SetTheme extends AppEvent {
  final ThemeMode mode;
  const SetTheme(this.mode);
  @override
  List<Object?> get props => [mode];
}

class ToggleLocale extends AppEvent {}

class SetLocale extends AppEvent {
  final Locale locale;
  const SetLocale(this.locale);
  @override
  List<Object?> get props => [locale];
}
