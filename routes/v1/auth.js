import { randomUUID } from 'node:crypto';
import { registerBodySchema, loginBodySchema, userResponseSchema } from '#schemas/authSchema.js';
import { REDIS_KEYS, REDIS_TTL } from '#constants/redisKeys.js';

const TAG = 'auth';
const REFRESH_COOKIE = 'refreshToken';

const authRoutes = async (fastify) => {
  // POST /auth/register
  fastify.post('/register', {
    schema: {
      tags: [TAG],
      summary: 'Реєстрація користувача',
      body: registerBodySchema,
      response: { 201: userResponseSchema },
    },
  }, async (request, reply) => {
    try {
      const user = await fastify.authSvc.register(request.body);
      return reply.code(201).send(user);
    } catch (err) {
      if (err.statusCode === 409) return reply.conflict(err.message);
      throw err;
    }
  });

  // POST /auth/login
  fastify.post('/login', {
    schema: {
      tags: [TAG],
      summary: 'Вхід — повертає accessToken у тілі і refreshToken як httpOnly cookie',
      body: loginBodySchema,
      response: {
        200: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            user: userResponseSchema,
          },
        },
      },
    },
  }, async (request, reply) => {
    const user = await fastify.authSvc.verify(request.body);
    if (!user) return reply.unauthorized('Invalid credentials');

    const jti = randomUUID();
    const accessToken = await reply.jwtSign(
      { sub: user.id, email: user.email, jti },
      { expiresIn: '15m' },
    );
    const refreshToken = await reply.jwtSign(
      { sub: user.id, type: 'refresh' },
      { expiresIn: '7d' },
    );

    // refresh у Redis (можливість відкликати)
    await fastify.redis.set(
      REDIS_KEYS.REFRESH_TOKEN(user.id),
      refreshToken,
      'EX',
      REDIS_TTL.REFRESH_TOKEN,
    );

    return reply
      .setCookie(REFRESH_COOKIE, refreshToken, {
        httpOnly: true,
        secure: fastify.config.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/v1/auth',
        maxAge: REDIS_TTL.REFRESH_TOKEN,
      })
      .send({ accessToken, user });
  });

  // POST /auth/refresh — обмін refresh-cookie на новий access
  fastify.post('/refresh', {
    schema: {
      tags: [TAG],
      summary: 'Обмін refresh-cookie на новий access token',
      response: {
        200: { type: 'object', properties: { accessToken: { type: 'string' } } },
      },
    },
  }, async (request, reply) => {
    const refresh = request.cookies?.[REFRESH_COOKIE];
    if (!refresh) return reply.unauthorized('No refresh token');

    let payload;
    try {
      payload = fastify.jwt.verify(refresh);
    } catch {
      return reply.unauthorized('Invalid refresh token');
    }
    if (payload.type !== 'refresh' || !payload.sub) {
      return reply.unauthorized('Invalid refresh token');
    }

    const stored = await fastify.redis.get(REDIS_KEYS.REFRESH_TOKEN(payload.sub));
    if (!stored || stored !== refresh) {
      return reply.unauthorized('Refresh token revoked');
    }

    const user = await fastify.authSvc.findById(payload.sub);
    if (!user) return reply.unauthorized();

    const jti = randomUUID();
    const accessToken = await reply.jwtSign(
      { sub: user.id, email: user.email, jti },
      { expiresIn: '15m' },
    );
    return reply.send({ accessToken });
  });

  // POST /auth/logout — додає access у blacklist + видаляє refresh
  fastify.post('/logout', {
    onRequest: [fastify.authenticate],
    schema: {
      tags: [TAG],
      summary: 'Вихід — blacklist access token + видалення refresh',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const { jti, exp, sub } = request.user;
    const now = Math.floor(Date.now() / 1000);

    if (jti && exp > now) {
      const ttl = exp - now;
      await fastify.redis.set(REDIS_KEYS.JWT_BLACKLIST(jti), '1', 'EX', ttl);
    }
    if (sub) {
      await fastify.redis.del(REDIS_KEYS.REFRESH_TOKEN(sub));
    }
    return reply
      .clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' })
      .code(204)
      .send();
  });

  // GET /auth/me
  fastify.get('/me', {
    onRequest: [fastify.authenticate],
    schema: { tags: [TAG], summary: 'Поточний користувач', security: [{ bearerAuth: [] }] },
  }, async (request, reply) => {
    const user = await fastify.authSvc.findById(request.user.sub);
    if (!user) return reply.unauthorized();
    return reply.send(user);
  });
};

export default authRoutes;
