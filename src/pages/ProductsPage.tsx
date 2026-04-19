import { useEffect, useMemo, useState } from "react";
import { BadgePercent, Edit, Eye, ImageOff, Megaphone, Package, Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useERP } from "@/contexts/ERPContext";
import { useErpCategories, resolveCategoryColor, resolveCategoryLabel } from "@/hooks/useErpCategories";
import { formatPrice } from "@/lib/priceFormatter";
import { LocalSpot, Product } from "@/types/erp";
import { ProductModal } from "@/components/modals/ProductModal";
import { DiscountModal } from "@/components/modals/DiscountModal";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

const localLabels: Record<LocalSpot, string> = {
  novidades: "Novidades",
  mais_vendidos: "Mais vendidos",
  categoria: "Categoria",
};

const hasDiscount = (product: Product) =>
  product.discountActive === true &&
  product.originalPrice != null &&
  Number(product.originalPrice) > Number(product.price);

const getProductSnippet = (product: Product) => product.details || product.description || "";

export default function ProdutosPage() {
  const navigate = useNavigate();
  const { products, toggleProductStatus } = useERP();
  const { categories: availableCategories, categoryMap } = useErpCategories(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [viewFilter, setViewFilter] = useState<"all" | "products" | "banners">("products");
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive" | "all">("active");
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createMode, setCreateMode] = useState<"product" | "banner">("product");
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);

  const handleEdit = (id: string) => {
    setCreateMode("product");
    setEditingProductId(id);
    setIsModalOpen(true);
  };

  const openProductModal = () => {
    setCreateMode("product");
    setEditingProductId(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCreateMode("product");
    setEditingProductId(null);
  };

  const handleToggleStatus = (id: string, name: string, currentStatus: boolean) => {
    void (async () => {
      try {
        await toggleProductStatus(id);
        toast.success(currentStatus ? `${name} foi desativado` : `${name} foi ativado`);
      } catch (err: any) {
        toast.error(err?.message || "Erro ao atualizar status");
      }
    })();
  };

  const visibleCategorySlugs = useMemo(() => {
    const fromApi = availableCategories
      .filter((category) => category.isActive !== false)
      .map((category) => category.slug);

    const unique = Array.from(new Set(fromApi));
    if (viewFilter === "products") {
      return unique.filter((slug) => slug !== "banners");
    }
    if (viewFilter === "banners") {
      return unique.filter((slug) => slug === "banners");
    }
    return unique;
  }, [availableCategories, viewFilter]);

  const categoryOptions = useMemo(
    () =>
      visibleCategorySlugs.map((slug) => ({
        slug,
        count: products.filter((product) => product.category === slug).length,
      })),
    [products, visibleCategorySlugs]
  );

  useEffect(() => {
    if (categoryFilter !== "all" && !visibleCategorySlugs.includes(categoryFilter)) {
      setCategoryFilter("all");
    }
  }, [categoryFilter, visibleCategorySlugs]);

  const filteredProducts = useMemo(
    () =>
      products
        .filter((product) => {
          const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
          const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
          const matchesStatus =
            statusFilter === "all" || (statusFilter === "active" ? product.active : !product.active);
          const isBannerEntry = product.category === "banners";
          const matchesView = viewFilter === "all" || (viewFilter === "banners" ? isBannerEntry : !isBannerEntry);
          return matchesSearch && matchesCategory && matchesStatus && matchesView;
        })
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    [products, searchTerm, categoryFilter, statusFilter, viewFilter]
  );

  useEffect(() => {
    setPage(1);
  }, [searchTerm, categoryFilter, viewFilter, statusFilter, pageSize]);

  const useListMode = filteredProducts.length > 8;
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pagedProducts = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, page, pageSize]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Produtos</h1>
          <p className="text-muted-foreground">Gerencie seu catalogo de produtos</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={openProductModal} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Produto
          </Button>
          <Button variant="outline" onClick={() => navigate("/conteudo")} className="gap-2">
            <Megaphone className="h-4 w-4" />
            Abrir Conteudo do Site
          </Button>
          <Button
            variant="secondary"
            onClick={() => setIsDiscountModalOpen(true)}
            className="gap-2 border border-amber-300 bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-300 text-amber-950 shadow-md hover:brightness-105"
          >
            <BadgePercent className="h-4 w-4" />
            Descontos
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {categoryOptions.map(({ slug, count }) => (
          <button
            key={slug}
            type="button"
            className={cn(
              "category-banner cursor-pointer text-left transition-opacity hover:opacity-90",
              resolveCategoryColor(slug)
            )}
            onClick={() => setCategoryFilter(slug)}
          >
            <p className="text-sm opacity-80">{count} produto(s)</p>
            <p className="font-bold">{resolveCategoryLabel(slug, categoryMap)}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {visibleCategorySlugs.map((slug) => (
              <SelectItem key={slug} value={slug}>
                {resolveCategoryLabel(slug, categoryMap)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(value: "active" | "inactive" | "all") => setStatusFilter(value)}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Somente ativos</SelectItem>
            <SelectItem value="inactive">Somente inativos</SelectItem>
            <SelectItem value="all">Todos</SelectItem>
          </SelectContent>
        </Select>
        <Select value={viewFilter} onValueChange={(value: "all" | "products" | "banners") => setViewFilter(value)}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Produtos e banners</SelectItem>
            <SelectItem value="products">Somente produtos</SelectItem>
            <SelectItem value="banners">Somente banners</SelectItem>
          </SelectContent>
        </Select>
        <Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value))}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Por pagina" />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size} por pagina
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="text-xs text-muted-foreground">
        {filteredProducts.length} registro(s) encontrado(s) · pagina {page} de {totalPages}
      </div>

      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="text-lg font-medium text-muted-foreground">Nenhum produto encontrado</h3>
              <p className="mb-4 text-sm text-muted-foreground/70">
                {searchTerm || categoryFilter !== "all" ? "Tente ajustar os filtros." : "Comece adicionando seu primeiro produto."}
              </p>
              {!searchTerm && categoryFilter === "all" ? (
                <Button onClick={openProductModal}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Produto
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : useListMode ? (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {pagedProducts.map((product) => (
                <div key={product.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50">
                  <div className={cn("h-10 w-2 rounded-full", resolveCategoryColor(product.category))} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-semibold text-foreground">{product.name}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {resolveCategoryLabel(product.category, categoryMap)}
                      </Badge>
                      {product.subcategory ? (
                        <Badge variant="outline" className="text-[11px]">
                          {product.subcategory}
                        </Badge>
                      ) : null}
                      {product.localSpot ? (
                        <Badge variant="outline" className="text-[11px]">
                          {localLabels[product.localSpot]}
                          {product.localSpot === "categoria" && product.localCategory
                            ? ` · ${resolveCategoryLabel(product.localCategory, categoryMap)}`
                            : ""}
                        </Badge>
                      ) : null}
                      {hasDiscount(product) ? (
                        <span className="inline-flex items-center rounded-full border border-amber-300 bg-gradient-to-r from-amber-100 via-yellow-50 to-amber-200 px-2.5 py-1 text-[11px] font-semibold text-amber-950 shadow-sm">
                          {product.discountLabel || "Com desconto"}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-1 flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span>
                        Preco:{" "}
                        {hasDiscount(product) ? (
                          <>
                            <span className="mr-2 line-through opacity-70">
                              {formatPrice(product.originalPrice || 0, { decimals: 2 })}
                            </span>
                            <strong className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-950 shadow-sm">
                              {formatPrice(product.price, { decimals: 2 })}
                            </strong>
                          </>
                        ) : (
                          <strong className="text-foreground">{formatPrice(product.price, { decimals: 2 })}</strong>
                        )}
                      </span>
                      <span>
                        Estoque:{" "}
                        <strong className={cn(product.stock < 10 && "text-status-error")}>{product.stock} un.</strong>
                      </span>
                    </div>

                    {getProductSnippet(product) ? (
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        <strong className="text-foreground">Detalhes:</strong> {getProductSnippet(product)}
                      </p>
                    ) : null}
                  </div>

                  <Badge
                    variant={product.active ? "default" : "secondary"}
                    className={cn(product.active ? "bg-status-success" : "bg-muted")}
                  >
                    {product.active ? "Ativo" : "Inativo"}
                  </Badge>

                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => handleEdit(product.id)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-2 py-1">
                      <span className="text-[11px] text-muted-foreground">{product.active ? "Ativo" : "Inativo"}</span>
                      <Switch
                        checked={product.active}
                        onCheckedChange={() => handleToggleStatus(product.id, product.name, product.active)}
                        aria-label={product.active ? "Desativar produto" : "Ativar produto"}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {pagedProducts.map((product) => (
            <Card
              key={product.id}
              className={cn("overflow-hidden transition-all hover:shadow-lg", !product.active && "opacity-60")}
            >
              <div className={cn("h-2", resolveCategoryColor(product.category))} />
              <div
                className="group relative flex h-32 items-center justify-center overflow-hidden bg-muted/30"
                onClick={() => {
                  const displayImage = product.banner || product.image;
                  if (displayImage) {
                    setPreviewImage({ url: displayImage, name: product.name });
                  }
                }}
              >
                {product.banner || product.image ? (
                  <>
                    <img
                      src={product.banner || product.image}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(event) => {
                        (event.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-foreground/0 transition-colors group-hover:bg-foreground/10">
                      <Eye className="h-5 w-5 text-foreground opacity-0 transition-opacity group-hover:opacity-70" />
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
                <div className="mb-3 flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-foreground">{product.name}</h3>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {resolveCategoryLabel(product.category, categoryMap)}
                    </Badge>
                    {product.subcategory ? (
                      <div className="mt-1">
                        <Badge variant="outline" className="text-[11px]">
                          {product.subcategory}
                        </Badge>
                      </div>
                    ) : null}
                    {hasDiscount(product) ? (
                      <div className="mt-1">
                        <span className="inline-flex items-center rounded-full border border-amber-300 bg-gradient-to-r from-amber-100 via-yellow-50 to-amber-200 px-2.5 py-1 text-[11px] font-semibold text-amber-950 shadow-sm">
                          {product.discountLabel || "Com desconto"}
                        </span>
                      </div>
                    ) : null}
                    {product.localSpot ? (
                      <div className="mt-1">
                        <Badge variant="outline" className="text-[11px]">
                          {localLabels[product.localSpot]}
                          {product.localSpot === "categoria" && product.localCategory
                            ? ` · ${resolveCategoryLabel(product.localCategory, categoryMap)}`
                            : ""}
                        </Badge>
                      </div>
                    ) : null}
                  </div>
                  <Badge
                    variant={product.active ? "default" : "secondary"}
                    className={cn("ml-2 shrink-0", product.active ? "bg-status-success" : "bg-muted")}
                  >
                    {product.active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  {getProductSnippet(product) ? (
                    <div className="rounded-xl border border-border/70 bg-muted/20 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Detalhes</p>
                      <p className="mt-1 line-clamp-3 text-sm text-foreground/90">{getProductSnippet(product)}</p>
                    </div>
                  ) : null}

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Preco:</span>
                    <span className="text-right font-medium">
                      {hasDiscount(product) ? (
                        <>
                          <span className="block text-xs opacity-60 line-through">
                            {formatPrice(product.originalPrice || 0, { decimals: 2 })}
                          </span>
                          <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-amber-950 shadow-sm">
                            {formatPrice(product.price, { decimals: 2 })}
                          </span>
                        </>
                      ) : (
                        formatPrice(product.price, { decimals: 2 })
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estoque:</span>
                    <span className={cn("font-medium", product.stock < 10 && "text-status-error")}>
                      {product.stock} un.
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(product.id)}>
                    <Edit className="mr-1 h-4 w-4" />
                    {product.category === "banners" ? "Editar Banner" : "Editar Produto"}
                  </Button>
                  <div className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-2">
                    <span className="text-[11px] text-muted-foreground">{product.active ? "Ativo" : "Inativo"}</span>
                    <Switch
                      checked={product.active}
                      onCheckedChange={() => handleToggleStatus(product.id, product.name, product.active)}
                      aria-label={product.active ? "Desativar produto" : "Ativar produto"}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredProducts.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            className="rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Anterior
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages })
              .slice(0, 7)
              .map((_, index) => {
                const pageNumber = index + 1;
                const isCurrent = pageNumber === page;
                return (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => setPage(pageNumber)}
                    className={cn(
                      "h-8 min-w-8 rounded-md border px-2 text-sm",
                      isCurrent ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"
                    )}
                  >
                    {pageNumber}
                  </button>
                );
              })}
          </div>

          <button
            type="button"
            className="rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-50"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          >
            Proxima
          </button>
        </div>
      ) : null}

      <ProductModal open={isModalOpen} onClose={handleCloseModal} productId={editingProductId} initialMode={createMode} />
      <DiscountModal open={isDiscountModalOpen} onClose={() => setIsDiscountModalOpen(false)} />

      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="dialog-titlebar -mx-6 -mt-6 rounded-t-lg px-6 pb-4 pt-6">
            <DialogTitle>{previewImage?.name}</DialogTitle>
          </DialogHeader>
          <DialogBody className="pt-2">
            <div className="flex min-h-[300px] items-center justify-center rounded-lg bg-muted/30 p-4">
              {previewImage ? (
                <img
                  src={previewImage.url}
                  alt={previewImage.name}
                  className="max-h-[400px] max-w-full rounded object-contain"
                  onError={(event) => {
                    (event.target as HTMLImageElement).src = "/placeholder.svg";
                  }}
                />
              ) : null}
            </div>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  );
}
