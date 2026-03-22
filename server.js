const http = require("http");
const config = require("#config/env");
const router = require("#routes/index");
const gracefulShutdown = require("#utils/gracefulShutdown");

const server = http.createServer(router);

server.listen(config.PORT, config.HOSTNAME, () => {
  console.log(`Сервер запущено: http://${config.HOSTNAME}:${config.PORT}/`);
});

process.on("SIGINT", () => gracefulShutdown("SIGINT", server));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM", server));

process.on("uncaughtException", (err) => {
  console.error(`[CRITICAL] Uncaught Exception: ${err.message}`);
  gracefulShutdown("uncaughtException", server);
});

process.on("unhandledRejection", (reason) => {
  console.error(`[CRITICAL] Unhandled Rejection: ${reason}`);
  gracefulShutdown("unhandledRejection", server);
});
