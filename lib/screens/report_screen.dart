import 'package:flutter/material.dart';
import '../services/report_service.dart';
import '../services/responsive.dart';

class ReportScreen extends StatefulWidget {
  final String token;
  final String reportType; // 'driver' or 'user'
  final String title; // 'الابلاغ عن سائق' or 'الابلاغ عن زبون'

  const ReportScreen({
    super.key,
    required this.token,
    required this.reportType,
    required this.title,
  });

  @override
  State<ReportScreen> createState() => _ReportScreenState();
}

class _ReportScreenState extends State<ReportScreen> {
  final _formKey = GlobalKey<FormState>();
  final _idController = TextEditingController();
  final _contentController = TextEditingController();
  final _service = ReportService();

  List<Map<String, dynamic>> _history = [];
  bool _loadingHistory = true;
  bool _sending = false;

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    try {
      final reports = await _service.getMyReports(widget.token);
      if (!mounted) return;
      setState(() {
        _history = reports;
        _loadingHistory = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _loadingHistory = false);
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _sending = true);
    try {
      await _service.submitReport(
        token: widget.token,
        reportedPublicId: _idController.text.trim(),
        reportType: widget.reportType,
        content: _contentController.text.trim(),
      );
      if (!mounted) return;
      _idController.clear();
      _contentController.clear();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('تم إرسال البلاغ بنجاح'),
          backgroundColor: Colors.green,
        ),
      );
      _loadHistory();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceFirst('Exception: ', '')),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  String _statusLabel(String? s) {
    switch (s) {
      case 'in-review': return 'قيد المراجعة';
      case 'in-progress': return 'قيد المعالجة';
      case 'resolved': return 'تم الحل';
      case 'rejected': return 'مرفوض';
      default: return s ?? '';
    }
  }

  Color _statusColor(String? s) {
    switch (s) {
      case 'in-review': return Colors.orange;
      case 'in-progress': return Colors.blue;
      case 'resolved': return Colors.green;
      case 'rejected': return Colors.red;
      default: return Colors.grey;
    }
  }

  @override
  void dispose() {
    _idController.dispose();
    _contentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Text(
          widget.title,
          style: const TextStyle(color: Colors.black87, fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black87),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 600),
          child: SingleChildScrollView(
            padding: EdgeInsets.symmetric(
              horizontal: Responsive.paddingHorizontal(context),
              vertical: Responsive.paddingVertical(context),
            ),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TextFormField(
                    controller: _idController,
                    decoration: const InputDecoration(
                      labelText: 'ID',
                      hintText: 'أدخل ID الشخص المراد الإبلاغ عنه',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.person_search),
                    ),
                    keyboardType: TextInputType.number,
                    validator: (v) => (v == null || v.trim().isEmpty) ? 'مطلوب' : null,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _contentController,
                    decoration: const InputDecoration(
                      labelText: 'وصف المشكلة',
                      hintText: 'اشرح المشكلة التي تواجهها',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.description),
                    ),
                    maxLines: 4,
                    validator: (v) => (v == null || v.trim().isEmpty) ? 'مطلوب' : null,
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    height: 48,
                    child: ElevatedButton(
                      onPressed: _sending ? null : _submit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.red,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      child: _sending
                          ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Text('إرسال البلاغ', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    ),
                  ),
                  const SizedBox(height: 32),
                  const Text(
                    'آخر البلاغات',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  if (_loadingHistory)
                    const Center(child: Padding(padding: EdgeInsets.all(24), child: CircularProgressIndicator()))
                  else if (_history.isEmpty)
                    const Center(
                      child: Padding(
                        padding: EdgeInsets.all(24),
                        child: Text('لا توجد بلاغات سابقة', style: TextStyle(color: Colors.grey)),
                      ),
                    )
                  else
                    ..._history.map((r) {
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      '#${r['reportedPublicId'] ?? ''}',
                                      style: const TextStyle(fontWeight: FontWeight.w600),
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: _statusColor(r['status']).withValues(alpha: 0.15),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Text(
                                      _statusLabel(r['status']),
                                      style: TextStyle(fontSize: 12, color: _statusColor(r['status']), fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Text(
                                r['content'] ?? '',
                                style: TextStyle(fontSize: 13, color: Colors.grey[700]),
                              ),
                              if (r['date'] != null) ...[
                                const SizedBox(height: 4),
                                Text(r['date'].toString(), style: TextStyle(fontSize: 11, color: Colors.grey[500])),
                              ],
                              if (r['replies'] is List && (r['replies'] as List).isNotEmpty) ...[
                                const Divider(height: 20),
                                ...(r['replies'] as List).map((reply) {
                                  final isAdmin = reply['sender'] == 'admin';
                                  return Container(
                                    margin: const EdgeInsets.only(top: 6),
                                    padding: const EdgeInsets.all(10),
                                    decoration: BoxDecoration(
                                      color: isAdmin ? Colors.blue[50] : Colors.grey[100],
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(color: isAdmin ? Colors.blue[200]! : Colors.grey[300]!),
                                    ),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Icon(
                                              isAdmin ? Icons.admin_panel_settings : Icons.person,
                                              size: 14,
                                              color: isAdmin ? Colors.blue[700] : Colors.grey[700],
                                            ),
                                            const SizedBox(width: 4),
                                            Text(
                                              isAdmin ? 'الدعم الفني' : 'أنت',
                                              style: TextStyle(
                                                fontSize: 12,
                                                fontWeight: FontWeight.bold,
                                                color: isAdmin ? Colors.blue[700] : Colors.grey[700],
                                              ),
                                            ),
                                            const Spacer(),
                                            if (reply['time'] != null)
                                              Text(
                                                reply['time'].toString(),
                                                style: TextStyle(fontSize: 10, color: Colors.grey[500]),
                                              ),
                                          ],
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          reply['text'] ?? '',
                                          style: const TextStyle(fontSize: 13),
                                        ),
                                      ],
                                    ),
                                  );
                                }),
                              ],
                            ],
                          ),
                        ),
                      );
                    }),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
