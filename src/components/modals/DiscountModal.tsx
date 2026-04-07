import { useMemo, useState } from "react";
import { Eye, Search, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useERP } from "@/contexts/ERPContext";
import { useErpCategories, resolveCategoryLabel } from "@/hooks/useErpCategories";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DiscountModalProps {
  open: boolean;
  onClose: () => void;
}

type ScopeMode = "category" | "product";
type DiscountMode = "percent" | "amount";

const hasDiscount = (price: number, originalPrice?: number | null, discountActive?: boolean) =>
  discountActive === true &&
  typeof originalPrice === "number" &&
  Number.isFinite(originalPrice) &&
  originalPrice > price;

const formatPrice = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

export function DiscountModal({ open, onClose }: DiscountModalProps) {
  const { products, updateProduct } = useERP();
  const { categories, categoryMap } = useErpCategories(true);
  const [scopeMode, setScopeMode] = useState<ScopeMode>("category");
  const [discountMode, setDiscountMode] = useState<DiscountMode>("percent");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [value, setValue] = useState("");
  const [label, setLabel] = useState("Oferta especial");
  const [isLoading, setIsLoading] = useState(false);
  const [isListOpen, setIsListOpen] = useState(false);

  const categoryOptions = useMemo(
    () => categories.filter((category) => category.slug !== "banners" && category.isActive !== false),
    [categories]
  );

  const productOptions = useMemo(
    () =>
      products
        .filter((product) => product.active && product.category !== "banners")
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    [products]
  );

  const filteredProductOptions = useMemo(
    () =>
      productOptions.filter((product) =>
        product.name.toLowerCase().includes(productSearch.trim().toLowerCase())
      ),
    [productOptions, productSearch]
  );

  const selectedProducts = useMemo(() => {
    if (scopeMode === "category") {
      if (!selectedCategory) return [];
      return products.filter((product) => product.category === selectedCategory && product.active);
    }

    if (!selectedProductId) return [];
    return products.filter((product) => product.id === selectedProductId);
  }, [products, scopeMode, selectedCategory, selectedProductId]);

  const activeDiscounts = useMemo(
    () =>
      products
        .filter((product) => hasDiscount(product.price, product.originalPrice, product.discountActive))
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    [products]
  );

  const resetForm = () => {
    setScopeMode("category");
    setDiscountMode("percent");
    setSelectedCategory("");
    setSelectedProductId("");
    setProductSearch("");
    setValue("");
    setLabel("Oferta especial");
  };

  const applyDiscount = async () => {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      toast.error("Informe um valor de desconto valido");
      return;
    }

    if (scopeMode === "category" && !selectedCategory) {
      toast.error("Selecione uma categoria");
      return;
    }

    if (scopeMode === "product" && !selectedProductId) {
      toast.error("Selecione um produto");
      return;
    }

    if (selectedProducts.length === 0) {
      toast.error("Nenhum produto disponivel para aplicar desconto");
      return;
    }

    setIsLoading(true);
    try {
      await Promise.all(
        selectedProducts.map(async (product) => {
          const basePrice =
            product.discountActive && product.originalPrice != null ? product.originalPrice : product.price;
          const discountAmount = discountMode === "percent" ? (basePrice * numericValue) / 100 : numericValue;
          const nextPrice = Math.max(basePrice - discountAmount, 0);

          await updateProduct(product.id, {
            price: Number(nextPrice.toFixed(2)),
            originalPrice: Number(basePrice.toFixed(2)),
            discountAmount: Number(discountAmount.toFixed(2)),
            discountPercent:
              discountMode === "percent"
                ? Number(numericValue.toFixed(2))
                : Number(((discountAmount / Math.max(basePrice, 0.01)) * 100).toFixed(2)),
            discountLabel: label.trim() || "Oferta especial",
            discountActive: true,
          });
        })
      );

      toast.success(`Desconto aplicado em ${selectedProducts.length} produto(s)`);
      resetForm();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao aplicar desconto");
    } finally {
      setIsLoading(false);
    }
  };

  const removeSingleDiscount = async (productId: string) => {
    const product = products.find((item) => item.id === productId);
    if (!product) return;

    setIsLoading(true);
    try {
      const fallbackPrice = product.originalPrice != null ? product.originalPrice : product.price;
      await updateProduct(product.id, {
        price: Number(fallbackPrice.toFixed(2)),
        originalPrice: null,
        discountAmount: null,
        discountPercent: null,
        discountLabel: null,
        discountActive: false,
      });
      toast.success(`Desconto removido de "${product.name}"`);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao remover desconto");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            resetForm();
            onClose();
          }
        }}
      >
        <DialogContent className="max-h-[90vh] sm:max-w-lg">
          <DialogHeader className="dialog-titlebar -mx-6 -mt-6 rounded-t-lg px-6 pb-4 pt-6">
            <DialogTitle>Novo Desconto</DialogTitle>
          </DialogHeader>

          <DialogBody className="space-y-4 pt-2">
            <div className="rounded-2xl border border-amber-300/70 bg-gradient-to-r from-amber-100 via-yellow-50 to-amber-100 px-4 py-3 text-sm text-amber-950 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 font-semibold">
                  <Tag className="h-4 w-4" />
                  Descontos ativos
                </span>
                <span>{activeDiscounts.length}</span>
              </div>
            </div>

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

            {scopeMode === "category" ? (
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={selectedCategory || undefined} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((category) => (
                      <SelectItem key={category.slug} value={category.slug}>
                        {resolveCategoryLabel(category.slug, categoryMap, category.name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Produto</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={productSearch}
                    onChange={(event) => setProductSearch(event.target.value)}
                    placeholder="Pesquisar produto"
                    className="pl-10"
                  />
                </div>
                <Select value={selectedProductId || undefined} onValueChange={setSelectedProductId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredProductOptions.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">Nenhum produto encontrado.</div>
                    ) : (
                      filteredProductOptions.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))
                    )}
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
                  placeholder={discountMode === "percent" ? "10" : "5.00"}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Etiqueta</Label>
              <Input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Ex: Oferta PIX" />
              <p className="text-xs text-muted-foreground">Produtos afetados: {selectedProducts.length}</p>
            </div>
          </DialogBody>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              variant="outline"
              type="button"
              className="gap-2"
              onClick={() => setIsListOpen(true)}
            >
              <Eye className="h-4 w-4" />
              Ver descontos
            </Button>
            <Button type="button" onClick={applyDiscount} disabled={isLoading}>
              {isLoading ? "Aplicando..." : "Aplicar desconto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isListOpen} onOpenChange={setIsListOpen}>
        <DialogContent className="max-h-[90vh] sm:max-w-2xl">
          <DialogHeader className="dialog-titlebar -mx-6 -mt-6 rounded-t-lg px-6 pb-4 pt-6">
            <DialogTitle>Descontos ativos</DialogTitle>
          </DialogHeader>

          <DialogBody className="space-y-3 pt-2">
            {activeDiscounts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Nenhum desconto ativo no momento.
              </div>
            ) : (
              activeDiscounts.map((product) => (
                <div
                  key={product.id}
                  className="rounded-2xl border border-amber-300/70 bg-gradient-to-r from-amber-50 via-white to-amber-50 p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground">{product.name}</p>
                        <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-950">
                          {product.discountLabel || "Com desconto"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {resolveCategoryLabel(product.category, categoryMap)}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <span className="text-muted-foreground line-through">
                          {formatPrice(Number(product.originalPrice || 0))}
                        </span>
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 font-semibold text-amber-950 shadow-sm">
                          {formatPrice(product.price)}
                        </span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="destructive"
                      className="gap-2"
                      disabled={isLoading}
                      onClick={() => void removeSingleDiscount(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Remover
                    </Button>
                  </div>
                </div>
              ))
            )}
          </DialogBody>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setIsListOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
