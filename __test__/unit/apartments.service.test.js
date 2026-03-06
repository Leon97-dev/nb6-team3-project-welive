const mockApartmentsRepository = {
  list: jest.fn(),
  listPublic: jest.fn(),
  getById: jest.fn(),
  getPublicById: jest.fn(),
};

jest.mock('../../dist/modules/apartments/apartment.repository', () => ({
  __esModule: true,
  default: mockApartmentsRepository,
}));

const apartmentsService =
  require('../../dist/modules/apartments/apartment.service').default;
const apartmentsRepository =
  require('../../dist/modules/apartments/apartment.repository').default;
const { NotFoundError } = require('../../dist/middlewares/error-handler');

describe('apartmentsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('list scopes apartment for ADMIN/USER', async () => {
    const query = { page: '1', limit: '10' };
    const actor = { id: 'u1', role: 'ADMIN', apartmentId: 'a1' };
    const expected = { apartments: [], totalCount: 0 };
    apartmentsRepository.list.mockResolvedValue(expected);

    await expect(apartmentsService.list(query, actor)).resolves.toBe(expected);
    expect(apartmentsRepository.list).toHaveBeenCalledWith(query, 'a1');
  });

  test('list does not scope apartment for SUPER_ADMIN', async () => {
    const query = { page: '1', limit: '10' };
    const actor = { id: 'u1', role: 'SUPER_ADMIN', apartmentId: 'a1' };
    const expected = { apartments: [], totalCount: 0 };
    apartmentsRepository.list.mockResolvedValue(expected);

    await expect(apartmentsService.list(query, actor)).resolves.toBe(expected);
    expect(apartmentsRepository.list).toHaveBeenCalledWith(query, undefined);
  });

  test('listPublic delegates to repository', async () => {
    const expected = { apartments: [], totalCount: 0 };
    apartmentsRepository.listPublic.mockResolvedValue(expected);

    await expect(apartmentsService.listPublic()).resolves.toBe(expected);
    expect(apartmentsRepository.listPublic).toHaveBeenCalledTimes(1);
  });

  test('getById delegates to repository with matching apartment', async () => {
    const actor = { id: 'u1', role: 'USER', apartmentId: 'a1' };
    const expected = { id: 'a1', name: 'Apt' };
    apartmentsRepository.getById.mockResolvedValue(expected);

    await expect(apartmentsService.getById('a1', actor)).resolves.toBe(
      expected
    );
    expect(apartmentsRepository.getById).toHaveBeenCalledWith('a1');
  });

  test('getById throws for mismatched apartment on USER/ADMIN', async () => {
    const actor = { id: 'u1', role: 'USER', apartmentId: 'a2' };

    expect(() => apartmentsService.getById('a1', actor)).toThrow(NotFoundError);
    expect(apartmentsRepository.getById).not.toHaveBeenCalled();
  });

  test('getPublicById delegates to repository', async () => {
    const expected = { id: 'a1', name: 'Apt' };
    apartmentsRepository.getPublicById.mockResolvedValue(expected);

    await expect(apartmentsService.getPublicById('a1')).resolves.toBe(expected);
    expect(apartmentsRepository.getPublicById).toHaveBeenCalledWith('a1');
  });
});
