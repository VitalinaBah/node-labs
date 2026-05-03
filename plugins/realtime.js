import fastifyWebsocket from '@fastify/websocket';
import * as studentsRepo from '#repositories/studentsRepository.js';
import { eventBus, STUDENT_EVENTS } from '#services/eventBus.js';

/**
 * Підключає @fastify/websocket та реєструє маршрут /api/v1/ws.
 * При підключенні клієнта одразу шле snapshot поточного списку,
 * далі ретранслює події з EventEmitter (created/updated/deleted).
 */
const realtimePlugin = async (fastify) => {
  await fastify.register(fastifyWebsocket);

  fastify.get('/ws', { websocket: true }, async (socket /* , req */) => {
    fastify.log.info('[WS] Клієнт підключився');

    // 1) snapshot поточного списку
    try {
      const all = await studentsRepo.findAll();
      socket.send(JSON.stringify({ event: 'snapshot', data: all }));
    } catch (err) {
      fastify.log.error({ err }, '[WS] не вдалося надіслати snapshot');
    }

    // 2) listeners на події з REST-контролерів
    const safeSend = (payload) => {
      if (socket.readyState === 1 /* OPEN */) {
        socket.send(JSON.stringify(payload));
      }
    };

    const onCreated = (data) => safeSend({ event: 'created', data });
    const onUpdated = (data) => safeSend({ event: 'updated', data });
    const onDeleted = (id) => safeSend({ event: 'deleted', id });

    eventBus.on(STUDENT_EVENTS.CREATED, onCreated);
    eventBus.on(STUDENT_EVENTS.UPDATED, onUpdated);
    eventBus.on(STUDENT_EVENTS.DELETED, onDeleted);

    socket.on('message', (raw) => {
      // Echo / ping-pong для діагностики
      try {
        const text = raw.toString();
        if (text === 'ping') socket.send('pong');
      } catch {
        /* ignore */
      }
    });

    socket.on('close', () => {
      eventBus.off(STUDENT_EVENTS.CREATED, onCreated);
      eventBus.off(STUDENT_EVENTS.UPDATED, onUpdated);
      eventBus.off(STUDENT_EVENTS.DELETED, onDeleted);
      fastify.log.info('[WS] Клієнт відключився');
    });
  });
};

export default realtimePlugin;
