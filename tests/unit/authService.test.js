import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAuthService } from '../../services/authService.js';

vi.mock('argon2', () => ({
  default: {
    hash: vi.fn(async (p) => `hashed:${p}`),
    verify: vi.fn(async (hash, p) => hash === `hashed:${p}`),
  },
}));

describe('authService', () => {
  let mockUsersRepo;
  let svc;

  beforeEach(() => {
    mockUsersRepo = {
      findByEmail: vi.fn().mockResolvedValue(null),
      findById: vi.fn().mockResolvedValue(null),
      create: vi.fn(async ({ email, password }) => ({
        id: 1, email, password,
      })),
    };
    svc = createAuthService({ usersRepo: mockUsersRepo });
  });

  describe('register', () => {
    it('успішна реєстрація хешує пароль і повертає user без password', async () => {
      const result = await svc.register({ email: 'a@b.com', password: 'pwd12345' });
      expect(result).toEqual({ id: 1, email: 'a@b.com' });
      expect(result).not.toHaveProperty('password');
      expect(mockUsersRepo.create).toHaveBeenCalledWith({
        email: 'a@b.com',
        password: 'hashed:pwd12345',
      });
    });

    it('кидає 409 якщо email вже зайнятий', async () => {
      mockUsersRepo.findByEmail.mockResolvedValueOnce({ id: 1, email: 'a@b.com' });
      await expect(svc.register({ email: 'a@b.com', password: 'pwd12345' }))
        .rejects.toMatchObject({ statusCode: 409 });
      expect(mockUsersRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('verify', () => {
    it('повертає user (без password) при правильному паролі', async () => {
      mockUsersRepo.findByEmail.mockResolvedValueOnce({
        id: 1, email: 'a@b.com', password: 'hashed:pwd12345',
      });
      const result = await svc.verify({ email: 'a@b.com', password: 'pwd12345' });
      expect(result).toEqual({ id: 1, email: 'a@b.com' });
    });

    it('повертає null при неіснуючому email', async () => {
      const result = await svc.verify({ email: 'no@b.com', password: 'pwd' });
      expect(result).toBeNull();
    });

    it('повертає null при невірному паролі', async () => {
      mockUsersRepo.findByEmail.mockResolvedValueOnce({
        id: 1, email: 'a@b.com', password: 'hashed:correctpwd',
      });
      const result = await svc.verify({ email: 'a@b.com', password: 'wrongpwd' });
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('повертає user без password', async () => {
      mockUsersRepo.findById.mockResolvedValueOnce({
        id: 1, email: 'a@b.com', password: 'hashed:pwd',
      });
      const result = await svc.findById(1);
      expect(result).toEqual({ id: 1, email: 'a@b.com' });
    });

    it('повертає null коли user не знайдений', async () => {
      const result = await svc.findById(999);
      expect(result).toBeNull();
    });
  });
});
