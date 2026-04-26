import { getStudentsPaginated } from '#controllers/studentsController.js';
import {
  paginationQuerySchema,
  paginatedStudentsResponseSchema,
} from '#schemas/paginationSchema.js';

const TAG = 'items v2';

const studentRoutesV2 = async (fastify) => {
  // GET /api/v2/items — пагінований список (page, limit, фільтр course)
  fastify.get(
    '/',
    {
      schema: {
        tags: [TAG],
        summary: 'Список студентів з пагінацією (page, limit)',
        querystring: paginationQuerySchema,
        response: { 200: paginatedStudentsResponseSchema },
      },
    },
    getStudentsPaginated,
  );
};

export default studentRoutesV2;
