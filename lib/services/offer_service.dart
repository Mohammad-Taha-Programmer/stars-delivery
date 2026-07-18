import 'package:dio/dio.dart';
import '../models/offer_model.dart';
import 'api_config.dart';

class OfferService {
  late final Dio _dio;
  OfferService() {
    _dio = Dio(BaseOptions(baseUrl: ApiConfig.apiUrl, connectTimeout: const Duration(seconds: 30), receiveTimeout: const Duration(seconds: 30)));
  }

  Future<void> submitOffer(String token, String orderId, double price, int estimatedTime) async {
    try {
      await _dio.post('/offers', data: {'orderId': orderId, 'price': price, 'estimatedTime': estimatedTime},
        options: Options(headers: {'Authorization': 'Bearer $token'}));
    } on DioException catch (e) { throw Exception(e.response?.data?['error'] ?? 'Failed to submit offer'); }
  }

  Future<List<OfferModel>> getOffers(String token, String orderId) async {
    final r = await _dio.get('/offers/order/$orderId',
      options: Options(headers: {'Authorization': 'Bearer $token'}));
    return (r.data as List).map((j) => OfferModel.fromJson(j)).toList();
  }

  Future<void> acceptOffer(String token, String offerId) async {
    try {
      await _dio.post('/offers/$offerId/accept',
        options: Options(headers: {'Authorization': 'Bearer $token'}));
    } on DioException catch (e) { throw Exception(e.response?.data?['error'] ?? 'Failed to accept'); }
  }
}
