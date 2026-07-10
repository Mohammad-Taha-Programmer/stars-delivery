class ProviderStats {
  final double dailyEarnings;
  final double monthlyEarnings;
  final int totalSuccessful;
  final double monthlyCommission;
  final int pendingOrdersCount;

  ProviderStats({
    required this.dailyEarnings,
    required this.monthlyEarnings,
    required this.totalSuccessful,
    required this.monthlyCommission,
    required this.pendingOrdersCount,
  });

  factory ProviderStats.fromJson(Map<String, dynamic> json) {
    return ProviderStats(
      dailyEarnings: (json['dailyEarnings'] ?? 0).toDouble(),
      monthlyEarnings: (json['monthlyEarnings'] ?? 0).toDouble(),
      totalSuccessful: (json['totalSuccessful'] ?? 0).toInt(),
      monthlyCommission: (json['monthlyCommission'] ?? 0).toDouble(),
      pendingOrdersCount: (json['pendingOrdersCount'] ?? 0).toInt(),
    );
  }
}