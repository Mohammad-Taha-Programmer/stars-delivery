import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'bloc/auth/auth_bloc.dart';
import 'bloc/app/app_bloc.dart';
import 'bloc/app/app_state.dart';
import 'bloc/notification/notification_bloc.dart';
import 'services/theme_service.dart';
import 'package:stars_delivery/services/api_config.dart';
import 'services/location_service.dart';
import 'screens/login_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await ApiConfig.init();
  await LocationService.initialize();
  runApp(const StarsDeliveryApp());
}

class StarsDeliveryApp extends StatelessWidget {
  const StarsDeliveryApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider(create: (_) => AuthBloc()),
        BlocProvider(create: (_) => AppBloc()),
        BlocProvider(create: (_) => NotificationBloc()),
      ],
      child: BlocBuilder<AppBloc, AppState>(
        builder: (context, appState) {
          return MaterialApp(
            title: 'Stars Delivery',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.light,
            darkTheme: AppTheme.dark,
            themeMode: appState.themeMode,
            locale: appState.locale,
            supportedLocales: const [Locale('ar'), Locale('en')],
            localizationsDelegates: const [
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            home: const LoginScreen(),
          );
        },
      ),
    );
  }
}
