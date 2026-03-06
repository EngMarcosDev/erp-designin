import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../db.js";

const toNumber = (value: Prisma.Decimal) => Number(value);

const filtersSchema = z.object({
  color: z.string().optional(),
  material: z.string().optional(),
  category: z.string().optional(),
});

export default async function productsPublicRoutes(app: FastifyInstance) {
  app.get("/products", async (request) => {
    const { color, material, category } = filtersSchema.parse(request.query);

    const products = await prisma.product.findMany({
      where: {
        ...(category ? { category: { slug: category } } : {}),
        ...(color ? { colors: { contains: color } } : {}),
        ...(material ? { materials: { contains: material } } : {}),
        isActive: true,
      },
      include: { category: true, images: true },
    });

    return {
      data: products.map((product) => ({
        id: product.id,
        name: product.name,
        price: toNumber(product.price),
        image: product.image,
        isNew: product.isNew,
        isActive: product.isActive,
        category: product.category?.slug,
        colors: product.colors,
        materials: product.materials,
        images: product.images.map((img) => ({
          id: img.id,
          url: img.url,
          alt: img.alt,
        })),
      })),
    };
  });
}
