const cwdBefore = process.cwd();
process.chdir('/sessions/focused-upbeat-hopper/mnt/lab_1');
process.env.PORT='3000';
process.env.HOSTNAME='localhost';
process.env.NODE_ENV='development';
process.env.ADMIN_API_KEY='supersecret123';
process.env.ALLOWED_ORIGIN='http://localhost:3000';
process.env.EXTERNAL_API_URL='http://localhost:3001';
process.env.GITHUB_TOKEN='';
const list = [
  './utils/backup.js',
  './services/eventBus.js',
  './src/transforms/studentAvgGradeTransform.js',
  './src/transforms/ndjsonTransform.js',
  './src/streams/studentsReadable.js',
  './controllers/studentsController.js',
  './routes/v1/students.js',
  './routes/v1/backups.js',
  './plugins/apiV1.js',
  './plugins/realtime.js',
];
for (const m of list) {
  try {
    await import(m);
    console.log('✓', m);
  } catch(e) {
    console.log('✗', m, '-', e.message);
  }
}
process.chdir(cwdBefore);
