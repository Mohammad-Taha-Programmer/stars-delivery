import 'dart:async';
import 'package:socket_io_client/socket_io_client.dart' as io;
import 'api_config.dart';

class SocketService {
  static SocketService? _instance;
  io.Socket? _socket;

  final _newOrderController = StreamController<Map<String, dynamic>>.broadcast();
  final _newOfferController = StreamController<Map<String, dynamic>>.broadcast();
  final _offerAcceptedController = StreamController<Map<String, dynamic>>.broadcast();
  final _orderStatusController = StreamController<Map<String, dynamic>>.broadcast();
  final _notifCountController = StreamController<int>.broadcast();

  Stream<Map<String, dynamic>> get onNewOrder => _newOrderController.stream;
  Stream<Map<String, dynamic>> get onNewOffer => _newOfferController.stream;
  Stream<Map<String, dynamic>> get onOfferAccepted => _offerAcceptedController.stream;
  Stream<Map<String, dynamic>> get onOrderStatusChanged => _orderStatusController.stream;
  Stream<int> get onNotificationCount => _notifCountController.stream;

  bool get isConnected => _socket?.connected ?? false;

  static SocketService get instance {
    _instance ??= SocketService._();
    return _instance!;
  }

  SocketService._();

  void connect({required String token, String? area}) {
    disconnect();

    final uri = ApiConfig.apiUrl.replaceFirst('/api', '');
    _socket = io.io(uri, io.OptionBuilder()
      .setAuth({'token': token})
      .setQuery({'area': area ?? ''})
      .setTransports(['websocket'])
      .enableAutoConnect()
      .build());

    _socket!.onConnect((_) {
      print('Socket connected');
    });

    _socket!.onDisconnect((_) {
      print('Socket disconnected');
    });

    _socket!.on('new_order', (data) {
      if (data is Map) {
        _newOrderController.add(Map<String, dynamic>.from(data));
      }
    });

    _socket!.on('new_offer', (data) {
      if (data is Map) {
        _newOfferController.add(Map<String, dynamic>.from(data));
      }
    });

    _socket!.on('offer_accepted', (data) {
      if (data is Map) {
        _offerAcceptedController.add(Map<String, dynamic>.from(data));
      }
    });

    _socket!.on('order_status_changed', (data) {
      if (data is Map) {
        _orderStatusController.add(Map<String, dynamic>.from(data));
      }
    });

    _socket!.on('notification_count', (data) {
      if (data is Map && data['unreadCount'] is int) {
        _notifCountController.add(data['unreadCount'] as int);
      }
    });

    _socket!.connect();
  }

  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
  }

  void dispose() {
    disconnect();
    _newOrderController.close();
    _newOfferController.close();
    _offerAcceptedController.close();
    _orderStatusController.close();
    _notifCountController.close();
    _instance = null;
  }
}
