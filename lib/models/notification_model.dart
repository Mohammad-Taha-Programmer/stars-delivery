class NotificationModel {
  final String id;
  final String orderId;
  final String type;
  final String title;
  final String body;
  final bool read;
  final bool pinned;
  final String createdAt;
  final String image;

  NotificationModel({
    required this.id, required this.orderId, required this.type,
    required this.title, required this.body, required this.read, required this.createdAt,
    this.pinned = false,
    this.image = '',
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['_id']?.toString() ?? '',
      orderId: json['orderId']?.toString() ?? '',
      type: json['type'] ?? '',
      title: json['title'] ?? '',
      body: json['body'] ?? '',
      read: json['read'] ?? false,
      pinned: json['pinned'] ?? false,
      createdAt: json['createdAt']?.toString() ?? '',
      image: json['image'] ?? '',
    );
  }
}