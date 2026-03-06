import type { FastifyInstance } from "fastify";
import { Prisma } from "@prisma/client";
import { prisma } from "../db.js";

const toNumber = (value: Prisma.Decimal) => Number(value);

export default async function categoriesRoutes(app: FastifyInstance) {
  app.get("/categories/:slug/products", async (request, reply) => {
    const { slug } = request.params as { slug: string };

    const category = await prisma.category.findUnique({
      where: { slug },
    });

    if (!category) {
      reply.code(200);
      return { data: [] };
    }

    const products = await prisma.product.findMany({
      where: { categoryId: category.id, isActive: true },
      orderBy: { id: "desc" },
    });

    return {
      data: products.map((product) => ({
        id: product.id,
        name: product.name,
        price: toNumber(product.price),
        image: product.image,
        isNew: product.isNew,
        isActive: product.isActive,
        category: slug,
      })),
    };
  });
}
