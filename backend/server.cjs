const http = require("http");
const { Pool } = require("pg");
require("dotenv").config();
const headshopApiBase = process.env.HEADSHOP_API_URL || "http://localhost:3000/api";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://abacaxita:change_me@localhost:5432/abacaxita_erp";

const pool = new Pool({
  connectionString: DATABASE_URL,
});

const sendJson = (res, status, payload) => {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(payload));
};

const parseBody = (req) =>
  new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });

const toProduct = (row) => ({
  id: Number(row.id),
  name: row.name,
  price: Number(row.price || 0),
  category: String(row.category || row.categoryId || "geral"),
  active: row.active ?? row.isActive ?? true,
  stock: Number(row.stock || row.stockQty || 0),
  image: row.image || "",
  bannerImage: row.banner_image || row.image || "",
  colors: row.colors || null,
  materials: row.materials || null,
  isNew: !!(row.is_new ?? row.isNew),
  isFeatured: !!(row.is_featured ?? row.isFeatured),
  isPopular: !!(row.is_popular ?? row.isPopular),
});

const toUser = (row) => ({
  id: Number(row.id),
  name: row.name || "Sem nome",
  email: row.email || "",
  role: row.role || "USUARIO",
  active: row.active !== false,
  permissions: Array.isArray(row.permissions) ? row.permissions : [],
  avatar: row.avatar || "",
  image: row.avatar || "",
  createdAt: row.created_at || null,
});

const toOrder = (row) => ({
  id: Number(row.id),
  email: row.email || "",
  items: Array.isArray(row.items) ? row.items : [],
  total: Number(row.total || 0),
  status: row.status || "pendente",
  createdAt: row.created_at,
  paidAt: row.paid_at || null,
});

const normalizeKey = (name, category) =>
  `${String(name || "").trim().toLowerCase()}|${String(category || "").trim().toLowerCase()}`;

const fetchHeadshopStock = async () => {
  const response = await fetch(`${headshopApiBase}/stock`);
  if (!response.ok) {
    throw new Error(`HeadShop API error ${response.status}`);
  }
  return response.json();
};

const buildUpdate = (payload, fieldMap) => {
  const setParts = [];
  const values = [];

  Object.entries(fieldMap).forEach(([incomingKey, dbColumn]) => {
    if (payload[incomingKey] !== undefined) {
      values.push(payload[incomingKey]);
      setParts.push(`${dbColumn} = $${values.length}`);
    }
  });

  return { setParts, values };
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const method = req.method || "GET";

    if (method === "OPTIONS") {
      return sendJson(res, 200, { ok: true });
    }

    // Auth
    if (url.pathname === "/auth/login" && method === "POST") {
      const payload = await parseBody(req);
      const email = String(payload.email || "").trim().toLowerCase();
      const password = String(payload.password || "");

      if (!email || !password) {
        return sendJson(res, 400, { message: "Email e senha obrigatorios" });
      }

      const { rows } = await pool.query(
        "SELECT email, role, password, active FROM users WHERE lower(email) = $1 LIMIT 1",
        [email],
      );
      const user = rows[0];

      if (!user || String(user.password || "") !== password) {
        return sendJson(res, 401, { message: "Credenciais invalidas" });
      }

      if (user.active === false) {
        return sendJson(res, 403, { message: "Usuario inativo" });
      }

      return sendJson(res, 200, {
        email: user.email,
        role: user.role || "ADMIN",
      });
    }

    // Products
    if (url.pathname === "/products" && method === "GET") {
      const { rows } = await pool.query(
        `SELECT id, name, price, category, active, stock, image, banner_image, colors, materials,
                is_new, is_featured, is_popular, created_at, updated_at
           FROM products
           WHERE active = TRUE
           ORDER BY name ASC`,
      );
      return sendJson(res, 200, rows.map(toProduct));
    }

    if (url.pathname === "/products" && method === "POST") {
      const payload = await parseBody(req);
      const { rows } = await pool.query(
        `
          INSERT INTO products
            (name, price, category, active, stock, image, banner_image, colors, materials, is_new, is_featured, is_popular)
          VALUES
            ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING *
        `,
        [
          payload.name || "Sem nome",
          Number(payload.price || 0),
          payload.category || "geral",
          payload.active !== false,
          Number(payload.stock || 0),
          payload.image || "",
          payload.bannerImage || "",
          payload.colors || null,
          payload.materials || null,
          !!payload.isNew,
          !!payload.isFeatured,
          !!payload.isPopular,
        ],
      );
      return sendJson(res, 201, toProduct(rows[0]));
    }

    if (url.pathname.startsWith("/products/") && method === "PUT") {
      const id = Number(url.pathname.split("/")[2]);
      if (!Number.isFinite(id)) {
        return sendJson(res, 400, { message: "ID invalido" });
      }

      const payload = await parseBody(req);
      const normalizedPayload = {
        ...payload,
        bannerImage: payload.bannerImage,
        isNew: payload.isNew,
        isFeatured: payload.isFeatured,
        isPopular: payload.isPopular,
      };
      const { setParts, values } = buildUpdate(normalizedPayload, {
        name: "name",
        price: "price",
        category: "category",
        active: "active",
        stock: "stock",
        image: "image",
        bannerImage: "banner_image",
        colors: "colors",
        materials: "materials",
        isNew: "is_new",
        isFeatured: "is_featured",
        isPopular: "is_popular",
      });

      if (setParts.length === 0) {
        return sendJson(res, 400, { message: "Nada para atualizar" });
      }

      values.push(id);
      const { rows } = await pool.query(
        `
          UPDATE products
          SET ${setParts.join(", ")}, updated_at = NOW()
          WHERE id = $${values.length}
          RETURNING *
        `,
        values,
      );

      if (!rows[0]) {
        return sendJson(res, 404, { message: "Produto nao encontrado" });
      }

      return sendJson(res, 200, toProduct(rows[0]));
    }

    if (url.pathname.startsWith("/products/") && method === "DELETE") {
      const id = Number(url.pathname.split("/")[2]);
      if (!Number.isFinite(id)) {
        return sendJson(res, 400, { message: "ID invalido" });
      }

      const result = await pool.query("DELETE FROM products WHERE id = $1", [id]);
      if (!result.rowCount) {
        return sendJson(res, 404, { message: "Produto nao encontrado" });
      }
      return sendJson(res, 200, { ok: true });
    }

    // Users
    if (url.pathname === "/users" && method === "GET") {
      const { rows } = await pool.query(
        "SELECT id, name, email, role, active, permissions, avatar, created_at FROM users ORDER BY name ASC",
      );
      return sendJson(res, 200, rows.map(toUser));
    }

    if (url.pathname === "/users" && method === "POST") {
      const payload = await parseBody(req);
      const email = String(payload.email || "").trim().toLowerCase();
      if (!email) {
        return sendJson(res, 400, { message: "Email obrigatorio" });
      }

      const { rows } = await pool.query(
        `
          INSERT INTO users
            (name, email, role, active, permissions, avatar, password)
          VALUES
            ($1, $2, $3, $4, $5::jsonb, $6, $7)
          RETURNING id, name, email, role, active, permissions, avatar, created_at
        `,
        [
          payload.name || email || "Sem nome",
          email,
          payload.role || "USUARIO",
          payload.active !== false,
          JSON.stringify(payload.permissions || []),
          payload.image || payload.avatar || "",
          payload.password || "",
        ],
      );

      return sendJson(res, 201, toUser(rows[0]));
    }

    if (url.pathname.startsWith("/users/") && method === "PUT") {
      const id = Number(url.pathname.split("/")[2]);
      if (!Number.isFinite(id)) {
        return sendJson(res, 400, { message: "ID invalido" });
      }

      const payload = await parseBody(req);
      const normalizedPayload = {
        ...payload,
        email:
          payload.email !== undefined
            ? String(payload.email || "").trim().toLowerCase()
            : undefined,
        avatar: payload.avatar !== undefined ? payload.avatar : payload.image,
        permissions:
          payload.permissions !== undefined
            ? JSON.stringify(payload.permissions || [])
            : undefined,
      };

      const { setParts, values } = buildUpdate(normalizedPayload, {
        name: "name",
        email: "email",
        role: "role",
        active: "active",
        permissions: "permissions",
        avatar: "avatar",
        password: "password",
      });

      if (setParts.length === 0) {
        return sendJson(res, 400, { message: "Nada para atualizar" });
      }

      values.push(id);
      const { rows } = await pool.query(
        `
          UPDATE users
          SET ${setParts.join(", ")}, updated_at = NOW()
          WHERE id = $${values.length}
          RETURNING id, name, email, role, active, permissions, avatar, created_at
        `,
        values,
      );

      if (!rows[0]) {
        return sendJson(res, 404, { message: "Usuario nao encontrado" });
      }

      return sendJson(res, 200, toUser(rows[0]));
    }

    if (url.pathname.startsWith("/users/") && method === "DELETE") {
      const id = Number(url.pathname.split("/")[2]);
      if (!Number.isFinite(id)) {
        return sendJson(res, 400, { message: "ID invalido" });
      }

      const result = await pool.query("DELETE FROM users WHERE id = $1", [id]);
      if (!result.rowCount) {
        return sendJson(res, 404, { message: "Usuario nao encontrado" });
      }
      return sendJson(res, 200, { ok: true });
    }

    // Orders
    if (url.pathname === "/orders" && method === "GET") {
      const { rows } = await pool.query("SELECT * FROM orders ORDER BY created_at DESC");
      return sendJson(res, 200, rows.map(toOrder));
    }

    if (url.pathname === "/orders" && method === "POST") {
      const payload = await parseBody(req);
      const items = Array.isArray(payload.items) ? payload.items : [];
      const status = payload.status || "pendente";
      const paidAt = status === "pago" || status === "approved" || status === "paid" ? new Date() : null;

      const { rows } = await pool.query(
        `
          INSERT INTO orders
            (email, items, total, status, paid_at)
          VALUES
            ($1, $2::jsonb, $3, $4, $5)
          RETURNING *
        `,
        [
          payload.email || "",
          JSON.stringify(items),
          Number(payload.total || 0),
          status,
          paidAt,
        ],
      );

      return sendJson(res, 201, toOrder(rows[0]));
    }

    // Reports
    if (url.pathname === "/reports/stock" && method === "GET") {
      const { rows } = await pool.query(
        "SELECT id, name, stock, active FROM products ORDER BY name ASC",
      );
      return sendJson(
        res,
        200,
        rows.map((row) => ({
          id: Number(row.id),
          name: row.name,
          stock: Number(row.stock || 0),
          active: row.active,
        })),
      );
    }

    // Sync real HeadShop
    if (url.pathname === "/sync/stock/compare" && method === "GET") {
      const headshop = await fetchHeadshopStock();
      const { rows } = await pool.query(
        "SELECT id, name, category, stock, price, active FROM products ORDER BY name ASC",
      );

      const erpMap = new Map();
      rows.forEach((p) => {
        erpMap.set(normalizeKey(p.name, p.category), p);
      });

      const headMap = new Map();
      (headshop || []).forEach((h) => {
        headMap.set(normalizeKey(h.name, h.category), h);
      });

      const keys = new Set([...erpMap.keys(), ...headMap.keys()]);
      const result = [];
      keys.forEach((key) => {
        const e = erpMap.get(key);
        const h = headMap.get(key);
        result.push({
          key,
          name: e?.name || h?.name || "",
          category: e?.category || h?.category || "geral",
          erp: e
            ? { stock: Number(e.stock || 0), price: Number(e.price || 0), active: e.active }
            : null,
          headshop: h
            ? {
                stock: Number(h.stockQty ?? h.stock ?? 0),
                price: Number(h.price || 0),
                active: h.isActive ?? h.active ?? true,
              }
            : null,
        });
      });

      return sendJson(res, 200, result);
    }

    if (url.pathname === "/sync/stock/pull" && method === "POST") {
      const headshop = await fetchHeadshopStock();
      let updated = 0;
      for (const item of headshop || []) {
        const name = String(item.name || "").trim();
        if (!name) continue;
        const category = String(item.category || "geral").trim();
        const price = Number(item.price || 0);
        const stock = Number(item.stockQty ?? item.stock ?? 0);
        const active = item.isActive ?? item.active ?? true;

        const { rows } = await pool.query(
          "SELECT id FROM products WHERE lower(name) = $1 AND lower(coalesce(category,'')) = $2 LIMIT 1",
          [name.toLowerCase(), category.toLowerCase()],
        );

        if (rows[0]?.id) {
          await pool.query(
            "UPDATE products SET price = $1, stock = $2, active = $3, updated_at = NOW() WHERE id = $4",
            [price, stock, active, rows[0].id],
          );
        } else {
          await pool.query(
            `INSERT INTO products (name, price, category, stock, active, created_at, updated_at)
             VALUES ($1,$2,$3,$4,$5,NOW(),NOW())`,
            [name, price, category, stock, active],
          );
        }
        updated += 1;
      }

      await pool.query(
        "INSERT INTO stock_sync_audit (direction, payload) VALUES ($1, $2::jsonb)",
        ["pull", JSON.stringify({ updated })],
      );

      return sendJson(res, 200, { ok: true, updated });
    }

    if (url.pathname === "/sync/stock/push" && method === "POST") {
      const { rows } = await pool.query(
        "SELECT name, category, price, stock, active FROM products WHERE active = TRUE",
      );
      const items = rows.map((r) => ({
        name: r.name,
        category: r.category || "",
        price: Number(r.price || 0),
        stockQty: Number(r.stock || 0),
        isActive: r.active !== false,
      }));

      const response = await fetch(`${headshopApiBase}/stock/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!response.ok) {
        return sendJson(res, 500, { message: "Nao foi possivel enviar estoque ao HeadShop" });
      }

      await pool.query(
        "INSERT INTO stock_sync_audit (direction, payload) VALUES ($1, $2::jsonb)",
        ["push", JSON.stringify({ sent: items.length })],
      );
      return sendJson(res, 200, { ok: true, sent: items.length });
    }

    return sendJson(res, 404, { message: "Rota nao encontrada" });
  } catch (error) {
    console.error("Erro no handler:", error);
    return sendJson(res, 500, { message: "Erro interno do servidor" });
  }
});

const PORT = Number(process.env.PORT || 5050);

const start = async () => {
  try {
    await pool.query("SELECT 1");
    server.listen(PORT, () => {
      console.log(`ERP Abacaxita API rodando em http://localhost:${PORT}`);
      console.log(`Postgres conectado em ${DATABASE_URL}`);
    });
  } catch (error) {
    console.error("Falha ao conectar no Postgres:", error.message);
    process.exit(1);
  }
};

process.on("SIGINT", async () => {
  await pool.end();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await pool.end();
  process.exit(0);
});

start();
