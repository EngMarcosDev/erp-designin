import type { FastifyInstance } from "fastify";
import { Prisma } from "@prisma/client";
import { prisma } from "../db.js";

const toNumber = (value: Prisma.Decimal) => Number(value);

const serializeProduct = (product: {
  id: number;
  name: string;
  price: Prisma.Decimal;
  image: string;
  isNew: boolean;
  isActive: boolean;
  category?: { slug: string } | null;
}) => ({
  id: product.id,
  name: product.name,
  price: toNumber(product.price),
  image: product.image,
  isNew: product.isNew,
  isActive: product.isActive,
  category: product.category?.slug,
});

export default async function productsRoutes(app: FastifyInstance) {
  app.get("/products/featured", async () => {
    const products = await prisma.product.findMany({
      where: { isFeatured: true, isActive: true },
      orderBy: { id: "desc" },
      include: { category: true },
    });

    return { data: products.map(serializeProduct) };
  });

  app.get("/products/popular", async () => {
    const products = await prisma.product.findMany({
      where: { isPopular: true, isActive: true },
      orderBy: { id: "desc" },
      include: { category: true },
    });

    return { data: products.map(serializeProduct) };
  });
}
