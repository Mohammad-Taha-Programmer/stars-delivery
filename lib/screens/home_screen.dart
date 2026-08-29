import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../bloc/app/app_bloc.dart';
import '../bloc/app/app_event.dart';
import '../bloc/app/app_state.dart';
import '../bloc/auth/auth_bloc.dart';
import '../bloc/auth/auth_event.dart';
import '../bloc/order/order_bloc.dart';
import '../bloc/notification/notification_bloc.dart';
import '../bloc/notification/notification_event.dart';
import '../bloc/notification/notification_state.dart';
import '../models/user_model.dart';
import '../services/responsive.dart';
import '../services/localization_service.dart';
import '../services/api_config.dart';
import '../services/location_service.dart';
import 'create_order_screen.dart';
import 'my_orders_screen.dart';
import 'notifications_screen.dart';
import 'login_screen.dart';
import 'report_screen.dart';
import 'profile_screen.dart';
import 'support_chat_screen.dart';
import '../services/socket_service.dart';
import '../services/mobile_session_failure.dart';

class HomeScreen extends StatefulWidget {
  final UserModel user;
  final String role;
  final String token;
  const HomeScreen({
    super.key,
    required this.user,
    required this.role,
    required this.token,
  });
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with WidgetsBindingObserver {
  Timer? _notifTimer;
  StreamSubscription? _newOfferSub;
  StreamSubscription? _orderStatusSub;
  StreamSubscription? _offerAcceptedSub;
  StreamSubscription? _broadcastSub;
  StreamSubscription? _accountDeletedSub;
  StreamSubscription? _sessionRevokedSub;
  StreamSubscription? _httpSessionRejectedSub;
  bool _sessionExitStarted = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);

    _httpSessionRejectedSub =
        MobileSessionFailure.instance.onRejected.listen((event) {
      if (!event.belongsTo(widget.token)) {
        return;
      }

      _endSession();
    });

    LocationService.syncToBackend(widget.token);

    SocketService.instance.connect(token: widget.token);

    context.read<NotificationBloc>().add(
      LoadNotifications(token: widget.token),
    );

    _notifTimer = Timer.periodic(const Duration(seconds: 15), (_) {
      context.read<NotificationBloc>().add(
        LoadNotifications(token: widget.token),
      );
    });

    _newOfferSub = SocketService.instance.onNewOffer.listen((data) {
      if (!mounted) return;
      context.read<NotificationBloc>().add(
        LoadNotifications(token: widget.token),
      );
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            '${AppLocalization.get(context, 'new_offer_received')} ${data['price']} ILS',
          ),
          backgroundColor: Colors.green,
          behavior: SnackBarBehavior.floating,
        ),
      );
    });

    _orderStatusSub = SocketService.instance.onOrderStatusChanged.listen((data) {
      if (!mounted) return;
      context.read<NotificationBloc>().add(
        LoadNotifications(token: widget.token),
      );
    });

    _offerAcceptedSub = SocketService.instance.onOfferAccepted.listen((data) {
      if (!mounted) return;
      context.read<NotificationBloc>().add(
        LoadNotifications(token: widget.token),
      );
    });

    _broadcastSub = SocketService.instance.onBroadcast.listen((data) {
      if (!mounted) return;
      context.read<NotificationBloc>().add(
        LoadNotifications(token: widget.token),
      );
    });

    _accountDeletedSub =
        SocketService.instance.onAccountDeleted.listen((_) {
      _endSession();
    });

    _sessionRevokedSub =
        SocketService.instance.onSessionRevoked.listen((_) {
      _endSession();
    });
  }

  void _endSession() {
    if (!mounted || _sessionExitStarted) {
      return;
    }

    _sessionExitStarted = true;

    SocketService.instance.disconnect();
    context.read<AuthBloc>().add(LogoutEvent());

    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(
        builder: (_) => const LoginScreen(),
      ),
      (route) => false,
    );
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState st) {
    if (st == AppLifecycleState.resumed) {
      LocationService.syncToBackend(widget.token);
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _notifTimer?.cancel();
    _newOfferSub?.cancel();
    _orderStatusSub?.cancel();
    _offerAcceptedSub?.cancel();
    _broadcastSub?.cancel();
    _accountDeletedSub?.cancel();
    _sessionRevokedSub?.cancel();
    _httpSessionRejectedSub?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppBloc>().state;
    final isAr = appState.locale.languageCode == 'ar';
    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0,
          title: GestureDetector(
            onTap: () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => ProfileScreen(user: widget.user, token: widget.token)));
            },
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                CircleAvatar(
                  radius: 18,
                  backgroundColor: Colors.blue,
                  child: Text(widget.user.fullName.isNotEmpty ? widget.user.fullName[0].toUpperCase() : 'C', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                ),
                const SizedBox(width: 8),
                Flexible(
                  child: Text(widget.user.fullName, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.black87, fontWeight: FontWeight.w600, fontSize: 15)),
                ),
              ],
            ),
          ),
          centerTitle: true,
          actions: [
            BlocBuilder<NotificationBloc, NotificationState>(
              builder: (context, nState) {
                final unread = nState is NotificationsLoaded
                    ? nState.unreadCount
                    : 0;
                return Stack(
                  children: [
                    IconButton(
                      icon: const Icon(
                        Icons.notifications_outlined,
                        color: Colors.black87,
                      ),
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => BlocProvider.value(
                              value: context.read<NotificationBloc>(),
                              child: NotificationsScreen(token: widget.token),
                            ),
                          ),
                        );
                      },
                    ),
                    if (unread > 0)
                      Positioned(
                        right: 6,
                        top: 6,
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: const BoxDecoration(
                            color: Colors.red,
                            shape: BoxShape.circle,
                          ),
                          child: Text(
                            '$unread',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                  ],
                );
              },
            ),
            BlocBuilder<AppBloc, AppState>(
              builder: (context, appState) {
                final isDark = appState.themeMode == ThemeMode.dark;
                return IconButton(
                  icon: Icon(isDark ? Icons.light_mode : Icons.dark_mode, color: Colors.grey[700]),
                  onPressed: () => context.read<AppBloc>().add(ToggleTheme()),
                );
              },
            ),
            BlocBuilder<AppBloc, AppState>(
              builder: (context, appState) {
                final isAr = appState.locale.languageCode == 'ar';
                return IconButton(
                  icon: Text(isAr ? 'EN' : 'ع', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey[700], fontSize: 15)),
                  onPressed: () => context.read<AppBloc>().add(ToggleLocale()),
                );
              },
            ),
            IconButton(
              icon: const Icon(Icons.logout, color: Colors.red),
              onPressed: () {
                SocketService.instance.disconnect();
                context.read<AuthBloc>().add(LogoutEvent());
                Navigator.pushAndRemoveUntil(
                  context,
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                  (route) => false,
                );
              },
            ),
          ],
        ),
        body: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 600),
            child: RefreshIndicator(
              onRefresh: () async {
                final bloc = context.read<NotificationBloc>();
                bloc.add(LoadNotifications(token: widget.token));
                await bloc.stream.firstWhere((s) => s is! NotificationLoading);
              },
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: EdgeInsets.symmetric(
                  horizontal: Responsive.paddingHorizontal(context),
                  vertical: Responsive.paddingVertical(context),
                ),
                child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _ActionButton(
                    icon: Icons.add_circle_outline,
                    label: AppLocalization.get(context, 'new_order'),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => BlocProvider(
                            create: (_) => OrderBloc(),
                            child: CreateOrderScreen(
                              user: widget.user,
                              token: widget.token,
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 16),
                  _ActionButton(
                    icon: Icons.local_offer_outlined,
                    label: AppLocalization.get(context, 'offers_title'),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => MyOrdersScreen(token: widget.token),
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 16),
                  _ActionButton(
                    icon: Icons.assessment_outlined,
                    label: AppLocalization.get(context, 'report_30'),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => MyOrdersScreen(token: widget.token),
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 24),
                  _ActionButton(
                    icon: Icons.report_outlined,
                    label: AppLocalization.get(context, 'report_driver'),
                    iconColor: Colors.red,
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => ReportScreen(
                            token: widget.token,
                            reportType: 'driver',
                            title: 'الابلاغ عن سائق',
                          ),
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 12),
                  _ActionButton(
                    icon: Icons.headset_mic_outlined,
                    label: AppLocalization.get(context, 'contact_support'),
                    iconColor: Colors.orange,
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => SupportChatScreen(token: widget.token),
                        ),
                      );
                    },
                  ),
                ],
                ),
              ),
            ),
          ),
          ),
        ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color? iconColor;
  const _ActionButton({
    required this.icon,
    required this.label,
    required this.onTap,
    this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: onTap,
        style: ElevatedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 24),
          backgroundColor: Colors.white,
          foregroundColor: iconColor ?? Colors.blue[700],
          side: BorderSide(color: Colors.grey[300]!),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          elevation: 0,
        ),
        child: Row(
          children: [
            Icon(icon, size: 28, color: iconColor),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                label,
                textAlign: TextAlign.right,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
