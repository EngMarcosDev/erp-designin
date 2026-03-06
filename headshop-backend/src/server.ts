import Fastify from "fastify";
import cors from "@fastify/cors";
import dotenv from "dotenv";
import jwt from "@fastify/jwt";
import productsRoutes from "./routes/products.js";
import categoriesRoutes from "./routes/categories.js";
import productsAdminRoutes from "./routes/products-admin.js";
import categoriesAdminRoutes from "./routes/categories-admin.js";
import productsPublicRoutes from "./routes/products-public.js";
import newsletterRoutes from "./routes/newsletter.js";
import reportsRoutes from "./routes/reports.js";
import authRoutes from "./routes/auth.js";
import ordersRoutes from "./routes/orders.js";
import paymentsRoutes from "./routes/payments.js";
import stockRoutes from "./routes/stock.js";

dotenv.config();

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: true,
});

await app.register(jwt, {
  secret: process.env.JWT_SECRET ?? "change-me",
});

app.get("/api/health", async () => {
  return { ok: true, timestamp: new Date().toISOString() };
});

await app.register(authRoutes, { prefix: "/api" });
await app.register(productsRoutes, { prefix: "/api" });
await app.register(categoriesRoutes, { prefix: "/api" });
await app.register(productsPublicRoutes, { prefix: "/api" });
await app.register(newsletterRoutes, { prefix: "/api" });
await app.register(ordersRoutes, { prefix: "/api" });
await app.register(paymentsRoutes, { prefix: "/api" });
await app.register(productsAdminRoutes, { prefix: "/api/admin" });
await app.register(categoriesAdminRoutes, { prefix: "/api/admin" });
await app.register(reportsRoutes, { prefix: "/api/admin" });
await app.register(stockRoutes, { prefix: "/api" });

const port = Number(process.env.PORT ?? 3333);
const host = process.env.HOST ?? "0.0.0.0";

try {
  await app.listen({ port, host });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
