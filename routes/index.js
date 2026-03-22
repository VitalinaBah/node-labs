import { getHealth } from '#controllers/healthController.js';
import logger from '#utils/logger.js';

const router = (req, res) => {
  if (req.url === '/health' && req.method === 'GET') {
    getHealth(req, res);
    logger(req, res);
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Сервер працює');
  logger(req, res);
};

export default router;