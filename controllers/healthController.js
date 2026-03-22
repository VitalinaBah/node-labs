const getHealth = (req, res) => {
  const healthData = {
    pid: process.pid,
    nodeVersion: process.version,
    platform: process.platform,
    uptime: Math.floor(process.uptime()) + 's',
    memoryUsage: process.memoryUsage(),
  };
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(healthData));
};

export { getHealth };