import { EventEmitter } from 'node:events';

/**
 * Глобальна шина подій між REST-контролерами та WebSocket-обробником.
 * REST emit'ить подію → WebSocket plugin слухає та розсилає клієнтам.
 *
 * Використовуємо EventEmitter (патерн Observer / Pub-Sub) — стандартний для
 * Node.js спосіб розв'язати компоненти без прямих залежностей.
 */
export const eventBus = new EventEmitter();

// Збільшуємо ліміт, бо кожен WS-клієнт додає 3 listeners (created/updated/deleted)
eventBus.setMaxListeners(100);

export const STUDENT_EVENTS = Object.freeze({
  CREATED: 'student:created',
  UPDATED: 'student:updated',
  DELETED: 'student:deleted',
});
