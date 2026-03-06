import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db.js";

const newsletterSchema = z.object({
  email: z.string().email(),
  source: z.string().optional(),
});

export default async function newsletterRoutes(app: FastifyInstance) {
  app.post("/newsletter", async (request, reply) => {
    const body = newsletterSchema.parse(request.body);

    const exists = await prisma.newsletterSubscriber.findUnique({
      where: { email: body.email },
    });

    if (exists) {
      return reply.code(200).send({ ok: true, alreadySubscribed: true });
    }

    await prisma.newsletterSubscriber.create({
      data: { email: body.email, source: body.source },
    });

    return reply.code(201).send({ ok: true, alreadySubscribed: false });
  });
}
