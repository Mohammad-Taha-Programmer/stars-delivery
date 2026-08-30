import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

String readSource(String relativePath) {
  return File(
    '${Directory.current.path}${Platform.pathSeparator}$relativePath',
  ).readAsStringSync();
}

void main() {
  final profile =
      readSource(
        'lib/screens/profile_screen.dart',
      );

  test(
    'profile validates and normalizes recovery email before mutation',
    () {
      final start =
          profile.indexOf(
            'Future<void> _saveEmail()',
          );

      final end =
          profile.indexOf(
            'Future<void> _changePassword()',
            start,
          );

      final block =
          profile.substring(
            start,
            end,
          );

      expect(
        block,
        contains(
          'Validators.email(email)',
        ),
      );

      expect(
        block,
        contains(
          '.trim().toLowerCase()',
        ),
      );
    },
  );

  test(
    'profile uses dedicated recovery-email endpoint instead of generic profile update',
    () {
      final start =
          profile.indexOf(
            'Future<void> _saveEmail()',
          );

      final end =
          profile.indexOf(
            'Future<void> _changePassword()',
            start,
          );

      final block =
          profile.substring(
            start,
            end,
          );

      expect(
        block,
        contains(
          "'/users/email'",
        ),
      );

      expect(
        block,
        isNot(
          contains(
            "'/users/profile'",
          ),
        ),
      );
    },
  );

  test(
    'email mutation reauthenticates current credential without exposing it',
    () {
      expect(
        profile,
        contains(
          '_promptCurrentPasswordForEmailChange',
        ),
      );

      expect(
        profile,
        contains(
          'obscureText: true',
        ),
      );

      final start =
          profile.indexOf(
            'Future<void> _saveEmail()',
          );

      final end =
          profile.indexOf(
            'Future<void> _changePassword()',
            start,
          );

      final block =
          profile.substring(
            start,
            end,
          );

      expect(
        block,
        contains(
          "'currentPassword': currentPassword",
        ),
      );

      expect(
        block,
        contains(
          "'newEmail': email",
        ),
      );

      expect(
        block,
        contains(
          "'confirmEmail': email",
        ),
      );
    },
  );

  test(
    'successful email rotation leaves no stale authenticated mobile session',
    () {
      final start =
          profile.indexOf(
            'Future<void> _saveEmail()',
          );

      final end =
          profile.indexOf(
            'Future<void> _changePassword()',
            start,
          );

      final block =
          profile.substring(
            start,
            end,
          );

      expect(
        block,
        contains(
          'if (!mounted) return;',
        ),
      );

      expect(
        block,
        contains(
          'LogoutEvent()',
        ),
      );

      expect(
        block,
        isNot(
          contains(
            'writeToken',
          ),
        ),
      );
    },
  );
}
