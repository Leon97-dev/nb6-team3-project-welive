const { ValidationError } = require('../../dist/middlewares/error-handler');
const {
  validateLogin,
  validateUpdateApprovalStatus,
} = require('../../dist/modules/auth/auth.validator');

describe('auth validator', () => {
  test('validateLogin returns parsed payload', () => {
    const payload = validateLogin({
      username: 'admin@test.com',
      password: 'welive1234@',
    });

    expect(payload).toEqual({
      username: 'admin@test.com',
      password: 'welive1234@',
    });
  });

  test('validateLogin throws ValidationError on invalid payload', () => {
    expect(() =>
      validateLogin({
        username: '',
        password: '1234',
      })
    ).toThrow(ValidationError);
  });

  test('validateUpdateApprovalStatus accepts APPROVED/REJECTED', () => {
    expect(validateUpdateApprovalStatus({ status: 'APPROVED' })).toEqual({
      status: 'APPROVED',
    });
    expect(validateUpdateApprovalStatus({ status: 'REJECTED' })).toEqual({
      status: 'REJECTED',
    });
  });

  test('validateUpdateApprovalStatus throws on unsupported status', () => {
    expect(() =>
      validateUpdateApprovalStatus({ status: 'PENDING' })
    ).toThrow(ValidationError);
  });
});

