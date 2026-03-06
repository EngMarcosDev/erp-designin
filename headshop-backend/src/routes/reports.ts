import type { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import { requireRole } from "../auth.js";

export default async function reportsRoutes(app: FastifyInstance) {
  app.get(
    "/reports/top-products",
    { preHandler: requireRole(app, ["ADMIN", "STAFF"]) },
    async (request, reply) => {
      const results = await prisma.orderItem.groupBy({
        by: ["productId"],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 20,
      });

      const productIds = results.map((row) => row.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
      });

      const productMap = new Map(products.map((p) => [p.id, p]));

      const data = results.map((row) => {
        const product = productMap.get(row.productId);
        return {
          productId: row.productId,
          name: product?.name ?? "Produto",
          totalSold: row._sum.quantity ?? 0,
        };
      });

      return reply.send({ data });
    }
  );
}
