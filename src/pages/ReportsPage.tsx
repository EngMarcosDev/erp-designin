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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useERP } from '@/contexts/ERPContext';
import { formatPrice } from '@/lib/priceFormatter';
import { CATEGORY_LABELS, Category } from '@/types/erp';
import { toast } from 'sonner';

type ReportType = 'pedidos' | 'produtos' | 'estoque' | 'mais_vendidos';

const REPORT_LABELS: Record<ReportType, string> = {
  pedidos: 'Pedidos',
  produtos: 'Produtos',
  estoque: 'Estoque',
  mais_vendidos: 'Produtos Mais Vendidos',
};

export default function RelatoriosPage() {
  const { products, users, orders } = useERP();
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportType>('pedidos');
  const [productNumberFilter, setProductNumberFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [materialFilter, setMaterialFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const totalProducts = products.length;
  const activeProducts = products.filter((product) => product.active).length;
  const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
  const lowStockCount = products.filter((product) => product.stock < 10).length;
  const totalUsers = users.length;
  const activeUsers = users.filter((user) => user.active).length;
  const adminCount = users.filter((user) => user.role === 'ADMIN').length;
  const totalOrders = orders.length;
  const paidOrders = orders.filter((order) => order.status === 'pago' || order.status === 'enviado').length;
  const pendingOrders = orders.filter((order) => order.status === 'pendente').length;
  const totalRevenue = orders
    .filter((order) => order.status === 'pago' || order.status === 'enviado')
    .reduce((sum, order) => sum + order.total, 0);

  const productsByCategory = Object.keys(CATEGORY_LABELS).map((categoryKey) => ({
    category: categoryKey as Category,
    label: CATEGORY_LABELS[categoryKey as Category],
    count: products.filter((product) => product.category === categoryKey).length,
    stock: products
      .filter((product) => product.category === categoryKey)
      .reduce((sum, product) => sum + product.stock, 0),
  }));

  const availableBrands = useMemo(
    () =>
      Array.from(
        new Set(products.map((product) => String(product.brand || '').trim()).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [products]
  );

  const availableMaterials = useMemo(
    () =>
      Array.from(
        new Set(products.map((product) => String(product.material || '').trim()).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [products]
  );

  const reportCards = [
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
      title: 'Resumo de Usuarios',
      icon: Users,
      color: 'bg-accent/10 text-accent',
      stats: [
        { label: 'Total de Usuarios', value: totalUsers },
        { label: 'Usuarios Ativos', value: activeUsers },
        { label: 'Administradores', value: adminCount },
        { label: 'Usuarios Comuns', value: totalUsers - adminCount },
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

  const getDateRange = () => {
    const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const to = dateTo ? new Date(`${dateTo}T23:59:59`) : null;
    return { from, to };
  };

  const getFilteredData = (): Array<Record<string, string | number>> => {
    const { from, to } = getDateRange();
    const productNumberTerm = productNumberFilter.trim().toLowerCase();

    switch (selectedReport) {
      case 'pedidos': {
        let filteredOrders = [...orders];
        if (from) filteredOrders = filteredOrders.filter((order) => order.createdAt >= from);
        if (to) filteredOrders = filteredOrders.filter((order) => order.createdAt <= to);
        if (productNumberTerm) {
          filteredOrders = filteredOrders.filter((order) =>
            order.items.some((item) => String(item.productId).toLowerCase().includes(productNumberTerm))
          );
        }

        return filteredOrders.map((order) => ({
          ID: `#${order.id}`,
          Cliente: order.customerName,
          Produtos: order.items.map((item) => `#${item.productId} ${item.productName}`).join(' | '),
          Itens: order.items.length,
          Total: `R$ ${order.total.toFixed(2)}`,
          Status: order.status.charAt(0).toUpperCase() + order.status.slice(1),
          Data: order.createdAt.toLocaleDateString('pt-BR'),
        }));
      }

      case 'produtos': {
        let filteredProducts = [...products];
        if (categoryFilter !== 'all') filteredProducts = filteredProducts.filter((product) => product.category === categoryFilter);
        if (brandFilter !== 'all') filteredProducts = filteredProducts.filter((product) => (product.brand || '').trim() === brandFilter);
        if (materialFilter !== 'all') filteredProducts = filteredProducts.filter((product) => (product.material || '').trim() === materialFilter);
        if (productNumberTerm) filteredProducts = filteredProducts.filter((product) => String(product.id).toLowerCase().includes(productNumberTerm));

        return filteredProducts
          .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
          .map((product) => ({
            Numero: `#${product.id}`,
            Nome: product.name,
            Categoria: CATEGORY_LABELS[product.category],
            Marca: product.brand || '-',
            Material: product.material || '-',
            'Preco (R$)': formatPrice(product.price, { includeCurrency: false, decimals: 2 }),
            Estoque: product.stock,
            Status: product.active ? 'Ativo' : 'Inativo',
          }));
      }

      case 'estoque': {
        let filteredProducts = [...products];
        if (categoryFilter !== 'all') filteredProducts = filteredProducts.filter((product) => product.category === categoryFilter);
        if (brandFilter !== 'all') filteredProducts = filteredProducts.filter((product) => (product.brand || '').trim() === brandFilter);
        if (materialFilter !== 'all') filteredProducts = filteredProducts.filter((product) => (product.material || '').trim() === materialFilter);
        if (productNumberTerm) filteredProducts = filteredProducts.filter((product) => String(product.id).toLowerCase().includes(productNumberTerm));

        return filteredProducts
          .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
          .map((product) => ({
            Numero: `#${product.id}`,
            Produto: product.name,
            Categoria: CATEGORY_LABELS[product.category],
            Marca: product.brand || '-',
            Material: product.material || '-',
            'Qtd em Estoque': product.stock,
            Status: product.stock < 10 ? 'Baixo' : 'OK',
            Ativo: product.active ? 'Sim' : 'Nao',
          }));
      }

      case 'mais_vendidos': {
        const salesMap = new Map<string, { id: string; name: string; qty: number; revenue: number }>();
        let filteredOrders = [...orders];
        if (from) filteredOrders = filteredOrders.filter((order) => order.createdAt >= from);
        if (to) filteredOrders = filteredOrders.filter((order) => order.createdAt <= to);

        filteredOrders.forEach((order) => {
          order.items.forEach((item) => {
            const existing = salesMap.get(item.productId);
            if (existing) {
              existing.qty += item.quantity;
              existing.revenue += item.quantity * item.unitPrice;
              return;
            }

            salesMap.set(item.productId, {
              id: item.productId,
              name: item.productName,
              qty: item.quantity,
              revenue: item.quantity * item.unitPrice,
            });
          });
        });

        return Array.from(salesMap.values())
          .filter((item) => !productNumberTerm || String(item.id).toLowerCase().includes(productNumberTerm))
          .sort((a, b) => b.qty - a.qty)
          .map((item, index) => ({
            '#': index + 1,
            Numero: `#${item.id}`,
            Produto: item.name,
            'Qtd Vendida': item.qty,
            'Receita (R$)': item.revenue.toFixed(2),
          }));
      }

      default:
        return [];
    }
  };

  const exportPDF = async () => {
    const data = getFilteredData();

    if (data.length === 0) {
      toast.error('Nenhum dado encontrado para exportar');
      return;
    }

    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]);
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Relatorio - ${REPORT_LABELS[selectedReport]}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 28);

    if (dateFrom || dateTo) {
      doc.text(`Periodo: ${dateFrom || '...'} a ${dateTo || '...'}`, 14, 34);
    }

    const headers = Object.keys(data[0]);
    const rows = data.map((row) => headers.map((header) => String(row[header] ?? '')));

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

  const exportExcel = async () => {
    const data = getFilteredData();

    if (data.length === 0) {
      toast.error('Nenhum dado encontrado para exportar');
      return;
    }

    const XLSX = await import('xlsx');
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, REPORT_LABELS[selectedReport]);
    XLSX.writeFile(workbook, `relatorio_${selectedReport}_${Date.now()}.xlsx`);
    toast.success('Excel gerado com sucesso!');
    setExportModalOpen(false);
  };

  const openExportModal = (type: ReportType) => {
    setSelectedReport(type);
    setProductNumberFilter('');
    setCategoryFilter('all');
    setBrandFilter('all');
    setMaterialFilter('all');

    if (type === 'pedidos' || type === 'mais_vendidos') {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const formatDate = (value: Date) => value.toISOString().slice(0, 10);
      setDateFrom(formatDate(firstDay));
      setDateTo(formatDate(now));
    } else {
      setDateFrom('');
      setDateTo('');
    }

    setExportModalOpen(true);
  };

  const showCategoryFilter = selectedReport === 'produtos' || selectedReport === 'estoque';
  const showDateFilter = selectedReport === 'pedidos' || selectedReport === 'mais_vendidos';
  const filteredDataCount = getFilteredData().length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Relatorios</h1>
        <p className="text-muted-foreground">Visao geral do sistema</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary p-3 text-primary-foreground">
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
              <div className="rounded-lg bg-accent p-3 text-accent-foreground">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Usuarios</p>
                <p className="text-3xl font-bold">{totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-status-success/5 to-status-success/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-status-success p-3 text-white">
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
              <div className="rounded-lg bg-status-pending p-3 text-white">
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Gerar Relatorios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Exporte relatorios em PDF ou Excel com filtros por numero do produto, categoria, marca, material e periodo.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                  className="report-hover-card flex h-auto flex-col items-center gap-2 py-4 hover:border-primary/30 hover:bg-primary/5"
                  onClick={() => openExportModal(type)}
                >
                  <Icon className="h-6 w-6 text-primary" />
                  <span className="report-glow-target text-sm font-medium text-foreground transition-colors">
                    {REPORT_LABELS[type]}
                  </span>
                  <span className="text-xs text-muted-foreground">PDF / Excel</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {reportCards.map((report) => (
          <Card key={report.title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className={`rounded-lg p-2 ${report.color}`}>
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
                    className="flex items-center justify-between border-b py-2 last:border-0"
                  >
                    <span className="text-sm text-muted-foreground">{stat.label}</span>
                    <span className={stat.warning ? 'font-semibold text-status-warning' : 'font-semibold'}>
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Produtos por Categoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {productsByCategory.map((category) => (
              <div
                key={category.category}
                className="rounded-lg bg-muted/50 p-4 text-center"
              >
                <p className="text-sm text-muted-foreground">{category.label}</p>
                <p className="text-2xl font-bold text-foreground">{category.count}</p>
                <p className="text-xs text-muted-foreground">{category.stock} unidades</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={exportModalOpen} onOpenChange={setExportModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="dialog-titlebar -mx-6 -mt-6 rounded-t-lg px-6 pb-4 pt-6">
            <DialogTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Exportar: {REPORT_LABELS[selectedReport]}
            </DialogTitle>
            <DialogDescription>
              Configure os filtros e escolha o formato de exportacao.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            <div className="space-y-2">
              <Label>Numero do produto</Label>
              <Input
                value={productNumberFilter}
                onChange={(event) => setProductNumberFilter(event.target.value)}
                placeholder="Ex: 102"
              />
            </div>

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
                      {(Object.keys(CATEGORY_LABELS) as Category[]).map((category) => (
                        <SelectItem key={category} value={category}>
                          {CATEGORY_LABELS[category]}
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
                  <Label>Data Inicio</Label>
                  <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Data Fim</Label>
                  <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
                </div>
              </div>
            )}

            <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
              {filteredDataCount} registro(s) encontrado(s) com os filtros atuais.
            </div>
          </DialogBody>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setExportModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="outline" className="gap-2" onClick={exportExcel}>
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </Button>
            <Button className="gap-2" onClick={exportPDF}>
              <FileText className="h-4 w-4" />
              PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
