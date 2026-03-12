import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useERP } from '@/contexts/ERPContext';
import { Category, CATEGORY_COLORS, CATEGORY_LABELS, LocalSpot } from '@/types/erp';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ImageIcon, Eye, Upload } from 'lucide-react';

interface ProductModalProps {
  open: boolean;
  onClose: () => void;
  productId: string | null;
}

const categories = Object.keys(CATEGORY_LABELS) as Category[];
const PRODUCT_IMAGE_MAX_MB = 5;
const BANNER_IMAGE_MAX_MB = 8;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const BANNER_MIN_WIDTH = 1600;
const BANNER_MIN_HEIGHT = 600;

export function ProductModal({ open, onClose, productId }: ProductModalProps) {
  const { products, addProduct, updateProduct } = useERP();
  const [isLoading, setIsLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '' as Category | '',
    stock: '',
    image: '',
    banner: '',
    active: true,
    localSpot: 'categoria' as LocalSpot,
  });

  const isEditing = productId !== null;
  const existingProduct = productId ? products.find((p) => p.id === productId) : null;

  useEffect(() => {
    if (existingProduct) {
      setFormData({
        name: existingProduct.name,
        price: existingProduct.price.toString(),
        category: existingProduct.category,
        stock: existingProduct.stock.toString(),
        image: existingProduct.image || '',
        banner: existingProduct.banner || '',
        active: existingProduct.active,
        localSpot: existingProduct.localSpot || 'categoria',
      });
    } else {
      setFormData({ name: '', price: '', category: '', stock: '', image: '', banner: '', active: true, localSpot: 'categoria' });
    }
  }, [existingProduct, open]);

  const isBannerMode = formData.localSpot === 'novidades';
  const activeImageValue = isBannerMode ? formData.banner : formData.image;
  const setActiveImageValue = (value: string) => {
    setFormData((prev) => (isBannerMode ? { ...prev, banner: value } : { ...prev, image: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        toast.error('Formato invalido. Use JPG, PNG ou WEBP');
        return;
      }

      const maxMb = isBannerMode ? BANNER_IMAGE_MAX_MB : PRODUCT_IMAGE_MAX_MB;
      if (file.size > maxMb * 1024 * 1024) {
        toast.error(`Imagem deve ter no maximo ${maxMb}MB`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === 'string' ? reader.result : '';
        if (!result) {
          toast.error('Nao foi possivel ler a imagem');
          return;
        }

        if (isBannerMode) {
          const image = new Image();
          image.onload = () => {
            if (image.width < BANNER_MIN_WIDTH || image.height < BANNER_MIN_HEIGHT) {
              toast.error(`Banner precisa ter ao menos ${BANNER_MIN_WIDTH}x${BANNER_MIN_HEIGHT}px`);
              return;
            }
            setActiveImageValue(result);
          };
          image.onerror = () => toast.error('Erro ao validar dimensoes do banner');
          image.src = result;
          return;
        }

        setActiveImageValue(result);
      };
      reader.onerror = () => toast.error('Erro ao carregar imagem');
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.name.trim()) {
      toast.error('Nome do produto e obrigatorio');
      setIsLoading(false);
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price < 0) {
      toast.error('Preco invalido');
      setIsLoading(false);
      return;
    }

    const stock = parseInt(formData.stock);
    if (isNaN(stock) || stock < 0) {
      toast.error('Estoque inválido');
      setIsLoading(false);
      return;
    }

    if (!formData.category) {
      toast.error('Selecione uma categoria');
      setIsLoading(false);
      return;
    }

    const normalizedCategory = formData.category as Category;

    const productData = {
      name: formData.name.trim(),
      price,
      category: normalizedCategory,
      stock,
      image: isBannerMode ? undefined : formData.image.trim() || undefined,
      banner: isBannerMode ? activeImageValue.trim() || undefined : formData.banner.trim() || undefined,
      active: formData.active,
      localSpot: formData.localSpot,
    };

    try {
      if (isEditing && productId) {
        await updateProduct(productId, productData);
        toast.success('Produto atualizado com sucesso!');
      } else {
        await addProduct(productData);
        toast.success('Produto cadastrado com sucesso!');
      }
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao salvar produto');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="dialog-titlebar -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-lg">
            <DialogTitle>
              {isEditing ? 'Editar Produto' : 'Novo Produto'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Produto</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Seda Premium"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Preco (R$)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Estoque</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData((prev) => ({ ...prev, stock: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>

          <div className="space-y-2">
            <Label>Local</Label>
            <div className="grid grid-cols-1 gap-3">
              <Select
                value={formData.localSpot}
                onValueChange={(value: LocalSpot) =>
                  setFormData((prev) => ({
                    ...prev,
                    localSpot: value,
                  }))
                }
              >
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="categoria">Categoria (padrão)</SelectItem>
                  <SelectItem value="novidades">Novidades (vitrine)</SelectItem>
                  <SelectItem value="mais_vendidos">Mais vendidos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              Defina em qual vitrine da Home esse produto deve aparecer.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select
              value={formData.category || undefined}
              onValueChange={(value: Category) => setFormData((prev) => ({ ...prev, category: value }))}
            >
              <SelectTrigger><SelectValue placeholder="Selecione uma categoria" /></SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{CATEGORY_LABELS[cat]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div
              className={cn(
                'h-1 rounded-full transition-colors',
                formData.category ? CATEGORY_COLORS[formData.category] : 'bg-muted'
              )}
            />
          </div>

            {/* Image - URL or Upload */}
            <div className="space-y-2">
              <Label>{isBannerMode ? 'Banner principal (novidades)' : 'Imagem do produto'}</Label>
              <Tabs defaultValue="upload" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="upload" className="flex-1 gap-1"><Upload className="h-3 w-3" /> Upload</TabsTrigger>
                  <TabsTrigger value="url" className="flex-1 gap-1"><ImageIcon className="h-3 w-3" /> URL</TabsTrigger>
                </TabsList>
                <TabsContent value="upload" className="mt-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <Button type="button" variant="outline" className="w-full gap-2" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4" />
                    Selecionar Imagem
                  </Button>
                </TabsContent>
                <TabsContent value="url" className="mt-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={activeImageValue}
                        onChange={(e) => setActiveImageValue(e.target.value)}
                        placeholder="https://exemplo.com/imagem.jpg"
                        className="pl-10"
                      />
                    </div>
                    {activeImageValue && (
                      <Button type="button" variant="outline" size="icon" onClick={() => setPreviewOpen(true)} title="Visualizar">
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
              {activeImageValue && (
                <div className="mt-2 rounded-lg overflow-hidden border bg-muted/30 h-24 flex items-center justify-center relative">
                  <img
                    src={activeImageValue}
                    alt="Preview"
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-1 right-1 text-xs text-destructive h-6"
                    onClick={() => setActiveImageValue('')}
                  >
                    Remover
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {isBannerMode
                  ? 'Banner da vitrine: JPG/PNG/WEBP, ate 8MB, minimo 1600x600px (recomendado 1920x720).'
                  : 'Imagem do produto: JPG/PNG/WEBP, ate 5MB (recomendado 1200x1200).'}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="active">Status</Label>
                <p className="text-sm text-muted-foreground">Produto visivel no site</p>
              </div>
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, active: checked }))}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="dialog-titlebar -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-lg">
            <DialogTitle>Preview da Imagem</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-4 bg-muted/30 rounded-lg min-h-[300px]">
            {activeImageValue ? (
              <img src={activeImageValue} alt="Preview do produto" className="max-w-full max-h-[400px] object-contain rounded" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
            ) : (
              <p className="text-muted-foreground">Nenhuma imagem informada</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}


