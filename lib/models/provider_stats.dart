class ProviderStats {
  final double dailyEarnings;
  final double monthlyEarnings;
  final int totalSuccessful;
  final int dailyOrderCount;
  final double dailyCommission;
  final double monthlyCommission;
  final int pendingOrdersCount;

  ProviderStats({
    required this.dailyEarnings,
    required this.monthlyEarnings,
    required this.totalSuccessful,
    required this.dailyOrderCount,
    required this.dailyCommission,
    required this.monthlyCommission,
    required this.pendingOrdersCount,
  });

  factory ProviderStats.fromJson(Map<String, dynamic> json) {
    return ProviderStats(
      dailyEarnings: (json['dailyEarnings'] ?? 0).toDouble(),
      monthlyEarnings: (json['monthlyEarnings'] ?? 0).toDouble(),
      totalSuccessful: (json['totalSuccessful'] ?? 0).toInt(),
      dailyOrderCount: (json['dailyOrderCount'] ?? 0).toInt(),
      dailyCommission: (json['dailyCommission'] ?? 0).toDouble(),
      monthlyCommission: (json['monthlyCommission'] ?? 0).toDouble(),
      pendingOrdersCount: (json['pendingOrdersCount'] ?? 0).toInt(),
    );
  }
}