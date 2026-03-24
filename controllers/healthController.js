const getHealth = async (request, reply) => {
  return reply.send({ status: 'ok' });
};

const getHealthDetails = async (request, reply) => {
  return reply.send({
    pid: process.pid,
    nodeVersion: process.version,
    platform: process.platform,
    uptime: Math.floor(process.uptime()) + 's',
    memoryUsage: process.memoryUsage(),
  });
};

export { getHealth, getHealthDetails };