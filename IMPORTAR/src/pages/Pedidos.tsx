import { ShoppingCart, DollarSign, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useERP } from '@/contexts/ERPContext';
import { STATUS_LABELS } from '@/types/erp';
import { cn } from '@/lib/utils';

export default function PedidosPage() {
  const { orders } = useERP();

  const totalOrders = orders.length;
  const paidOrders = orders.filter(o => o.status === 'pago' || o.status === 'enviado').length;
  const pendingOrders = orders.filter(o => o.status === 'pendente').length;
  const totalRevenue = orders
    .filter(o => o.status === 'pago' || o.status === 'enviado')
    .reduce((sum, o) => sum + o.total, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pago':
        return 'bg-status-success text-white';
      case 'pendente':
        return 'bg-status-pending text-white';
      case 'enviado':
        return 'bg-accent text-accent-foreground';
      case 'cancelado':
        return 'bg-status-error text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const stats = [
    {
      title: 'Total de Pedidos',
      value: totalOrders,
      icon: ShoppingCart,
      color: 'bg-primary/10 text-primary',
    },
    {
      title: 'Pedidos Pagos',
      value: paidOrders,
      icon: DollarSign,
      color: 'bg-status-success/10 text-status-success',
    },
    {
      title: 'Pendentes',
      value: pendingOrders,
      icon: Clock,
      color: 'bg-status-pending/10 text-status-pending',
    },
    {
      title: 'Receita Total',
      value: `R$ ${totalRevenue.toFixed(2)}`,
      icon: TrendingUp,
      color: 'bg-accent/10 text-accent',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Pedidos</h1>
        <p className="text-muted-foreground">Gerencie seus pedidos e acompanhe o status</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={cn('p-2 rounded-lg', stat.color)}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pedidos</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">
                Nenhum pedido encontrado
              </h3>
              <p className="text-sm text-muted-foreground/70">
                Os pedidos aparecerão aqui quando forem criados
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.id}</TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell>{order.items.length} item(s)</TableCell>
                    <TableCell>R$ {order.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.status)}>
                        {STATUS_LABELS[order.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {order.createdAt.toLocaleDateString('pt-BR')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
