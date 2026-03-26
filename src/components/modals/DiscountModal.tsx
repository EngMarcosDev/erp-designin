import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useERP } from '@/contexts/ERPContext';
import { Category, CATEGORY_LABELS } from '@/types/erp';
import { toast } from 'sonner';

interface DiscountModalProps {
  open: boolean;
  onClose: () => void;
}

type ScopeMode = 'category' | 'product';
type DiscountMode = 'percent' | 'amount';

export function DiscountModal({ open, onClose }: DiscountModalProps) {
  const { products, updateProduct } = useERP();
  const [scopeMode, setScopeMode] = useState<ScopeMode>('category');
  const [discountMode, setDiscountMode] = useState<DiscountMode>('percent');
  const [selectedCategory, setSelectedCategory] = useState<Category | ''>('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [value, setValue] = useState('');
  const [label, setLabel] = useState('Oferta especial');
  const [isLoading, setIsLoading] = useState(false);

  const categories = Object.keys(CATEGORY_LABELS) as Category[];
  const productOptions = useMemo(
    () =>
      products
        .filter((product) => product.active)
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    [products]
  );

  const selectedProducts = useMemo(() => {
    if (scopeMode === 'category') {
      if (!selectedCategory) return [];
      return products.filter((product) => product.category === selectedCategory && product.active);
    }
    if (!selectedProductId) return [];
    return products.filter((product) => product.id === selectedProductId);
  }, [products, scopeMode, selectedCategory, selectedProductId]);

  const applyDiscount = async () => {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      toast.error('Informe um valor de desconto valido');
      return;
    }

    if (scopeMode === 'category' && !selectedCategory) {
      toast.error('Selecione uma categoria');
      return;
    }

    if (scopeMode === 'product' && !selectedProductId) {
      toast.error('Selecione um produto');
      return;
    }

    if (selectedProducts.length === 0) {
      toast.error('Nenhum produto disponivel para aplicar desconto');
      return;
    }

    setIsLoading(true);
    try {
      await Promise.all(
        selectedProducts.map(async (product) => {
          const basePrice =
            product.discountActive && product.originalPrice != null ? product.originalPrice : product.price;
          const discountAmount =
            discountMode === 'percent' ? (basePrice * numericValue) / 100 : numericValue;
          const nextPrice = Math.max(basePrice - discountAmount, 0);

          await updateProduct(product.id, {
            price: Number(nextPrice.toFixed(2)),
            originalPrice: Number(basePrice.toFixed(2)),
            discountAmount: Number(discountAmount.toFixed(2)),
            discountPercent:
              discountMode === 'percent'
                ? Number(numericValue.toFixed(2))
                : Number(((discountAmount / Math.max(basePrice, 0.01)) * 100).toFixed(2)),
            discountLabel: label.trim() || 'Oferta especial',
            discountActive: true,
          });
        })
      );

      toast.success(`Desconto aplicado em ${selectedProducts.length} produto(s)`);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao aplicar desconto');
    } finally {
      setIsLoading(false);
    }
  };

  const clearDiscount = async () => {
    if (selectedProducts.length === 0) {
      toast.error('Selecione produtos para remover desconto');
      return;
    }

    setIsLoading(true);
    try {
      await Promise.all(
        selectedProducts.map(async (product) => {
          const fallbackPrice = product.originalPrice != null ? product.originalPrice : product.price;
          await updateProduct(product.id, {
            price: Number(fallbackPrice.toFixed(2)),
            originalPrice: null,
            discountAmount: null,
            discountPercent: null,
            discountLabel: null,
            discountActive: false,
          });
        })
      );
      toast.success(`Desconto removido de ${selectedProducts.length} produto(s)`);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao remover desconto');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[88vh] sm:max-w-lg">
        <DialogHeader className="dialog-titlebar -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-lg">
          <DialogTitle>Novo Desconto</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Aplicar em</Label>
            <Select value={scopeMode} onValueChange={(value: ScopeMode) => setScopeMode(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="category">Categoria</SelectItem>
                <SelectItem value="product">Produto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {scopeMode === 'category' ? (
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={selectedCategory || undefined}
                onValueChange={(value: Category) => setSelectedCategory(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {CATEGORY_LABELS[category]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Produto</Label>
              <Select value={selectedProductId || undefined} onValueChange={setSelectedProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {productOptions.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={discountMode} onValueChange={(value: DiscountMode) => setDiscountMode(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Percentual (%)</SelectItem>
                  <SelectItem value="amount">Valor fixo (R$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder={discountMode === 'percent' ? '10' : '5.00'}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Etiqueta</Label>
            <Input
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Ex: Oferta PIX"
            />
            <p className="text-xs text-muted-foreground">
              Produtos afetados agora: {selectedProducts.length}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="secondary" type="button" onClick={clearDiscount} disabled={isLoading}>
            Remover desconto
          </Button>
          <Button type="button" onClick={applyDiscount} disabled={isLoading}>
            {isLoading ? 'Aplicando...' : 'Aplicar desconto'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
