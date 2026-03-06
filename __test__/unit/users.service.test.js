const mockUsersRepository = {
  updateMe: jest.fn(),
};

jest.mock('../../dist/modules/users/user.repository', () => ({
  __esModule: true,
  default: mockUsersRepository,
}));

const usersService = require('../../dist/modules/users/user.service').default;
const usersRepository =
  require('../../dist/modules/users/user.repository').default;

describe('usersService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('updateMe delegates to repository', async () => {
    const payload = { name: '레온', contact: '01012345678' };
    const expected = { userId: 'u1', avatar: '' };
    usersRepository.updateMe.mockResolvedValue(expected);

    await expect(
      usersService.updateMe('u1', payload, 'http://localhost:3000')
    ).resolves.toBe(expected);
    expect(usersRepository.updateMe).toHaveBeenCalledWith(
      'u1',
      payload,
      'http://localhost:3000'
    );
  });
});
