import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ErpLayout from "@/components/erp/ErpLayout";
import { useAuth } from "@/contexts/AuthContext";
import { formatPrice, sanitizePrice } from "@/lib/priceFormatter";
import {
  createProduct,
  fetchOrders,
  fetchProducts,
  fetchStockReport,
  fetchStockComparison,
  syncStockPull,
  syncStockPush,
  updateProduct,
} from "@/api/erp";

const ErpDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: "", price: "", category: "", stock: "", image: "" });
  const [formError, setFormError] = useState("");
  const [showCompare, setShowCompare] = useState(false);

  const productsQuery = useQuery({ queryKey: ["erp", "products"], queryFn: fetchProducts });
  const ordersQuery = useQuery({ queryKey: ["erp", "orders"], queryFn: fetchOrders });
  const stockQuery = useQuery({ queryKey: ["erp", "stock"], queryFn: fetchStockReport });
  const compareQuery = useQuery({
    queryKey: ["erp", "stock-compare"],
    queryFn: fetchStockComparison,
    enabled: showCompare,
  });

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["erp", "products"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: any }) => updateProduct(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["erp", "products"] }),
  });

  const pullMutation = useMutation({
    mutationFn: syncStockPull,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["erp", "products"] });
      queryClient.invalidateQueries({ queryKey: ["erp", "stock"] });
      queryClient.invalidateQueries({ queryKey: ["erp", "stock-compare"] });
    },
  });

  const pushMutation = useMutation({
    mutationFn: syncStockPush,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["erp", "stock-compare"] });
    },
  });

  const isAdmin = user?.isAdmin;
  const products = useMemo(() => productsQuery.data ?? [], [productsQuery.data]);
  const orders = useMemo(() => ordersQuery.data ?? [], [ordersQuery.data]);
  const stock = useMemo(() => stockQuery.data ?? [], [stockQuery.data]);

  const totalStock = useMemo(() => stock.reduce((sum, item) => sum + item.stock, 0), [stock]);

  const validateForm = () => {
    if (!form.name.trim()) return "Informe o nome do produto.";
    if (!form.category.trim()) return "Informe a categoria.";
    const price = Number(form.price);
    if (Number.isNaN(price) || price <= 0) return "Preço inválido.";
    const stockValue = Number(form.stock || 0);
    if (Number.isNaN(stockValue) || stockValue < 0) return "Estoque inválido.";
    return "";
  };

  const canSubmit = isAdmin && !validateForm();

  return (
    <ErpLayout>
      <section className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-[#e2d6c0] rounded-xl p-4">
            <p className="text-xs uppercase text-muted-foreground">Produtos ativos</p>
            <p className="text-2xl font-bold">{products.filter((item) => item.active).length}</p>
          </div>
          <div className="bg-white border border-[#e2d6c0] rounded-xl p-4">
            <p className="text-xs uppercase text-muted-foreground">Pedidos</p>
            <p className="text-2xl font-bold">{orders.length}</p>
          </div>
          <div className="bg-white border border-[#e2d6c0] rounded-xl p-4">
            <p className="text-xs uppercase text-muted-foreground">Estoque total</p>
            <p className="text-2xl font-bold">{totalStock}</p>
          </div>
        </div>

        <div id="produtos" className="bg-white border border-[#e2d6c0] rounded-xl p-4">
          <h2 className="text-lg font-bold mb-3">Produtos (CRUD)</h2>
          {!isAdmin && (
            <p className="text-xs text-muted-foreground">Somente admin pode editar.</p>
          )}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!isAdmin) return;
              const error = validateForm();
              if (error) {
                setFormError(error);
                return;
              }
              setFormError("");
              createMutation.mutate({
                name: form.name.trim(),
                price: Number(form.price || 0),
                category: form.category.trim(),
                stock: Number(form.stock || 0),
                image: form.image.trim(),
                active: true,
              });
              setForm({ name: "", price: "", category: "", stock: "", image: "" });
            }}
            className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-2"
          >
            <input
              placeholder="Nome"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              className="border border-border rounded-md px-2 py-1"
            />
            <input
              placeholder="Preco"
              value={form.price}
              onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
              className="border border-border rounded-md px-2 py-1"
            />
            <input
              placeholder="Categoria"
              value={form.category}
              onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
              className="border border-border rounded-md px-2 py-1"
            />
            <input
              placeholder="Estoque"
              value={form.stock}
              onChange={(event) => setForm((prev) => ({ ...prev, stock: event.target.value }))}
              className="border border-border rounded-md px-2 py-1"
            />
            <input
              placeholder="Imagem (URL)"
              value={form.image}
              onChange={(event) => setForm((prev) => ({ ...prev, image: event.target.value }))}
              className="border border-border rounded-md px-2 py-1"
            />
            <button
              type="submit"
              disabled={!canSubmit}
              className={`rounded-md px-3 py-1 ${canSubmit ? "bg-[#2c9b4f] text-white" : "bg-[#c7c1b2] text-white"}`}
            >
              Adicionar
            </button>
          </form>
          {formError && <p className="text-xs text-red-600 mb-3">{formError}</p>}

          <div className="space-y-2">
            {productsQuery.isLoading && <p className="text-sm">Carregando...</p>}
            {products.map((product) => (
              <div key={product.id} className="border border-border rounded-lg p-3 flex flex-wrap gap-3 items-center">
                <div className="flex-1 min-w-[180px]">
                  <p className="font-semibold">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product.category} • {formatPrice(product.price, { decimals: 2 })}</p>
                </div>
                <div className="text-xs">Estoque: {product.stock}</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateMutation.mutate({ id: product.id, payload: { active: !product.active } })}
                    className="px-2 py-1 rounded-md bg-[#a07b3b] text-white text-xs"
                  >
                    {product.active ? "Desativar" : "Ativar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div id="estoque" className="bg-white border border-[#e2d6c0] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">Estoque</h2>
            <button
              onClick={() => setShowCompare(true)}
              className="px-3 py-1 rounded-md bg-[#2c9b4f] text-white text-xs"
            >
              Checar estoque do sistema
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
            {stock.map((item) => (
              <div key={item.id} className="border border-border rounded-md p-2">
                <p className="font-semibold">{item.name}</p>
                <p className="text-xs">Qtd: {item.stock}</p>
                <p className="text-xs">{item.active ? "Ativo" : "Inativo"}</p>
              </div>
            ))}
          </div>
        </div>

        <div id="pedidos" className="bg-white border border-[#e2d6c0] rounded-xl p-4">
          <h2 className="text-lg font-bold mb-3">Pedidos</h2>
          <div className="space-y-2 text-sm">
            {orders.map((order) => (
              <div key={order.id} className="border border-border rounded-md p-2">
                <p>#{order.id} • {order.email}</p>
                <p className="text-xs">Total: {formatPrice(order.total, { decimals: 2 })}</p>
              </div>
            ))}
          </div>
        </div>

        <div id="relatorios" className="bg-white border border-[#e2d6c0] rounded-xl p-4">
          <h2 className="text-lg font-bold mb-3">Relatorios</h2>
          <p className="text-sm text-muted-foreground">
            Relatorio de estoque e pedidos pronto para evoluir.
          </p>
        </div>
      </section>

      {showCompare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl border border-[#e2d6c0] w-full max-w-3xl shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#e2d6c0]">
              <h3 className="font-bold bg-[#f3efe2] px-3 py-1 rounded">Comparar estoque ERP x HeadShop</h3>
              <button onClick={() => setShowCompare(false)} className="text-sm text-muted-foreground">
                Fechar
              </button>
            </div>

            <div className="px-4 py-3 border-b border-[#e2d6c0] flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => pullMutation.mutate()}
                  className="px-3 py-1 rounded-md bg-[#c9892b] text-white text-xs"
                  disabled={pullMutation.isPending}
                >
                  ⬇ Puxar HeadShop → ERP
                </button>
                <button
                  onClick={() => pushMutation.mutate()}
                  className="px-3 py-1 rounded-md bg-[#2c9b4f] text-white text-xs"
                  disabled={pushMutation.isPending}
                >
                  ⬆ Enviar ERP → Site
                </button>
              </div>
              {compareQuery.isLoading && <span className="text-xs">Carregando...</span>}
            </div>

            <div className="max-h-[60vh] overflow-auto">
              <table className="w-full text-xs">
                <thead className="bg-[#f7f1e8] sticky top-0">
                  <tr>
                    <th className="text-left p-2">Produto</th>
                    <th className="text-left p-2">Categoria</th>
                    <th className="text-left p-2"><span className="text-green-600 font-semibold">ERP</span> (Qtd/Preço/Status)</th>
                    <th className="text-left p-2"><span className="text-yellow-600 font-semibold">HeadShop</span> (Qtd/Preço/Status)</th>
                  </tr>
                </thead>
                <tbody>
                  {(compareQuery.data ?? []).map((item) => (
                    <tr key={item.key} className="border-b border-[#efe6d5]">
                      <td className="p-2">{item.name}</td>
                      <td className="p-2">{item.category}</td>
                      <td className="p-2">
                        {item.erp
                          ? `${item.erp.stock} / ${formatPrice(item.erp.price, { decimals: 2 })} / ${
                              item.erp.active ? "Ativo" : "Inativo"
                            }`
                          : "—"}
                      </td>
                      <td className="p-2">
                        {item.headshop
                          ? `${item.headshop.stock} / ${formatPrice(item.headshop.price, { decimals: 2 })} / ${
                              item.headshop.active ? "Ativo" : "Inativo"
                            }`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </ErpLayout>
  );
};

export default ErpDashboard;
