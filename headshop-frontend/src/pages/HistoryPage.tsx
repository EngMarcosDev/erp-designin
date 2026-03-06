import { Link, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE, joinUrl } from "@/api/client";

type Order = {
  id: string | number;
  total: number;
  createdAt: string;
  status?: string;
};

const HistoryPage = () => {
  const { user } = useAuth();
  const ordersQuery = useQuery<Order[]>({
    queryKey: ["orders", user?.email],
    queryFn: async () => {
      const response = await fetch(
        joinUrl(API_BASE, `/users/${encodeURIComponent(user?.email ?? "")}/orders`)
      );
      if (!response.ok) {
        throw new Error("Erro ao carregar historico");
      }
      return response.json() as Promise<Order[]>;
    },
    enabled: Boolean(user?.email),
  });

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col paper-bg">
      <Header />

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl md:text-3xl font-display font-bold text-accent uppercase tracking-widest">
              Histórico de Compras
            </h1>
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
              Voltar
            </Link>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 text-sm text-muted-foreground space-y-2">
            {ordersQuery.isLoading && <p>Carregando historico...</p>}
            {ordersQuery.isError && <p>Não foi possível carregar o histórico.</p>}
            {!ordersQuery.isLoading && !ordersQuery.isError && ordersQuery.data?.length === 0 && (
              <p>Nenhum pedido encontrado.</p>
            )}
            {(ordersQuery.data ?? [])
              .filter((order) => (order.status || "").toLowerCase() !== "cancelado")
              .map((order) => (
              <div key={order.id} className="border border-border rounded-md p-3">
                <p>Pedido #{order.id}</p>
                <p className="text-xs">Total: R$ {Number(order.total).toFixed(2).replace(".", ",")}</p>
                <p className="text-xs">Data: {new Date(order.createdAt).toLocaleString("pt-BR")}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HistoryPage;
