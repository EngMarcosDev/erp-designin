import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db.js";
import { hashPassword, verifyPassword } from "../auth.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8).optional(),
  password: z.string().min(6),
});

const verifySchema = z.object({
  email: z.string().email(),
  code: z.string().min(4),
});

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "STAFF"]).default("STAFF"),
});

const createVerificationCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const verificationTTLMinutes = 15;

export default async function authRoutes(app: FastifyInstance) {
  app.post("/auth/login", async (request, reply) => {
    const body = loginSchema.parse(request.body);
    const email = body.email.toLowerCase();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      return reply.code(401).send({ error: "Credenciais inválidas" });
    }
    if (!user.emailVerified) {
      return reply.code(403).send({ error: "Email não verificado" });
    }

    const valid = await verifyPassword(body.password, user.password);
    if (!valid) {
      return reply.code(401).send({ error: "Credenciais inválidas" });
    }

    const token = app.jwt.sign({ id: user.id, role: user.role });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  });

  app.post("/auth/register", async (request, reply) => {
    const body = registerSchema.parse(request.body);
    const email = body.email.toLowerCase();

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return reply.code(409).send({ error: "Email já cadastrado" });
    }

    const password = await hashPassword(body.password);
    const user = await prisma.user.create({
      data: {
        name: body.name,
        email,
        phone: body.phone,
        password,
        role: "CUSTOMER",
        emailVerified: false,
      },
    });

    const code = createVerificationCode();
    const expiresAt = new Date(Date.now() + verificationTTLMinutes * 60 * 1000);

    await prisma.emailVerification.create({
      data: {
        userId: user.id,
        code,
        expiresAt,
      },
    });

    return reply.code(201).send({
      ok: true,
      message: "Conta criada. Verifique seu email para ativar.",
      ...(process.env.NODE_ENV !== "production" ? { verificationCode: code } : {}),
    });
  });

  app.post("/auth/verify", async (request, reply) => {
    const body = verifySchema.parse(request.body);
    const email = body.email.toLowerCase();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return reply.code(404).send({ error: "Usuário não encontrado" });
    }

    const record = await prisma.emailVerification.findFirst({
      where: {
        userId: user.id,
        code: body.code,
        usedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      return reply.code(400).send({ error: "Código inválido" });
    }

    if (record.expiresAt.getTime() < Date.now()) {
      return reply.code(400).send({ error: "Código expirado" });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });

    await prisma.emailVerification.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });

    return reply.code(200).send({ ok: true });
  });

  app.post("/auth/users", async (request, reply) => {
    const body = createUserSchema.parse(request.body);
    const email = body.email.toLowerCase();

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return reply.code(409).send({ error: "Email já cadastrado" });
    }

    const password = await hashPassword(body.password);
    const user = await prisma.user.create({
      data: { name: body.name, email, password, role: body.role, emailVerified: true },
    });

    return reply.code(201).send({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  });
}
