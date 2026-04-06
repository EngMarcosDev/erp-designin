import { useEffect, useMemo, useState } from "react";
import { ShoppingCart, DollarSign, Clock, TrendingUp, Eye } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useERP } from "@/contexts/ERPContext";
import { formatPrice } from "@/lib/priceFormatter";
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
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

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
  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) ?? null,
    [orders, selectedOrderId],
  );

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
                      <TableHead>Visualizar</TableHead>
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
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => setSelectedOrderId(order.id)}
                          >
                            <Eye className="h-4 w-4" />
                            Visualizar
                          </Button>
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

      <Dialog open={Boolean(selectedOrder)} onOpenChange={(open) => !open && setSelectedOrderId(null)}>
        <DialogContent className="max-h-[92vh] p-0 sm:max-w-2xl">
          <DialogHeader className="dialog-titlebar shrink-0 rounded-t-lg px-6 pb-4 pt-6">
            <DialogTitle>Pedido {selectedOrder ? `#${selectedOrder.id}` : ""}</DialogTitle>
          </DialogHeader>

          <DialogBody className="space-y-4 px-6 py-4">
            {selectedOrder ? (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border border-border bg-muted/25 p-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Cliente</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{selectedOrder.customerName}</p>
                  </div>

                  <div className="rounded-lg border border-border bg-muted/25 p-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Contato</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{selectedOrder.email || "-"}</p>
                  </div>

                  <div className="rounded-lg border border-border bg-muted/25 p-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Status</p>
                    <Badge className={cn("mt-2", getStatusColor(selectedOrder.status))}>
                      {STATUS_LABELS[selectedOrder.status]}
                    </Badge>
                  </div>

                  <div className="rounded-lg border border-border bg-muted/25 p-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Total</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {formatPrice(selectedOrder.total, { decimals: 2 })}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-background">
                  <div className="border-b border-border px-4 py-3">
                    <p className="text-sm font-semibold text-foreground">Itens do pedido</p>
                    <p className="text-xs text-muted-foreground">
                      Criado em {selectedOrder.createdAt.toLocaleDateString("pt-BR")}
                    </p>
                  </div>

                  <div className="space-y-3 px-4 py-4">
                    {selectedOrder.items.map((item, index) => (
                      <div
                        key={`${item.productId}-${index}`}
                        className="flex flex-col gap-2 rounded-lg border border-border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="text-sm font-semibold text-foreground">{item.productName}</p>
                          <p className="text-xs text-muted-foreground">Produto #{item.productId}</p>
                        </div>

                        <div className="grid grid-cols-3 gap-3 text-sm sm:min-w-[280px]">
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Qtd</p>
                            <p className="font-semibold text-foreground">{item.quantity}</p>
                          </div>
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Unitario</p>
                            <p className="font-semibold text-foreground">
                              {formatPrice(item.unitPrice, { decimals: 2 })}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Subtotal</p>
                            <p className="font-semibold text-foreground">
                              {formatPrice(item.unitPrice * item.quantity, { decimals: 2 })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </DialogBody>

          <DialogFooter className="shrink-0 gap-2 border-t border-border bg-background px-6 py-4 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setSelectedOrderId(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
