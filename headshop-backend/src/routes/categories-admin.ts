import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireRole } from "../auth.js";

const categorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
});

export default async function categoriesAdminRoutes(app: FastifyInstance) {
  app.post(
    "/categories",
    { preHandler: requireRole(app, ["ADMIN", "STAFF"]) },
    async (request, reply) => {
      const body = categorySchema.parse(request.body);

      const category = await prisma.category.create({ data: body });
      return reply.code(201).send(category);
    }
  );

  app.delete(
    "/categories/:id",
    { preHandler: requireRole(app, ["ADMIN"]) },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      await prisma.category.delete({ where: { id: Number(id) } });
      return reply.code(204).send();
    }
  );
}
