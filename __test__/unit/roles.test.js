const {
  isAdminRole,
  isSuperAdminRole,
  isResidentRole,
} = require('../../dist/utils/roles');

describe('roles utils', () => {
  test('isAdminRole returns true for ADMIN and SUPER_ADMIN', () => {
    expect(isAdminRole('ADMIN')).toBe(true);
    expect(isAdminRole('SUPER_ADMIN')).toBe(true);
    expect(isAdminRole('USER')).toBe(false);
  });

  test('isSuperAdminRole returns true only for SUPER_ADMIN', () => {
    expect(isSuperAdminRole('SUPER_ADMIN')).toBe(true);
    expect(isSuperAdminRole('ADMIN')).toBe(false);
    expect(isSuperAdminRole('USER')).toBe(false);
  });

  test('isResidentRole returns true only for USER', () => {
    expect(isResidentRole('USER')).toBe(true);
    expect(isResidentRole('ADMIN')).toBe(false);
    expect(isResidentRole('SUPER_ADMIN')).toBe(false);
  });
});

