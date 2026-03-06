const http = require("http");
const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "data.json");

const readData = () => JSON.parse(fs.readFileSync(dataPath, "utf-8"));
const writeData = (data) => fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

const sendJson = (res, status, payload) => {
  res.writeHead(status, { "Content-Type": "application/json" });
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

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const method = req.method || "GET";

  if (url.pathname === "/products" && method === "GET") {
    const data = readData();
    return sendJson(res, 200, data.products.filter((p) => p.active));
  }

  // Users endpoints
  if (url.pathname === "/users" && method === "GET") {
    const data = readData();
    return sendJson(res, 200, data.users || []);
  }

  if (url.pathname === "/users" && method === "POST") {
    const payload = await parseBody(req);
    const data = readData();
    const nextId = (data.users?.at(-1)?.id || 0) + 1;
    const user = {
      id: nextId,
      name: payload.name || payload.email || "Sem nome",
      email: payload.email || "",
      role: payload.role || "USUARIO",
      active: payload.active !== false,
      permissions: payload.permissions || [],
      avatar: payload.image || payload.avatar || "",
      createdAt: new Date().toISOString(),
    };
    data.users = data.users || [];
    data.users.push(user);
    writeData(data);
    return sendJson(res, 201, user);
  }

  if (url.pathname.startsWith("/users/") && method === "PUT") {
    const id = Number(url.pathname.split("/")[2]);
    const payload = await parseBody(req);
    const data = readData();
    const index = (data.users || []).findIndex((u) => u.id === id);
    if (index < 0) return sendJson(res, 404, { message: "Usuario nao encontrado" });
    data.users[index] = { ...data.users[index], ...payload };
    writeData(data);
    return sendJson(res, 200, data.users[index]);
  }

  if (url.pathname.startsWith("/users/") && method === "DELETE") {
    const id = Number(url.pathname.split("/")[2]);
    const data = readData();
    data.users = (data.users || []).filter((u) => u.id !== id);
    writeData(data);
    return sendJson(res, 204, { ok: true });
  }

  if (url.pathname === "/products" && method === "POST") {
    const payload = await parseBody(req);
    const data = readData();
    const nextId = (data.products.at(-1)?.id || 0) + 1;
    const product = {
      id: nextId,
      name: payload.name || "Sem nome",
      price: Number(payload.price || 0),
      category: payload.category || "geral",
      active: payload.active !== false,
      stock: Number(payload.stock || 0),
      image: payload.image || "",
    };
    data.products.push(product);
    writeData(data);
    return sendJson(res, 201, product);
  }

  if (url.pathname.startsWith("/products/") && method === "PUT") {
    const id = Number(url.pathname.split("/")[2]);
    const payload = await parseBody(req);
    const data = readData();
    const index = data.products.findIndex((p) => p.id === id);
    if (index < 0) return sendJson(res, 404, { message: "Produto nao encontrado" });
    data.products[index] = { ...data.products[index], ...payload };
    writeData(data);
    return sendJson(res, 200, data.products[index]);
  }

  if (url.pathname.startsWith("/products/") && method === "DELETE") {
    const id = Number(url.pathname.split("/")[2]);
    const data = readData();
    data.products = data.products.filter((p) => p.id !== id);
    writeData(data);
    return sendJson(res, 204, { ok: true });
  }

  if (url.pathname === "/orders" && method === "GET") {
    const data = readData();
    return sendJson(res, 200, data.orders);
  }

  if (url.pathname === "/orders" && method === "POST") {
    const payload = await parseBody(req);
    const data = readData();
    const nextId = (data.orders.at(-1)?.id || 0) + 1;
    const order = {
      id: nextId,
      email: payload.email || "",
      items: payload.items || [],
      total: Number(payload.total || 0),
      createdAt: new Date().toISOString(),
    };
    data.orders.push(order);
    writeData(data);
    return sendJson(res, 201, order);
  }

  // Auth endpoints (simple mock)
  if (url.pathname === "/auth/login" && method === "POST") {
    const payload = await parseBody(req);
    const data = readData();
    const email = String((payload.email || "")).trim().toLowerCase();
    const password = String(payload.password || "");
    const user = (data.users || []).find((u) => String(u.email || "").toLowerCase() === email);
    if (!user) return sendJson(res, 401, { error: "Invalid credentials" });

    // Simple password check (dev only): stored as plain text in data.json
    if (!user.password || user.password !== password) {
      return sendJson(res, 401, { error: "Invalid credentials" });
    }

    const token = `mock-token-${user.id}`;
    return sendJson(res, 200, { user, token });
  }

  if (url.pathname === "/auth/register" && method === "POST") {
    const payload = await parseBody(req);
    const data = readData();
    const nextId = (data.users?.at(-1)?.id || 0) + 1;
    const user = {
      id: nextId,
      name: payload.name || payload.email || "Sem nome",
      email: payload.email || "",
      password: String(payload.password || ""),
      role: payload.role || "USUARIO",
      active: payload.active !== false,
      permissions: payload.permissions || [],
      avatar: payload.image || payload.avatar || "",
      createdAt: new Date().toISOString(),
    };
    data.users = data.users || [];
    data.users.push(user);
    writeData(data);
    const token = `mock-token-${user.id}`;
    return sendJson(res, 201, { user, token });
  }

  // Payments (mock Mercado Pago) - creates a checkout url for the order
  if (url.pathname === "/payments/create" && method === "POST") {
    const payload = await parseBody(req);
    // payload should contain items and total
    const prefId = `pref_${Math.random().toString(36).slice(2, 10)}`;
    const checkoutUrl = `https://www.mercadopago.com/checkout/v1/redirect?pref_id=${prefId}`;
    return sendJson(res, 200, { checkout_url: checkoutUrl });
  }

  if (url.pathname === "/reports/stock" && method === "GET") {
    const data = readData();
    const report = data.products.map((product) => ({
      id: product.id,
      name: product.name,
      stock: product.stock,
      active: product.active,
    }));
    return sendJson(res, 200, report);
  }

  // Simple stock sync simulation endpoints
  if (url.pathname === "/sync/stock/compare" && method === "GET") {
    const data = readData();
    const products = data.products || [];
    const result = products.map((p) => {
      // simulate headshop with small random offset if not present
      const headStock = (p.stock || 0) + (Math.floor(Math.random() * 5) - 2);
      return {
        key: String(p.id),
        name: p.name,
        category: p.category || 'geral',
        erp: { stock: p.stock, price: p.price, active: p.active },
        headshop: { stock: headStock, price: p.price, active: p.active },
      };
    });
    return sendJson(res, 200, result);
  }

  if (url.pathname === "/sync/stock/pull" && method === "POST") {
    // Pull: replace ERP stock with simulated headshop stock
    const data = readData();
    data.products = (data.products || []).map((p) => {
      const headStock = (p.stock || 0) + (Math.floor(Math.random() * 5) - 2);
      return { ...p, stock: headStock };
    });
    writeData(data);
    return sendJson(res, 200, { ok: true });
  }

  if (url.pathname === "/sync/stock/push" && method === "POST") {
    // Push: pretend to send ERP stock to HeadShop
    return sendJson(res, 200, { ok: true });
  }

  return sendJson(res, 404, { message: "Rota nao encontrada" });
});

server.listen(5050, () => {
  console.log("ERP Abacaxita API rodando em http://localhost:5050");
});
