import { useMemo, useState } from 'react';
import { Plus, Search, Package, Edit, Power, Eye, Trash2, ImageOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useERP } from '@/contexts/ERPContext';import { formatPrice, sanitizePrice } from "@/lib/priceFormatter";import { Category, CATEGORY_LABELS, CATEGORY_COLORS, LocalSpot } from '@/types/erp';
import { ProductModal } from '@/components/modals/ProductModal';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function ProdutosPage() {
  const { products, toggleProductStatus, deleteProduct } = useERP();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);
  const [deleteState, setDeleteState] = useState<{
    open: boolean;
    productId: string | null;
    productName: string;
    step: 1 | 2;
  }>({ open: false, productId: null, productName: '', step: 1 });

  const filteredProducts = products
    .filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  const handleEdit = (id: string) => {
    setEditingProductId(id);
    setIsModalOpen(true);
  };

  const handleToggleStatus = (id: string, name: string, currentStatus: boolean) => {
    void (async () => {
      try {
        await toggleProductStatus(id);
        toast.success(currentStatus ? `${name} foi desativado` : `${name} foi ativado`);
      } catch (err: any) {
        toast.error(err?.message || 'Erro ao atualizar status');
      }
    })();
  };

  const handleRequestDelete = (id: string, name: string) => {
    setDeleteState({ open: true, productId: id, productName: name, step: 1 });
  };

  const closeDeleteDialog = () => {
    setDeleteState({ open: false, productId: null, productName: '', step: 1 });
  };

  const handleDelete = async () => {
    if (!deleteState.productId) return;

    try {
      await deleteProduct(deleteState.productId);
      toast.success(`Produto \"${deleteState.productName}\" excluido com sucesso.`);
      closeDeleteDialog();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao excluir produto');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProductId(null);
  };

  const categories = Object.keys(CATEGORY_LABELS) as Category[];
  const categoryOptions = useMemo(
    () => categories.map((cat) => ({ cat, count: products.filter((p) => p.category === cat).length })),
    [products, categories]
  );

  const localLabels: Record<LocalSpot, string> = {
    novidades: 'Novidades',
    mais_vendidos: 'Mais vendidos',
    categoria: 'Categoria',
  };

  const useListMode = filteredProducts.length > 8;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Produtos</h1>
          <p className="text-muted-foreground">Gerencie seu catalogo de produtos</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Produto
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {categoryOptions.map(({ cat, count }) => (
          <div
            key={cat}
            className={cn('category-banner cursor-pointer hover:opacity-90 transition-opacity', CATEGORY_COLORS[cat])}
            onClick={() => setCategoryFilter(cat)}
          >
            <p className="text-sm opacity-80">{count} produtos</p>
            <p className="font-bold">{CATEGORY_LABELS[cat]}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">Nenhum produto encontrado</h3>
              <p className="text-sm text-muted-foreground/70 mb-4">
                {searchTerm || categoryFilter !== 'all'
                  ? 'Tente ajustar os filtros'
                  : 'Comece adicionando seu primeiro produto'}
              </p>
              {!searchTerm && categoryFilter === 'all' && (
                <Button onClick={() => setIsModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Produto
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : useListMode ? (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredProducts.map((product) => (
                <div key={product.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50">
                  <div className={cn('w-2 h-10 rounded-full', CATEGORY_COLORS[product.category] ?? 'bg-muted')} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground truncate">{product.name}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {CATEGORY_LABELS[product.category]}
                      </Badge>
                      {product.localSpot && (
                        <Badge variant="outline" className="text-[11px]">
                          {localLabels[product.localSpot]}
                          {product.localSpot === 'categoria' && product.localCategory
                            ? ` · ${CATEGORY_LABELS[product.localCategory]}`
                            : ''}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground flex gap-4 mt-1">
                      <span>
                        Preco: <strong className="text-foreground">{formatPrice(product.price, { decimals: 2 })}</strong>
                      </span>
                      <span>
                        Estoque:{' '}
                        <strong className={cn(product.stock < 10 && 'text-status-error')}>
                          {product.stock} un.
                        </strong>
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant={product.active ? 'default' : 'secondary'}
                    className={cn(product.active ? 'bg-status-success' : 'bg-muted')}
                  >
                    {product.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => handleEdit(product.id)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={product.active ? 'destructive' : 'default'}
                      size="icon"
                      onClick={() => handleToggleStatus(product.id, product.name, product.active)}
                    >
                      <Power className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleRequestDelete(product.id, product.name)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              className={cn('overflow-hidden hover:shadow-lg transition-all', !product.active && 'opacity-60')}
            >
              <div className={cn('h-2', CATEGORY_COLORS[product.category] ?? 'bg-muted')} />
              <div
                className="h-32 bg-muted/30 flex items-center justify-center relative group"
                onClick={() => {
                  if (product.image) {
                    setPreviewImage({ url: product.image, name: product.name });
                  }
                }}
              >
                {product.image ? (
                  <>
                    <img
                      src={product.image}
                      alt={product.name}
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors flex items-center justify-center">
                      <Eye className="h-5 w-5 text-foreground opacity-0 group-hover:opacity-70 transition-opacity" />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground/70">
                    <ImageOff className="h-5 w-5" />
                    <span className="text-[11px] uppercase tracking-wide">Sem imagem</span>
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{product.name}</h3>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {CATEGORY_LABELS[product.category] ?? product.category}
                    </Badge>
                    {product.localSpot && (
                      <div className="mt-1">
                        <Badge variant="outline" className="text-[11px]">
                          {localLabels[product.localSpot]}
                          {product.localSpot === 'categoria' && product.localCategory
                            ? ` · ${CATEGORY_LABELS[product.localCategory]}`
                            : ''}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <Badge
                    variant={product.active ? 'default' : 'secondary'}
                    className={cn('ml-2 shrink-0', product.active ? 'bg-status-success' : 'bg-muted')}
                  >
                    {product.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Preco:</span>
                    <span className="font-medium">{formatPrice(product.price, { decimals: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estoque:</span>
                    <span className={cn('font-medium', product.stock < 10 && 'text-status-error')}>
                      {product.stock} un.
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(product.id)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant={product.active ? 'destructive' : 'default'}
                    size="sm"
                    onClick={() => handleToggleStatus(product.id, product.name, product.active)}
                  >
                    <Power className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRequestDelete(product.id, product.name)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ProductModal open={isModalOpen} onClose={handleCloseModal} productId={editingProductId} />

      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="dialog-titlebar -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-lg">
            <DialogTitle>{previewImage?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-4 bg-muted/30 rounded-lg min-h-[300px]">
            {previewImage && (
              <img
                src={previewImage.url}
                alt={previewImage.name}
                className="max-w-full max-h-[400px] object-contain rounded"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteState.open}
        onOpenChange={(open) => {
          if (!open) closeDeleteDialog();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="dialog-titlebar -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-lg">
            <DialogTitle>{deleteState.step === 1 ? 'Excluir produto?' : 'Confirmacao final'}</DialogTitle>
            <DialogDescription className="sr-only">Confirmacao de exclusao de produto</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2 text-sm text-muted-foreground">
            {deleteState.step === 1 ? (
              <p>
                Voce tem certeza que deseja excluir{' '}
                <strong className="text-foreground">{deleteState.productName}</strong>?
              </p>
            ) : (
              <p>
                Esta acao e permanente e nao podera ser desfeita. Confirma a exclusao definitiva de{' '}
                <strong className="text-foreground">{deleteState.productName}</strong>?
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            {deleteState.step === 1 ? (
              <>
                <Button variant="outline" onClick={closeDeleteDialog}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={() => setDeleteState((prev) => ({ ...prev, step: 2 }))}>
                  Continuar
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setDeleteState((prev) => ({ ...prev, step: 1 }))}>
                  Voltar
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  Excluir definitivamente
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
