import { useMemo, useState } from 'react';
import {
  Package,
  Users,
  ShoppingCart,
  TrendingUp,
  BarChart3,
  DollarSign,
  FileText,
  FileSpreadsheet,
  Download,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { useERP } from '@/contexts/ERPContext';
import { formatPrice, sanitizePrice } from '@/lib/priceFormatter';
import { CATEGORY_LABELS, Category } from '@/types/erp';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

type ReportType = 'pedidos' | 'produtos' | 'estoque' | 'mais_vendidos';

const REPORT_LABELS: Record<ReportType, string> = {
  pedidos: 'Pedidos',
  produtos: 'Produtos',
  estoque: 'Estoque',
  mais_vendidos: 'Produtos Mais Vendidos',
};

export default function RelatoriosPage() {
  const { products, users, orders, auditLogs } = useERP();
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportType>('pedidos');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [materialFilter, setMaterialFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const getDateRange = () => {
    const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const to = dateTo ? new Date(`${dateTo}T23:59:59`) : null;
    return { from, to };
  };

  // Stats
  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.active).length;
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const lowStockCount = products.filter((p) => p.stock < 10).length;
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.active).length;
  const adminCount = users.filter((u) => u.role === 'ADMIN').length;
  const totalOrders = orders.length;
  const paidOrders = orders.filter((o) => o.status === 'pago' || o.status === 'enviado').length;
  const pendingOrders = orders.filter((o) => o.status === 'pendente').length;
  const totalRevenue = orders
    .filter((o) => o.status === 'pago' || o.status === 'enviado')
    .reduce((sum, o) => sum + o.total, 0);

  const productsByCategory = Object.keys(CATEGORY_LABELS).map((cat) => ({
    category: cat as Category,
    label: CATEGORY_LABELS[cat as Category],
    count: products.filter((p) => p.category === cat).length,
    stock: products.filter((p) => p.category === cat).reduce((sum, p) => sum + p.stock, 0),
  }));

  const availableBrands = useMemo(
    () =>
      Array.from(new Set(products.map((product) => String(product.brand || "").trim()).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, "pt-BR")
      ),
    [products]
  );

  const availableMaterials = useMemo(
    () =>
      Array.from(new Set(products.map((product) => String(product.material || "").trim()).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b, "pt-BR")
      ),
    [products]
  );

  const reports = [
    {
      title: 'Resumo de Produtos',
      icon: Package,
      color: 'bg-primary/10 text-primary',
      stats: [
        { label: 'Total de Produtos', value: totalProducts },
        { label: 'Produtos Ativos', value: activeProducts },
        { label: 'Unidades em Estoque', value: totalStock },
        { label: 'Estoque Baixo', value: lowStockCount, warning: lowStockCount > 0 },
      ],
    },
    {
      title: 'Resumo de Usuários',
      icon: Users,
      color: 'bg-accent/10 text-accent',
      stats: [
        { label: 'Total de Usuários', value: totalUsers },
        { label: 'Usuários Ativos', value: activeUsers },
        { label: 'Administradores', value: adminCount },
        { label: 'Usuários Comuns', value: totalUsers - adminCount },
      ],
    },
    {
      title: 'Resumo de Pedidos',
      icon: ShoppingCart,
      color: 'bg-status-success/10 text-status-success',
      stats: [
        { label: 'Total de Pedidos', value: totalOrders },
        { label: 'Pedidos Pagos', value: paidOrders },
        { label: 'Pedidos Pendentes', value: pendingOrders, warning: pendingOrders > 0 },
        { label: 'Receita Total', value: `R$ ${totalRevenue.toFixed(2)}` },
      ],
    },
  ];

  // Filter data based on selections
  const getFilteredData = () => {
    const { from, to } = getDateRange();

    switch (selectedReport) {
      case 'pedidos': {
        let filtered = [...orders];
        if (from) filtered = filtered.filter(o => o.createdAt >= from);
        if (to) filtered = filtered.filter(o => o.createdAt <= to);
        return filtered.map(o => ({
          ID: `#${o.id}`,
          Cliente: o.customerName,
          Itens: o.items.length,
          Total: `R$ ${o.total.toFixed(2)}`,
          Status: o.status.charAt(0).toUpperCase() + o.status.slice(1),
          Data: o.createdAt.toLocaleDateString('pt-BR'),
        }));
      }
      case 'produtos': {
        let filtered = [...products];
        if (categoryFilter !== 'all') filtered = filtered.filter(p => p.category === categoryFilter);
        if (brandFilter !== 'all') filtered = filtered.filter(p => (p.brand || '').trim() === brandFilter);
        if (materialFilter !== 'all') filtered = filtered.filter(p => (p.material || '').trim() === materialFilter);
        return filtered.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')).map(p => ({
          Nome: p.name,
          Categoria: CATEGORY_LABELS[p.category],
          Marca: p.brand || '-',
          Material: p.material || '-',
          'Preço (R$)': formatPrice(p.price, { includeCurrency: false, decimals: 2 }),
          Estoque: p.stock,
          Status: p.active ? 'Ativo' : 'Inativo',
        }));
      }
      case 'estoque': {
        let filtered = [...products];
        if (categoryFilter !== 'all') filtered = filtered.filter(p => p.category === categoryFilter);
        if (brandFilter !== 'all') filtered = filtered.filter(p => (p.brand || '').trim() === brandFilter);
        if (materialFilter !== 'all') filtered = filtered.filter(p => (p.material || '').trim() === materialFilter);
        return filtered.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')).map(p => ({
          Produto: p.name,
          Categoria: CATEGORY_LABELS[p.category],
          Marca: p.brand || '-',
          Material: p.material || '-',
          'Qtd em Estoque': p.stock,
          Status: p.stock < 10 ? '⚠ Baixo' : 'OK',
          Ativo: p.active ? 'Sim' : 'Não',
        }));
      }
      case 'mais_vendidos': {
        const salesMap = new Map<string, { name: string; qty: number; revenue: number }>();
        let filteredOrders = [...orders];
        if (from) filteredOrders = filteredOrders.filter(o => o.createdAt >= from);
        if (to) filteredOrders = filteredOrders.filter(o => o.createdAt <= to);

        filteredOrders.forEach(o => {
          o.items.forEach(item => {
            const existing = salesMap.get(item.productId);
            if (existing) {
              existing.qty += item.quantity;
              existing.revenue += item.quantity * item.unitPrice;
            } else {
              salesMap.set(item.productId, {
                name: item.productName,
                qty: item.quantity,
                revenue: item.quantity * item.unitPrice,
              });
            }
          });
        });

        return Array.from(salesMap.values())
          .sort((a, b) => b.qty - a.qty)
          .map((item, i) => ({
            '#': i + 1,
            Produto: item.name,
            'Qtd Vendida': item.qty,
            'Receita (R$)': item.revenue.toFixed(2),
          }));
      }
      default:
        return [];
    }
  };

  const exportPDF = () => {
    const data = getFilteredData();
    if (data.length === 0) {
      toast.error('Nenhum dado encontrado para exportar');
      return;
    }

    const doc = new jsPDF();
    const title = `Relatório - ${REPORT_LABELS[selectedReport]}`;
    doc.setFontSize(16);
    doc.text(title, 14, 20);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 28);

    if (dateFrom || dateTo) {
      const period = `Período: ${dateFrom || '...'} a ${dateTo || '...'}`;
      doc.text(period, 14, 34);
    }

    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(h => String((row as Record<string, unknown>)[h] ?? '')));

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: dateFrom || dateTo ? 40 : 34,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [139, 115, 85] },
    });

    doc.save(`relatorio_${selectedReport}_${Date.now()}.pdf`);
    toast.success('PDF gerado com sucesso!');
    setExportModalOpen(false);
  };

  const exportExcel = () => {
    const data = getFilteredData();
    if (data.length === 0) {
      toast.error('Nenhum dado encontrado para exportar');
      return;
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, REPORT_LABELS[selectedReport]);
    XLSX.writeFile(wb, `relatorio_${selectedReport}_${Date.now()}.xlsx`);
    toast.success('Excel gerado com sucesso!');
    setExportModalOpen(false);
  };

  const openExportModal = (type: ReportType) => {
    setSelectedReport(type);
    setCategoryFilter('all');
    setBrandFilter('all');
    setMaterialFilter('all');

    if (type === 'pedidos' || type === 'mais_vendidos') {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const format = (value: Date) => value.toISOString().slice(0, 10);
      setDateFrom(format(firstDay));
      setDateTo(format(now));
    } else {
      setDateFrom('');
      setDateTo('');
    }

    setExportModalOpen(true);
  };

  const showCategoryFilter = selectedReport === 'produtos' || selectedReport === 'estoque';
  const showDateFilter = selectedReport === 'pedidos' || selectedReport === 'mais_vendidos';

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
        <p className="text-muted-foreground">Visão geral do sistema</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary text-primary-foreground">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Produtos</p>
                <p className="text-3xl font-bold">{totalProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent/5 to-accent/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-accent text-accent-foreground">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Usuários</p>
                <p className="text-3xl font-bold">{totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-status-success/5 to-status-success/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-status-success text-white">
                <ShoppingCart className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pedidos</p>
                <p className="text-3xl font-bold">{totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-status-pending/5 to-status-pending/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-status-pending text-white">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Receita</p>
                <p className="text-2xl font-bold">R$ {totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Reports Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Gerar Relatórios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Exporte relatorios em PDF ou Excel com filtros por produto, categoria, marca, material e periodo.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {(Object.keys(REPORT_LABELS) as ReportType[]).map((type) => {
              const icons: Record<ReportType, typeof ShoppingCart> = {
                pedidos: ShoppingCart,
                produtos: Package,
                estoque: BarChart3,
                mais_vendidos: TrendingUp,
              };
              const Icon = icons[type];
              return (
                <Button
                  key={type}
                  variant="outline"
                  className="report-hover-card h-auto py-4 flex flex-col items-center gap-2 hover:bg-primary/5 hover:border-primary/30"
                  onClick={() => openExportModal(type)}
                >
                  <Icon className="h-6 w-6 text-primary" />
                  <span className="text-sm font-medium report-glow-target transition-colors text-foreground">{REPORT_LABELS[type]}</span>
                  <span className="text-xs text-muted-foreground">PDF / Excel</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <Card key={report.title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${report.color}`}>
                  <report.icon className="h-5 w-5" />
                </div>
                {report.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {report.stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <span className="text-sm text-muted-foreground">
                      {stat.label}
                    </span>
                    <span
                      className={`font-semibold ${
                        stat.warning ? 'text-status-warning' : ''
                      }`}
                    >
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Products by Category */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Produtos por Categoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {productsByCategory.map((cat) => (
              <div
                key={cat.category}
                className="p-4 rounded-lg bg-muted/50 text-center"
              >
                <p className="text-sm text-muted-foreground">{cat.label}</p>
                <p className="text-2xl font-bold text-foreground">{cat.count}</p>
                <p className="text-xs text-muted-foreground">
                  {cat.stock} unidades
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Auditoria */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-accent" />
            Auditoria do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b">
                  <th className="py-2 pr-4">Quando</th>
                  <th className="py-2 pr-4">Usuário</th>
                  <th className="py-2 pr-4">Ação</th>
                  <th className="py-2">Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.slice(0, 10).map((log) => (
                  <tr key={log.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-2 pr-4 font-medium">{log.user}</td>
                    <td className="py-2 pr-4">
                      <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-muted/70">
                        <span className="h-2 w-2 rounded-full bg-primary" />
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2 text-foreground">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Export Modal */}
      <Dialog open={exportModalOpen} onOpenChange={setExportModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="dialog-titlebar -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-lg">
            <DialogTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Exportar: {REPORT_LABELS[selectedReport]}
            </DialogTitle>
            <DialogDescription>
              Configure os filtros e escolha o formato de exportação.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            {showCategoryFilter && (
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {(Object.keys(CATEGORY_LABELS) as Category[]).map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {CATEGORY_LABELS[cat]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Marca</Label>
                  <Select value={brandFilter} onValueChange={setBrandFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as marcas</SelectItem>
                      {availableBrands.map((brand) => (
                        <SelectItem key={brand} value={brand}>
                          {brand}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Material</Label>
                  <Select value={materialFilter} onValueChange={setMaterialFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os materiais</SelectItem>
                      {availableMaterials.map((material) => (
                        <SelectItem key={material} value={material}>
                          {material}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {showDateFilter && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data Início</Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data Fim</Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              {getFilteredData().length} registro(s) encontrado(s) com os filtros atuais.
            </div>
          </DialogBody>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setExportModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={exportExcel}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </Button>
            <Button
              className="gap-2"
              onClick={exportPDF}
            >
              <FileText className="h-4 w-4" />
              PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


