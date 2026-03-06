import { useState } from 'react';
import { RefreshCw, ArrowLeftRight, Package, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { useERP } from '@/contexts/ERPContext';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '@/types/erp';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function EstoquePage() {
  const { products, stockComparison, refreshStockComparison, syncToHeadshop, syncFromHeadshop } = useERP();
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshComparison = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    refreshStockComparison();
    setIsRefreshing(false);
    toast.success('Comparação de estoque atualizada!');
  };

  const handleSyncToHeadshop = (productId: string, productName: string) => {
    syncToHeadshop(productId);
    toast.success(`Estoque de "${productName}" enviado para HeadShop`);
  };

  const handleSyncFromHeadshop = (productId: string, productName: string) => {
    syncFromHeadshop(productId);
    toast.success(`Estoque de "${productName}" atualizado do HeadShop`);
  };

  const activeProducts = products.filter((p) => p.active);
  const lowStockProducts = products.filter((p) => p.stock < 10);
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const itemsWithDifference = stockComparison.filter((sc) => sc.difference !== 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Estoque</h1>
          <p className="text-muted-foreground">Controle visual do estoque e sincronização</p>
        </div>
        <Button onClick={() => setIsComparisonOpen(true)} className="gap-2" variant="outline">
          <ArrowLeftRight className="h-4 w-4" />
          Checar estoque do sistema
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10"><Package className="h-6 w-6 text-primary" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Produtos Ativos</p>
                <p className="text-2xl font-bold">{activeProducts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-accent/10"><Package className="h-6 w-6 text-accent" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total em Estoque</p>
                <p className="text-2xl font-bold">{totalStock} un.</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-status-warning/10"><AlertTriangle className="h-6 w-6 text-status-warning" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Estoque Baixo</p>
                <p className="text-2xl font-bold">{lowStockProducts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-status-error/10"><ArrowLeftRight className="h-6 w-6 text-status-error" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Divergências</p>
                <p className="text-2xl font-bold">{itemsWithDifference.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...products].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')).map((product) => (
          <Card key={product.id} className={cn('overflow-hidden hover:shadow-lg transition-all', !product.active && 'opacity-60')}>
            <div className={cn('h-2', CATEGORY_COLORS[product.category])} />
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{product.name}</h3>
                  <Badge variant="secondary" className="mt-1 text-xs">{CATEGORY_LABELS[product.category]}</Badge>
                </div>
                <Badge variant={product.active ? 'default' : 'secondary'} className={cn('ml-2 shrink-0', product.active ? 'bg-status-success' : 'bg-muted')}>
                  {product.active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Quantidade:</span>
                  <span className={cn('text-2xl font-bold', product.stock < 10 && 'text-status-error', product.stock >= 10 && product.stock < 30 && 'text-status-warning', product.stock >= 30 && 'text-status-success')}>
                    {product.stock}
                  </span>
                </div>
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn('h-full transition-all', product.stock < 10 && 'bg-status-error', product.stock >= 10 && product.stock < 30 && 'bg-status-warning', product.stock >= 30 && 'bg-status-success')}
                    style={{ width: `${Math.min((product.stock / 100) * 100, 100)}%` }}
                  />
                </div>
                {product.stock < 10 && (
                  <p className="text-xs text-status-error mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Estoque baixo!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Comparison Modal */}
      <Dialog open={isComparisonOpen} onOpenChange={setIsComparisonOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader className="bg-accent/10 -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-lg">
            <DialogTitle className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5" />
              Comparação ERP x HeadShop
            </DialogTitle>
            <DialogDescription>Compare e sincronize o estoque entre os sistemas</DialogDescription>
          </DialogHeader>

          <div className="flex justify-end mb-4 pt-2">
            <Button variant="outline" size="sm" onClick={handleRefreshComparison} disabled={isRefreshing} className="gap-2">
              <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} /> Atualizar
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="text-center text-status-success font-bold">ERP</TableHead>
                <TableHead className="text-center text-status-warning font-bold">HeadShop</TableHead>
                <TableHead className="text-center">Diferença</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockComparison.map((item) => (
                <TableRow key={item.productId} className={cn(item.difference !== 0 && 'bg-status-warning/10')}>
                  <TableCell className="font-medium">{item.productName}</TableCell>
                  <TableCell className="text-center text-status-success font-semibold">{item.erpStock}</TableCell>
                  <TableCell className="text-center text-status-warning font-semibold">{item.headshopStock}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={item.difference === 0 ? 'secondary' : 'destructive'} className={cn(item.difference === 0 && 'bg-status-success text-white')}>
                      {item.difference > 0 ? `+${item.difference}` : item.difference}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {item.difference !== 0 && (
                      <div className="flex gap-1 justify-end">
                        <Button variant="outline" size="sm" onClick={() => handleSyncFromHeadshop(item.productId, item.productName)}>← Puxar</Button>
                        <Button variant="outline" size="sm" onClick={() => handleSyncToHeadshop(item.productId, item.productName)}>Enviar →</Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </div>
  );
}
