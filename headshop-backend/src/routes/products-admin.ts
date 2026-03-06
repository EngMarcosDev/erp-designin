import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireRole } from "../auth.js";

const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.number().positive(),
  image: z.string().url(),
  colors: z.string().optional(),
  materials: z.string().optional(),
  isNew: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isPopular: z.boolean().optional(),
  stockQty: z.number().int().nonnegative().optional(),
  categoryId: z.number().int().optional(),
  images: z.array(z.object({ url: z.string().url(), alt: z.string().optional() })).optional(),
});

export default async function productsAdminRoutes(app: FastifyInstance) {
  app.post(
    "/products",
    { preHandler: requireRole(app, ["ADMIN", "STAFF"]) },
    async (request, reply) => {
      const body = productSchema.parse(request.body);

      const product = await prisma.product.create({
        data: {
          name: body.name,
          description: body.description,
          price: body.price,
          image: body.image,
          colors: body.colors,
          materials: body.materials,
          isNew: body.isNew ?? false,
          isFeatured: body.isFeatured ?? false,
          isPopular: body.isPopular ?? false,
          stockQty: body.stockQty ?? 0,
          categoryId: body.categoryId,
          images: body.images
            ? {
                create: body.images.map((img) => ({
                  url: img.url,
                  alt: img.alt,
                })),
              }
            : undefined,
        },
      });

      return reply.code(201).send(product);
    }
  );

  app.patch(
    "/products/:id",
    { preHandler: requireRole(app, ["ADMIN", "STAFF"]) },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = productSchema.partial().parse(request.body);

      const product = await prisma.product.update({
        where: { id: Number(id) },
        data: {
          name: body.name,
          description: body.description,
          price: body.price,
          image: body.image,
          colors: body.colors,
          materials: body.materials,
          isNew: body.isNew,
          isFeatured: body.isFeatured,
          isPopular: body.isPopular,
          stockQty: body.stockQty,
          categoryId: body.categoryId,
        },
      });

      return reply.send(product);
    }
  );

  app.post(
    "/products/:id/images",
    { preHandler: requireRole(app, ["ADMIN", "STAFF"]) },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = z
        .object({ url: z.string().url(), alt: z.string().optional() })
        .parse(request.body);

      const image = await prisma.productImage.create({
        data: {
          productId: Number(id),
          url: body.url,
          alt: body.alt,
        },
      });

      return reply.code(201).send(image);
    }
  );

  app.delete(
    "/products/:id",
    { preHandler: requireRole(app, ["ADMIN"]) },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      await prisma.product.delete({ where: { id: Number(id) } });
      return reply.code(204).send();
    }
  );
}
