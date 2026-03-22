const { getHealth } = require("#controllers/healthController");
const logger = require("#utils/logger");

const router = (req, res) => {
  if (req.url === "/health" && req.method === "GET") {
    getHealth(req, res);
    logger(req, res);
    return;
  }

  res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Сервер працює");
  logger(req, res);
};

module.exports = router;
