import { useEffect, useMemo, useState } from "react";
import { ShoppingCart, DollarSign, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useERP } from "@/contexts/ERPContext";
import { formatPrice, calculateTotal } from "@/lib/priceFormatter";
import { STATUS_LABELS } from "@/types/erp";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

export default function PedidosPage() {
  const { orders, updateOrderStatus } = useERP();
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(1);
  const [statusFilter, setStatusFilter] = useState<"all" | "pendente" | "pago" | "cancelado">("all");
  const [customerFilter, setCustomerFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const totalOrders = orders.length;
  const paidOrders = orders.filter((o) => o.status === "pago" || o.status === "enviado").length;
  const pendingOrders = orders.filter((o) => o.status === "pendente").length;
  const totalRevenue = orders
    .filter((o) => o.status === "pago" || o.status === "enviado")
    .reduce((sum, o) => sum + o.total, 0);

  const filteredOrders = useMemo(() => {
    const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const to = dateTo ? new Date(`${dateTo}T23:59:59`) : null;
    const customerTerm = customerFilter.trim().toLowerCase();

    return [...orders]
      .filter((order) => {
        if (statusFilter !== "all" && order.status !== statusFilter) {
          return false;
        }

        if (customerTerm) {
          const customer = `${order.customerName} ${order.email || ""}`.toLowerCase();
          if (!customer.includes(customerTerm)) {
            return false;
          }
        }

        if (from && order.createdAt < from) {
          return false;
        }

        if (to && order.createdAt > to) {
          return false;
        }

        return true;
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [orders, statusFilter, customerFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [pageSize, statusFilter, customerFilter, dateFrom, dateTo]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pagedOrders = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, page, pageSize]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pago":
        return "bg-status-success text-white";
      case "pendente":
        return "bg-status-pending text-white";
      case "enviado":
        return "bg-accent text-accent-foreground";
      case "cancelado":
        return "bg-status-error text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const stats = [
    {
      title: "Total de pedidos",
      value: totalOrders,
      icon: ShoppingCart,
      color: "bg-primary/10 text-primary",
    },
    {
      title: "Pedidos pagos",
      value: paidOrders,
      icon: DollarSign,
      color: "bg-status-success/10 text-status-success",
    },
    {
      title: "Pendentes",
      value: pendingOrders,
      icon: Clock,
      color: "bg-status-pending/10 text-status-pending",
    },
    {
      title: "Receita total",
      value: `R$ ${totalRevenue.toFixed(2)}`,
      icon: TrendingUp,
      color: "bg-accent/10 text-accent",
    },
  ];

  const handleStatusChange = async (orderId: string, nextStatus: "pendente" | "pago" | "cancelado") => {
    try {
      await updateOrderStatus(orderId, nextStatus);
      toast.success(`Status do pedido #${orderId} atualizado para ${STATUS_LABELS[nextStatus]}.`);
    } catch (error: any) {
      toast.error(error?.message || "Erro ao atualizar status do pedido.");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Pedidos</h1>
        <p className="text-muted-foreground">Gerencie pedidos com filtros e navegacao</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <div className={cn("p-2 rounded-lg", stat.color)}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <CardTitle>Historico de pedidos</CardTitle>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Registros por pagina</span>
              <Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Status</span>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Cliente</span>
              <Input
                placeholder="Nome ou email"
                value={customerFilter}
                onChange={(event) => setCustomerFilter(event.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">De</span>
                <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Ate</span>
                <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="text-xs text-muted-foreground">
            {filteredOrders.length} registro(s) encontrado(s) · pagina {page} de {totalPages}
          </div>

          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">Nenhum pedido encontrado</h3>
              <p className="text-sm text-muted-foreground/70">Ajuste os filtros para buscar pedidos.</p>
            </div>
          ) : (
            <>
              <div className="overflow-auto max-h-[560px] rounded-md border border-border">
                <Table>
                  <TableHeader className="sticky top-0 bg-card z-10">
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Itens</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Atualizar</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">#{order.id}</TableCell>
                        <TableCell>
                          <div className="leading-tight">
                            <p>{order.customerName}</p>
                            <p className="text-xs text-muted-foreground">{order.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{order.items.length} item(s)</TableCell>
                        <TableCell>{formatPrice(order.total, { decimals: 2 })}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(order.status)}>{STATUS_LABELS[order.status]}</Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={(order.status === "enviado" ? "pago" : order.status) as "pendente" | "pago" | "cancelado"}
                            onValueChange={(value) =>
                              handleStatusChange(order.id, value as "pendente" | "pago" | "cancelado")
                            }
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pendente">{STATUS_LABELS.pendente}</SelectItem>
                              <SelectItem value="pago">{STATUS_LABELS.pago}</SelectItem>
                              <SelectItem value="cancelado">{STATUS_LABELS.cancelado}</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>{order.createdAt.toLocaleDateString("pt-BR")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  className="text-sm px-3 py-1.5 rounded-md border border-border disabled:opacity-50"
                  disabled={page <= 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                >
                  Anterior
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages })
                    .slice(0, 7)
                    .map((_, idx) => {
                      const pageNumber = idx + 1;
                      const isCurrent = pageNumber === page;
                      return (
                        <button
                          key={pageNumber}
                          type="button"
                          onClick={() => setPage(pageNumber)}
                          className={cn(
                            "h-8 min-w-8 px-2 rounded-md text-sm border",
                            isCurrent
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-border hover:bg-muted"
                          )}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                </div>

                <button
                  type="button"
                  className="text-sm px-3 py-1.5 rounded-md border border-border disabled:opacity-50"
                  disabled={page >= totalPages}
                  onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                >
                  Proxima
                </button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
