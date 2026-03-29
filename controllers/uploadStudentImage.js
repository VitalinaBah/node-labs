import fs from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { createWriteStream } from 'node:fs';
import { formatImageUrl } from '#utils/formatImageUrl.js';

const ALLOWED_MIME = ['image/jpeg', 'image/png'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const uploadStudentImage = async (request, reply) => {
  const { id } = request.params;

  const student = await studentsRepo.findById(id);
  if (!student) return reply.notFound('Student not found');

  const file = await request.file({ limits: { fileSize: MAX_SIZE } });
  if (!file) return reply.badRequest('Файл не завантажено');

  if (!ALLOWED_MIME.includes(file.mimetype)) {
    return reply.badRequest('Дозволені тільки image/jpeg та image/png');
  }

  const uploadDir = path.join(process.cwd(), 'uploads', String(id));
  await fs.mkdir(uploadDir, { recursive: true });

  const ext = file.mimetype === 'image/png' ? 'png' : 'jpg';
  const fileName = `image.${ext}`;
  const filePath = path.join(uploadDir, fileName);

  await pipeline(file.file, createWriteStream(filePath));

  const relativePath = `/${id}/${fileName}`;
  const updated = await studentsRepo.update(id, { image: relativePath });

  return reply.send({
    ...updated,
    image: formatImageUrl(request, relativePath),
  });
};