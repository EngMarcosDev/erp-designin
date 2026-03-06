import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db.js";

const preferenceSchema = z.object({
  orderId: z.number().int(),
  items: z.array(
    z.object({
      title: z.string().min(1),
      quantity: z.number().int().positive(),
      unitPrice: z.number().positive(),
    })
  ),
  payerEmail: z.string().email().optional(),
});

const mpBaseUrl = "https://api.mercadopago.com";

export default async function paymentsRoutes(app: FastifyInstance) {
  app.post("/payments/mercadopago/preference", async (request, reply) => {
    const body = preferenceSchema.parse(request.body);
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      return reply.code(500).send({ error: "Mercado Pago não configurado" });
    }

    const successUrl = process.env.MP_SUCCESS_URL || "http://localhost:8080/pagamento/sucesso";
    const failureUrl = process.env.MP_FAILURE_URL || "http://localhost:8080/pagamento/erro";
    const pendingUrl = process.env.MP_PENDING_URL || "http://localhost:8080/pagamento/pendente";
    const webhookUrl = process.env.MP_WEBHOOK_URL || "http://localhost:3333/api/payments/mercadopago/webhook";

    const isLocalhost = (url: string) =>
      url.includes("localhost") || url.includes("127.0.0.1");
    const allowAutoReturn = !isLocalhost(successUrl);

    const response = await fetch(`${mpBaseUrl}/checkout/preferences`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: body.items.map((item) => ({
          title: item.title,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          currency_id: "BRL",
        })),
        external_reference: String(body.orderId),
        payer: body.payerEmail ? { email: body.payerEmail } : undefined,
        back_urls: {
          success: `${successUrl}?orderId=${body.orderId}`,
          failure: `${failureUrl}?orderId=${body.orderId}`,
          pending: `${pendingUrl}?orderId=${body.orderId}`,
        },
        notification_url: webhookUrl,
        ...(allowAutoReturn ? { auto_return: "approved" } : {}),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return reply.code(502).send({ error: "Mercado Pago erro", details: error });
    }

    const data = await response.json();
    return reply.code(200).send({
      id: data.id,
      init_point: data.init_point,
      sandbox_init_point: data.sandbox_init_point,
    });
  });

  app.post("/payments/mercadopago/webhook", async (request, reply) => {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      return reply.code(500).send({ error: "Mercado Pago não configurado" });
    }

    const payload = request.body as {
      type?: string;
      data?: { id?: string | number };
    };
    const paymentId = payload?.data?.id;
    if (!paymentId) {
      return reply.code(200).send({ ok: true });
    }

    try {
      const response = await fetch(`${mpBaseUrl}/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        return reply.code(200).send({ ok: true });
      }
      const payment = await response.json();
      const externalReference = payment?.external_reference;
      const status = payment?.status || "pending";

      if (externalReference) {
        const orderId = Number(externalReference);
        if (!Number.isNaN(orderId)) {
          await prisma.order.update({
            where: { id: orderId },
            data: { status },
          });
        }
      }
    } catch {
      // ignore webhook errors to avoid retries storm
    }

    return reply.code(200).send({ ok: true });
  });
}
