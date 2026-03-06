import bcrypt from "bcryptjs";
import type { FastifyInstance, FastifyRequest } from "fastify";

declare module "fastify" {
  interface FastifyRequest {
    user?: { id: number; role: "ADMIN" | "STAFF" };
  }
}

export function requireAuth(app: FastifyInstance) {
  return async (request: FastifyRequest) => {
    try {
      await request.jwtVerify();
    } catch {
      throw app.httpErrors.unauthorized("Token inválido ou ausente");
    }
  };
}

export function requireRole(app: FastifyInstance, roles: Array<"ADMIN" | "STAFF">) {
  return async (request: FastifyRequest) => {
    try {
      const payload = await request.jwtVerify<{ id: number; role: "ADMIN" | "STAFF" }>();
      if (!roles.includes(payload.role)) {
        throw app.httpErrors.forbidden("Sem permissão");
      }
      request.user = payload;
    } catch {
      throw app.httpErrors.unauthorized("Token inválido ou ausente");
    }
  };
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  if (!hash) return false;
  const normalized = String(hash);
  if (!normalized.startsWith("$2")) {
    // Backward compatibility for legacy/plain passwords
    return password === normalized;
  }
  return bcrypt.compare(password, normalized);
}

