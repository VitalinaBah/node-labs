import argon2 from 'argon2';

/**
 * Auth-сервіс. Не імпортує fastify — отримує usersRepo через DI.
 * Хешує паролі через argon2id (OWASP-рекомендовані параметри за замовчуванням).
 */
export const createAuthService = ({ usersRepo }) => {
  const sanitize = (user) => {
    if (!user) return null;
    const { password: _omit, ...safe } = user;
    return safe;
  };

  const register = async ({ email, password }) => {
    const existing = await usersRepo.findByEmail(email);
    if (existing) {
      const err = new Error('Email already registered');
      err.statusCode = 409;
      throw err;
    }
    const hash = await argon2.hash(password);
    const created = await usersRepo.create({ email, password: hash });
    return sanitize(created);
  };

  const verify = async ({ email, password }) => {
    const user = await usersRepo.findByEmail(email);
    if (!user) return null;
    const ok = await argon2.verify(user.password, password);
    return ok ? sanitize(user) : null;
  };

  const findById = async (id) => sanitize(await usersRepo.findById(id));

  return { register, verify, findById };
};
