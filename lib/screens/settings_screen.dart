import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../bloc/app/app_bloc.dart';
import '../bloc/app/app_event.dart';
import '../services/localization_service.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppBloc>().state;
    final isAr = appState.locale.languageCode == 'ar';
    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        appBar: AppBar(
          title: Text(AppLocalization.get(context, 'settings')),
          leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => Navigator.pop(context)),
        ),
        body: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Card(
              child: ListTile(
                leading: const Icon(Icons.language),
                title: Text(AppLocalization.get(context, 'language')),
                trailing: DropdownButton<String>(
                  value: isAr ? 'ar' : 'en',
                  items: const [
                    DropdownMenuItem(value: 'ar', child: Text('العربية')),
                    DropdownMenuItem(value: 'en', child: Text('English')),
                  ],
                  onChanged: (v) {
                    if (v != null) context.read<AppBloc>().add(SetLocale(Locale(v)));
                  },
                ),
              ),
            ),
            const SizedBox(height: 12),
            Card(
              child: ListTile(
                leading: const Icon(Icons.brightness_6),
                title: Text(AppLocalization.get(context, 'theme')),
                trailing: DropdownButton<String>(
                  value: appState.themeMode == ThemeMode.dark ? 'dark' : 'light',
                  items: [
                    DropdownMenuItem(value: 'light', child: Text(AppLocalization.get(context, 'light'))),
                    DropdownMenuItem(value: 'dark', child: Text(AppLocalization.get(context, 'dark'))),
                  ],
                  onChanged: (v) {
                    if (v != null) context.read<AppBloc>().add(SetTheme(v == 'dark' ? ThemeMode.dark : ThemeMode.light));
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
