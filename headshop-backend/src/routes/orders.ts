import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db.js";

const orderItemSchema = z.object({
  productId: z.number().int(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
});

const orderSchema = z.object({
  customer: z
    .object({
      name: z.string().min(2),
      email: z.string().email(),
      phone: z.string().optional(),
    })
    .optional(),
  items: z.array(orderItemSchema).min(1),
});

export default async function ordersRoutes(app: FastifyInstance) {
  app.get("/orders", async () => {
    const orders = await prisma.order.findMany({
      include: {
        customer: true,
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return orders.map((order) => ({
      id: order.id,
      email: order.customer?.email || "",
      total: Number(order.total),
      status: order.status,
      createdAt: order.createdAt,
      items: order.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
      })),
    }));
  });

  app.post("/orders", async (request, reply) => {
    const body = orderSchema.parse(request.body);

    const total = body.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    const customer = body.customer
      ? await prisma.customer.upsert({
          where: { email: body.customer.email },
          update: {
            name: body.customer.name,
            phone: body.customer.phone,
          },
          create: {
            name: body.customer.name,
            email: body.customer.email,
            phone: body.customer.phone,
          },
        })
      : null;

    const order = await prisma.order.create({
      data: {
        total,
        customerId: customer?.id,
        items: {
          create: body.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
      },
      include: { items: true },
    });

    return reply.code(201).send(order);
  });
}
