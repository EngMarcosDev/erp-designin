import type { FastifyInstance } from "fastify";
import { Prisma } from "@prisma/client";
import { prisma } from "../db.js";

const toNumber = (value: Prisma.Decimal) => Number(value);

type StockSyncItem = {
  name: string;
  category?: string;
  price?: number;
  stockQty?: number;
  isActive?: boolean;
};

const normalize = (value: string) => value.trim().toLowerCase();

export default async function stockRoutes(app: FastifyInstance) {
  app.get("/stock", async () => {
    const products = await prisma.product.findMany({
      include: { category: true },
      orderBy: { id: "asc" },
    });

    return products.map((product) => ({
      id: product.id,
      name: product.name,
      category: product.category?.slug || "",
      price: toNumber(product.price),
      stockQty: product.stockQty,
      isActive: product.isActive,
    }));
  });

  app.post("/stock/sync", async (request) => {
    const payload = request.body as { items?: StockSyncItem[] };
    const items = Array.isArray(payload?.items) ? payload.items : [];

    const results = [];

    for (const item of items) {
      const name = item.name?.trim();
      if (!name) continue;
      const categorySlug = item.category?.trim() || "";

      let categoryId: number | null = null;
      if (categorySlug) {
        const category = await prisma.category.upsert({
          where: { slug: categorySlug },
          update: { name: categorySlug },
          create: { name: categorySlug, slug: categorySlug },
        });
        categoryId = category.id;
      }

      const existing = await prisma.product.findFirst({
        where: {
          name: { equals: name },
          ...(categoryId ? { categoryId } : {}),
        },
      });

      if (existing) {
        const updated = await prisma.product.update({
          where: { id: existing.id },
          data: {
            ...(item.price !== undefined ? { price: new Prisma.Decimal(item.price) } : {}),
            ...(item.stockQty !== undefined ? { stockQty: item.stockQty } : {}),
            ...(item.isActive !== undefined ? { isActive: item.isActive } : {}),
          },
        });
        results.push({ id: updated.id, name: updated.name, action: "updated" });
      } else {
        const created = await prisma.product.create({
          data: {
            name,
            price: new Prisma.Decimal(item.price ?? 0),
            image: "",
            isNew: false,
            isActive: item.isActive ?? true,
            stockQty: item.stockQty ?? 0,
            categoryId: categoryId ?? undefined,
          },
        });
        results.push({ id: created.id, name: created.name, action: "created" });
      }
    }

    return { ok: true, results };
  });
}
