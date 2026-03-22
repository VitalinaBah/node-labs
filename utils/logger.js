import config from '#config/env.js';

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

export default logger;