import { useMemo } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ShoppingBag,
  TrendingUp,
  Users,
  DollarSign,
  ExternalLink,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useERP } from "@/contexts/ERPContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const getLastNDays = (n: number) => {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    days.push(date.toISOString().slice(0, 10));
  }
  return days;
};

const formatDay = (iso: string) => {
  const [, , day] = iso.split("-");
  return `${day}/${iso.slice(5, 7)}`;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function StatisticsPage() {
  const { orders, products } = useERP();

  // ── Pedidos por dia (últimos 14 dias)
  const last14 = useMemo(() => getLastNDays(14), []);

  const ordersByDay = useMemo(() => {
    const map: Record<string, { pedidos: number; receita: number }> = {};
    last14.forEach((day) => { map[day] = { pedidos: 0, receita: 0 }; });
    orders.forEach((order) => {
      const day = new Date(order.createdAt).toISOString().slice(0, 10);
      if (map[day]) {
        map[day].pedidos += 1;
        map[day].receita += Number(order.total || 0);
      }
    });
    return last14.map((day) => ({ dia: formatDay(day), ...map[day] }));
  }, [orders, last14]);

  // ── Produtos mais vendidos (top 5 por qty)
  const topProducts = useMemo(() => {
    const qtMap: Record<string, { name: string; qty: number; revenue: number }> = {};
    orders
      .filter((order) => order.status === "pago" || order.status === "enviado")
      .forEach((order) => {
        (order.items || []).forEach((item: any) => {
          const id = String(item.productId || item.id || "?");
          if (!qtMap[id]) qtMap[id] = { name: item.name || id, qty: 0, revenue: 0 };
          qtMap[id].qty += Number(item.quantity || 1);
          qtMap[id].revenue += Number(item.price || 0) * Number(item.quantity || 1);
        });
      });
    return Object.values(qtMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [orders]);

  // ── KPIs
  const paidOrders = orders.filter((o) => o.status === "pago" || o.status === "enviado");
  const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const avgTicket = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;
  const activeProducts = products.filter((p) => p.active && p.category !== "banners").length;

  const kpis = [
    {
      label: "Pedidos pagos",
      value: paidOrders.length,
      sub: `${orders.length} no total`,
      icon: ShoppingBag,
      color: "text-rasta-green",
    },
    {
      label: "Receita total",
      value: formatCurrency(totalRevenue),
      sub: "pedidos pagos e enviados",
      icon: DollarSign,
      color: "text-amber-500",
    },
    {
      label: "Ticket médio",
      value: formatCurrency(avgTicket),
      sub: "por pedido pago",
      icon: TrendingUp,
      color: "text-blue-500",
    },
    {
      label: "Produtos ativos",
      value: activeProducts,
      sub: "na loja",
      icon: Users,
      color: "text-purple-500",
    },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Estatísticas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Métricas internas baseadas nos pedidos do ERP.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="shadow-sm">
            <CardContent className="flex items-start gap-3 p-4">
              <div className={`mt-0.5 rounded-lg bg-muted p-2 ${kpi.color}`}>
                <kpi.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  {kpi.label}
                </p>
                <p className="mt-0.5 text-xl font-bold text-foreground md:text-2xl">{kpi.value}</p>
                <p className="text-[11px] text-muted-foreground">{kpi.sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Pedidos por dia */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Pedidos — últimos 14 dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={ordersByDay}>
                <defs>
                  <linearGradient id="gradPedidos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="dia" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={28} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  formatter={(value: number) => [value, "Pedidos"]}
                />
                <Area
                  type="monotone"
                  dataKey="pedidos"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fill="url(#gradPedidos)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Receita por dia */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Receita — últimos 14 dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={ordersByDay}>
                <defs>
                  <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="dia" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} width={52}
                  tickFormatter={(v) => `R$${v}`} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  formatter={(value: number) => [formatCurrency(value), "Receita"]}
                />
                <Area
                  type="monotone"
                  dataKey="receita"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fill="url(#gradReceita)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top produtos */}
      {topProducts.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Produtos mais vendidos (pedidos pagos)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  formatter={(value: number) => [value, "Unidades"]}
                />
                <Bar dataKey="qty" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Bloco Google Analytics */}
      <Card className="border-blue-500/30 bg-blue-500/5 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
            <Info className="h-4 w-4" />
            Acesso ao site — Google Analytics 4
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Para monitorar visitas, origem do tráfego, tempo na página e comportamento dos usuários
            no HeadShop, conecte o <strong className="text-foreground">Google Analytics 4</strong>.
          </p>
          <ol className="list-decimal pl-4 space-y-1.5 text-xs leading-5">
            <li>Acesse <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline hover:text-blue-600">analytics.google.com</a> e crie uma propriedade GA4 para <em>bacaxita.com.br</em>.</li>
            <li>Copie seu <strong className="text-foreground">Measurement ID</strong> (formato <code className="rounded bg-muted px-1">G-XXXXXXXXXX</code>).</li>
            <li>Adicione a variável <code className="rounded bg-muted px-1">VITE_GA_ID=G-XXXXXXXXXX</code> no arquivo <code className="rounded bg-muted px-1">.env</code> do HeadShop.</li>
            <li>Faça o deploy — o tracking começa automaticamente em todas as páginas.</li>
          </ol>
          <div className="flex gap-2 pt-1 flex-wrap">
            <a
              href="https://analytics.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-600 transition hover:bg-blue-500/20 dark:text-blue-400"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Abrir Google Analytics
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
