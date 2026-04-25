import { useEffect, useMemo, useRef, useState } from "react";
import {
  RefreshCw,
  ArrowLeftRight,
  Package,
  AlertTriangle,
  Download,
  Upload,
  ClipboardCheck,
  Sheet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useERP } from "@/contexts/ERPContext";
import { useUISettings } from "@/contexts/UISettingsContext";
import { CATEGORY_LABELS, Category } from "@/types/erp";
import { useErpCategories } from "@/hooks/useErpCategories";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

const parseCsvRow = (line: string) => {
  const cells: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (char === "," && !quoted) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
};

const escapeCsv = (value: string | number | boolean | null | undefined) => {
  const normalized = String(value ?? "");
  if (normalized.includes(",") || normalized.includes('"') || normalized.includes("\n")) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
};

export default function EstoquePage() {
  const { products, stockComparison, refreshStockComparison, syncToHeadshop, syncFromHeadshop, updateProduct } =
    useERP();
  const { lowStockThreshold, compactTables } = useUISettings();
  const { categories: apiCategories } = useErpCategories(true);
  const importInputRef = useRef<HTMLInputElement>(null);

  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | Category>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "low_stock" | "zero_stock">("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [realCounts, setRealCounts] = useState<Record<string, string>>({});
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  const categoryOptions = useMemo(() => {
    // Regra: exibir TODAS as categorias conhecidas — venham da API, dos produtos
    // ou do dicionário local CATEGORY_LABELS — incluindo as que não têm produto algum.
    // Isso garante que slugs novos (isqueiros, slicks) apareçam mesmo enquanto não
    // estão sincronizados no backend ou ainda não receberam produto.
    const merged = new Map<string, { slug: string; name: string }>();

    apiCategories
      .filter((c) => c.slug && c.slug !== "banners")
      .forEach((c) => merged.set(c.slug, { slug: c.slug, name: c.name }));

    products.forEach((p) => {
      const slug = p.category;
      if (!slug || slug === "banners" || merged.has(slug)) return;
      merged.set(slug, { slug, name: CATEGORY_LABELS[slug] || slug });
    });

    Object.entries(CATEGORY_LABELS).forEach(([slug, name]) => {
      if (!slug || slug === "banners" || merged.has(slug)) return;
      merged.set(slug, { slug, name });
    });

    return Array.from(merged.values())
      .map(({ slug, name }) => ({
        category: slug,
        label: name,
        count: products.filter((p) => p.category === slug).length,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
  }, [products, apiCategories]);

  const filteredProducts = useMemo(
    () =>
      products
        .filter((product) => product.category !== "banners")
        .filter((product) => product.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .filter((product) => categoryFilter === "all" || product.category === categoryFilter)
        .filter((product) => {
          if (statusFilter === "all") return true;
          if (statusFilter === "active") return product.active;
          if (statusFilter === "inactive") return !product.active;
          if (statusFilter === "low_stock") return product.stock < lowStockThreshold && product.stock > 0;
          if (statusFilter === "zero_stock") return product.stock <= 0;
          return true;
        })
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    [products, searchTerm, categoryFilter, statusFilter, lowStockThreshold]
  );

  const activeProducts = products.filter((product) => product.active && product.category !== "banners");
  const lowStockProducts = products.filter(
    (product) => product.category !== "banners" && product.stock < lowStockThreshold
  );
  const totalStock = products
    .filter((product) => product.category !== "banners")
    .reduce((sum, product) => sum + product.stock, 0);
  const itemsWithDifference = stockComparison.filter((item) => item.difference !== 0);
  const selectedProducts = filteredProducts.filter((product) => selectedIds.includes(product.id));
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const pagedProducts = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, page, pageSize]);
  const allVisibleSelected =
    pagedProducts.length > 0 && pagedProducts.every((product) => selectedIds.includes(product.id));

  useEffect(() => {
    setPage(1);
  }, [searchTerm, categoryFilter, statusFilter, pageSize]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const handleRefreshComparison = async () => {
    setIsRefreshing(true);
    try {
      await refreshStockComparison();
      toast.success("Comparacao de estoque atualizada.");
    } catch (error: any) {
      toast.error(error?.message || "Erro ao atualizar comparacao.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds((current) => {
      if (!checked) {
        return current.filter((id) => !pagedProducts.some((product) => product.id === id));
      }
      return Array.from(new Set([...current, ...pagedProducts.map((product) => product.id)]));
    });
  };

  const toggleSelectOne = (productId: string, checked: boolean) => {
    setSelectedIds((current) =>
      checked ? Array.from(new Set([...current, productId])) : current.filter((value) => value !== productId)
    );
  };

  const setCountValue = (productId: string, value: string) => {
    setRealCounts((current) => ({ ...current, [productId]: value }));
  };

  const applyRealCount = async (productId: string, silent = false) => {
    const product = products.find((entry) => entry.id === productId);
    const nextValue = Number(realCounts[productId]);
    if (!product || !Number.isFinite(nextValue) || nextValue < 0) {
      if (!silent) toast.error("Informe uma contagem real valida.");
      return false;
    }

    await updateProduct(productId, { stock: nextValue });
    setRealCounts((current) => ({ ...current, [productId]: String(nextValue) }));
    if (!silent) {
      toast.success(`Estoque real de ${product.name} atualizado para ${nextValue}.`);
    }
    return true;
  };

  const applySelectedRealCounts = async () => {
    const targets = selectedProducts.filter((product) => realCounts[product.id] !== undefined);
    if (targets.length === 0) {
      toast.error("Selecione produtos e preencha a coluna de estoque real.");
      return;
    }

    try {
      await Promise.all(targets.map((product) => applyRealCount(product.id, true)));
      toast.success(`Contagem aplicada em ${targets.length} produto(s).`);
    } catch (error: any) {
      toast.error(error?.message || "Falha ao aplicar contagem.");
    }
  };

  const exportProductsToCsv = (scope: "selected" | "filtered") => {
    const source = scope === "selected" ? selectedProducts : filteredProducts;
    if (source.length === 0) {
      toast.error(scope === "selected" ? "Nenhum produto selecionado." : "Nenhum produto para exportar.");
      return;
    }

    const header = [
      "id",
      "nome",
      "categoria",
      "estoque_atual",
      "estoque_real",
      "ativo",
      "marca",
      "subcategoria",
    ];
    const rows = source.map((product) =>
      [
        product.id,
        product.name,
        CATEGORY_LABELS[product.category] || product.category,
        product.stock,
        realCounts[product.id] ?? product.stock,
        product.active ? "sim" : "nao",
        product.brand || "",
        product.subcategory || "",
      ]
        .map(escapeCsv)
        .join(",")
    );

    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `estoque-${scope}-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    window.URL.revokeObjectURL(url);
    toast.success(
      scope === "selected"
        ? `${source.length} produto(s) exportado(s).`
        : "Planilha de estoque exportada com sucesso."
    );
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      if (lines.length < 2) {
        throw new Error("Arquivo CSV vazio ou invalido.");
      }

      const [headerLine, ...content] = lines;
      const header = parseCsvRow(headerLine).map((cell) => cell.toLowerCase());
      const idIndex = header.indexOf("id");
      const nameIndex = header.indexOf("nome");
      const stockIndex = header.indexOf("estoque_real");
      const fallbackStockIndex = stockIndex >= 0 ? stockIndex : header.indexOf("estoque_atual");

      if ((idIndex < 0 && nameIndex < 0) || fallbackStockIndex < 0) {
        throw new Error("Use colunas id ou nome junto de estoque_real/estoque_atual.");
      }

      const onlySelected = selectedIds.length > 0;
      const productMapById = new Map(products.map((product) => [product.id, product]));
      const productMapByName = new Map(products.map((product) => [product.name.trim().toLowerCase(), product]));
      const updates: Array<{ id: string; stock: number; name: string }> = [];

      for (const line of content) {
        const cells = parseCsvRow(line);
        const byId = idIndex >= 0 ? productMapById.get(String(cells[idIndex] || "").trim()) : undefined;
        const byName =
          !byId && nameIndex >= 0
            ? productMapByName.get(String(cells[nameIndex] || "").trim().toLowerCase())
            : undefined;
        const product = byId || byName;
        const nextStock = Number(String(cells[fallbackStockIndex] || "").replace(",", "."));

        if (!product || !Number.isFinite(nextStock) || nextStock < 0) continue;
        if (onlySelected && !selectedIds.includes(product.id)) continue;

        updates.push({ id: product.id, stock: Math.round(nextStock), name: product.name });
      }

      if (updates.length === 0) {
        throw new Error("Nenhum produto elegivel encontrado no CSV.");
      }

      await Promise.all(updates.map((entry) => updateProduct(entry.id, { stock: entry.stock })));
      setRealCounts((current) => ({
        ...current,
        ...Object.fromEntries(updates.map((entry) => [entry.id, String(entry.stock)])),
      }));
      toast.success(`${updates.length} produto(s) atualizados via importacao.`);
    } catch (error: any) {
      toast.error(error?.message || "Falha ao importar planilha.");
    } finally {
      setIsImporting(false);
    }
  };

  const comparisonRows = useMemo(
    () =>
      stockComparison.map((item) => {
        const countValue = realCounts[item.productId];
        const countedStock = countValue !== undefined && countValue !== "" ? Number(countValue) : item.erpStock;
        const countedDifference = Number.isFinite(countedStock) ? countedStock - item.erpStock : 0;
        return {
          ...item,
          countedStock,
          countedDifference,
        };
      }),
    [realCounts, stockComparison]
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Estoque</h1>
          <p className="text-muted-foreground">Planilha operacional, contagem real e sincronizacao do catalogo.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setIsComparisonOpen(true)} className="gap-2" variant="outline">
            <ArrowLeftRight className="h-4 w-4" />
            Checar estoque do sistema
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Produtos ativos</p>
                <p className="text-2xl font-bold">{activeProducts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-accent/10 p-3">
                <Sheet className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total em estoque</p>
                <p className="text-2xl font-bold">{totalStock} un.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-status-warning/10 p-3">
                <AlertTriangle className="h-6 w-6 text-status-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estoque baixo</p>
                <p className="text-2xl font-bold">{lowStockProducts.length}</p>
                <p className="text-xs text-muted-foreground">Abaixo de {lowStockThreshold} un.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-status-warning/10 p-3">
                <ArrowLeftRight className="h-6 w-6 text-status-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Divergencias</p>
                <p className="text-2xl font-bold">{itemsWithDifference.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Planilha de estoque</CardTitle>
              <p className="text-sm text-muted-foreground">
                Conte, selecione e atualize o estoque real direto da tabela.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={allVisibleSelected} onCheckedChange={toggleSelectAll} />
              <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Selecionar pagina</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Registros por pagina</span>
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
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Categoria</span>
              <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as "all" | Category)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categoryOptions.map(({ category, label, count }) => (
                    <SelectItem key={category} value={category}>
                      {label} ({count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Status</span>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                  <SelectItem value="low_stock">Estoque baixo (&lt;{lowStockThreshold})</SelectItem>
                  <SelectItem value="zero_stock">Estoque zerado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Buscar</span>
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar produto no estoque..."
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <input
              ref={importInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleImportFile}
            />
            <Button variant="outline" className="gap-2" onClick={() => exportProductsToCsv("filtered")}>
              <Download className="h-4 w-4" />
              Exportar filtros
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => exportProductsToCsv("selected")}>
              <Download className="h-4 w-4" />
              Exportar selecionados
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => importInputRef.current?.click()}
              disabled={isImporting}
            >
              <Upload className="h-4 w-4" />
              {isImporting ? "Importando..." : "Importar CSV"}
            </Button>
            <Button className="gap-2" onClick={applySelectedRealCounts}>
              <ClipboardCheck className="h-4 w-4" />
              Aplicar estoque real
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {selectedIds.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed p-3 text-sm">
              <Badge variant="secondary">{selectedIds.length} selecionado(s)</Badge>
              <span className="text-muted-foreground">
                Voce pode exportar, importar ou aplicar a contagem real apenas nesses itens.
              </span>
            </div>
          ) : null}

          <div className="text-xs text-muted-foreground">
            {filteredProducts.length} registro(s) encontrado(s) · pagina {page} de {totalPages}
          </div>

          {filteredProducts.length === 0 ? (
            <div className="py-12 text-center">
              <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="text-lg font-medium text-muted-foreground">Nenhum produto encontrado</h3>
              <p className="text-sm text-muted-foreground/70">Ajuste os filtros para buscar itens no estoque.</p>
            </div>
          ) : (
            <>
              <div className="overflow-auto max-h-[560px] rounded-md border border-border">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-card">
                    <TableRow className={cn(compactTables && "h-9")}>
                      <TableHead className="w-10">Sel.</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Atual</TableHead>
                      <TableHead className="text-center">Estoque real</TableHead>
                      <TableHead className="text-center">Diferenca</TableHead>
                      <TableHead className="text-right">Acao</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedProducts.map((product) => {
                      const enteredValue = realCounts[product.id];
                      const realValue = enteredValue !== undefined && enteredValue !== "" ? Number(enteredValue) : product.stock;
                      const difference = Number.isFinite(realValue) ? realValue - product.stock : 0;

                      return (
                        <TableRow key={product.id} className={cn(!product.active && "opacity-60", compactTables && "h-11")}>
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.includes(product.id)}
                              onCheckedChange={(checked) => toggleSelectOne(product.id, !!checked)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{product.name}</div>
                            {product.subcategory ? (
                              <div className="text-xs text-muted-foreground">{product.subcategory}</div>
                            ) : null}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{CATEGORY_LABELS[product.category] || product.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={product.active ? "default" : "secondary"}>
                              {product.active ? "Ativo" : "Inativo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center font-semibold">{product.stock}</TableCell>
                          <TableCell className="text-center">
                            <Input
                              type="number"
                              min="0"
                              className="mx-auto w-24 text-center"
                              value={enteredValue ?? ""}
                              onChange={(event) => setCountValue(product.id, event.target.value)}
                              placeholder={String(product.stock)}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={difference === 0 ? "secondary" : "outline"}
                              className={cn(
                                difference > 0 && "border-status-success/40 text-status-success",
                                difference < 0 && "border-status-error/40 text-status-error"
                              )}
                            >
                              {difference > 0 ? `+${difference}` : difference}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={() => void applyRealCount(product.id)}>
                              Atualizar
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  className="rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-50"
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
                            "h-8 min-w-8 rounded-md border px-2 text-sm",
                            isCurrent
                              ? "border-primary bg-primary text-primary-foreground"
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
                  className="rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-50"
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

      <Dialog open={isComparisonOpen} onOpenChange={setIsComparisonOpen}>
        <DialogContent className="max-h-[90vh] max-w-5xl">
          <DialogHeader className="dialog-titlebar -mx-6 -mt-6 rounded-t-lg px-6 pb-4 pt-6">
            <DialogTitle className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5" />
              Comparacao ERP x HeadShop
            </DialogTitle>
            <DialogDescription>
              Confira divergencias e aproveite para registrar a contagem real no estoque do ERP.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4 pt-2">
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" size="sm" onClick={handleRefreshComparison} disabled={isRefreshing} className="gap-2">
                <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                Atualizar
              </Button>
              <Button variant="outline" size="sm" onClick={() => void syncFromHeadshop()}>
                Puxar do HeadShop
              </Button>
              <Button variant="outline" size="sm" onClick={() => void syncToHeadshop()}>
                Enviar para HeadShop
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-center">ERP</TableHead>
                  <TableHead className="text-center">HeadShop</TableHead>
                  <TableHead className="text-center">Divergencia</TableHead>
                  <TableHead className="text-center">Contagem real</TableHead>
                  <TableHead className="text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparisonRows.map((item) => (
                  <TableRow
                    key={item.productId}
                    className={cn(item.difference > 0 && "bg-status-success/5", item.difference < 0 && "bg-status-warning/10")}
                  >
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell className="text-center font-semibold text-status-success">{item.erpStock}</TableCell>
                    <TableCell className="text-center font-semibold text-status-warning">{item.headshopStock}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={item.difference === 0 ? "secondary" : "outline"}
                        className={cn(
                          item.difference > 0 && "border-status-success/40 text-status-success",
                          item.difference < 0 && "border-status-warning/40 text-status-warning"
                        )}
                      >
                        {item.difference > 0 ? `+${item.difference}` : item.difference}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Input
                        type="number"
                        min="0"
                        className="mx-auto w-24 text-center"
                        value={realCounts[item.productId] ?? ""}
                        onChange={(event) => setCountValue(item.productId, event.target.value)}
                        placeholder={String(item.erpStock)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => void syncFromHeadshop()}>
                          Puxar
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => void syncToHeadshop()}>
                          Enviar
                        </Button>
                        <Button size="sm" onClick={() => void applyRealCount(item.productId)}>
                          Atualizar ERP
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  );
}
