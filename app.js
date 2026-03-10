const http = require('http');
const config = require('./config');

// Формат: [INFO] GET /students | Status: 404 | Agent: Mozilla/5.0... | IP: 127.0.0.1
const logger = (req, res) => {
    const level = res.statusCode >= 400 ? 'ERROR' : 'INFO';
    const method = req.method;
    const url = req.url;
    const status = res.statusCode;
    const agent = req.headers['user-agent'] || 'Unknown Agent';
    const ip = req.socket.remoteAddress || 'Unknown IP';

    const logLine = `[${level}] ${method} ${url} | Status: ${status} | Agent: ${agent} | IP: ${ip}\n`;

    if (config.NODE_ENV === 'development') {
        process.stdout.write(logLine);
    } else if (config.NODE_ENV === 'production' && res.statusCode >= 400) {
        process.stderr.write(logLine);
    }
};

const server = http.createServer((req, res) => {
    // Ендпоінт /health (Завдання 8)
    if (req.url === '/health' && req.method === 'GET') {
        const healthData = {
            pid: process.pid,
            nodeVersion: process.version,
            platform: process.platform,
            uptime: Math.floor(process.uptime()) + 's',
            memoryUsage: process.memoryUsage()
        };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(healthData));
        logger(req, res);
        return;
    }

    // Стандартна відповідь
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Сервер працює');
    logger(req, res);
});

// Запуск сервера
server.listen(config.PORT, config.HOSTNAME, () => {
    console.log(`Сервер запущено: http://${config.HOSTNAME}:${config.PORT}/`);
});

// Функція Graceful Shutdown (Завдання 5)
function gracefulShutdown(signal) {
    console.log(`\n[SYSTEM] Отримано сигнал: ${signal}. Закриваємо ресурси...`);

    const forceExitTimeout = setTimeout(() => {
        console.error("[SYSTEM] Не вдалося завершити роботу вчасно. Примусовий вихід.");
        process.exit(1);
    }, 10000);

    server.close((err) => {
        clearTimeout(forceExitTimeout);
        if (err) {
            console.error("[SYSTEM] Помилка при закритті сервера:", err);
            process.exit(1);
        }
        console.log("[SYSTEM] Сервер успішно зупинено. Процес завершено.");
        process.exit(0);
    });
}

// Обробка сигналів та помилок (Завдання 6 та 7)
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

process.on('uncaughtException', (err) => {
    console.error(`[CRITICAL] Uncaught Exception: ${err.message}`);
    gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
    console.error(`[CRITICAL] Unhandled Rejection: ${reason}`);
    gracefulShutdown('unhandledRejection');
});