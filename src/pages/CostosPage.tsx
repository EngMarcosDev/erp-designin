import { useMemo, useState } from "react";
import { DollarSign, Search, Save, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useERP } from "@/contexts/ERPContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/priceFormatter";
import ProfitGauge from "@/components/erp/ProfitGauge";
import { updateProduct } from "@/api/erp";

export default function CostosPage() {
  const { products, orders, refreshProducts } = useERP();
  const [search, setSearch] = useState("");
  const [costoPage, setCostoPage] = useState(1);
  const COSTO_PAGE_SIZE = 10;
  const [savingId, setSavingId] = useState<string | null>(null);
  // Armazena rascunho de custo por produto ID
  const [draftCosts, setDraftCosts] = useState<Record<string, string>>({});

  const activeProducts = useMemo(() => {
    setCostoPage(1);
    return products
      .filter((p) => p.category !== "banners" && p.active)
      .filter((p) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return (
          p.name.toLowerCase().includes(q) ||
          (p.category || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [products, search]);

  const costoTotalPages = Math.max(1, Math.ceil(activeProducts.length / COSTO_PAGE_SIZE));
  const pagedProducts = useMemo(
    () => activeProducts.slice((costoPage - 1) * COSTO_PAGE_SIZE, costoPage * COSTO_PAGE_SIZE),
    [activeProducts, costoPage]
  );

  const totalProducts = activeProducts.length;
  const withCost = activeProducts.filter((p) => (p.cost ?? 0) > 0).length;
  const withoutCost = totalProducts - withCost;
  const avgMargin = useMemo(() => {
    const withBoth = activeProducts.filter((p) => (p.cost ?? 0) > 0 && p.price > 0);
    if (!withBoth.length) return 0;
    const sum = withBoth.reduce((acc, p) => acc + ((p.price - (p.cost ?? 0)) / p.price) * 100, 0);
    return sum / withBoth.length;
  }, [activeProducts]);

  const getDraft = (id: string, cost?: number | null) =>
    draftCosts[id] !== undefined ? draftCosts[id] : cost != null ? String(cost) : "";

  const handleSaveCost = async (id: string) => {
    const raw = (draftCosts[id] ?? "").trim().replace(",", ".");
    const parsed = Number(raw);
    if (isNaN(parsed) || parsed < 0) {
      toast.error("Custo invalido");
      return;
    }

    setSavingId(id);
    try {
      await updateProduct(Number(id), { cost: parsed } as any);
      await refreshProducts();
      setDraftCosts((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      toast.success("Custo salvo!");
    } catch {
      toast.error("Falha ao salvar custo");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Custos & Investimento</h1>
        <p className="text-muted-foreground">
          Informe o custo por unidade de cada produto para calcular a margem de lucro real.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Produtos ativos</p>
            <p className="text-3xl font-bold">{totalProducts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Com custo</p>
            <p className="text-3xl font-bold text-green-600">{withCost}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Sem custo</p>
            <p className="text-3xl font-bold text-amber-600">{withoutCost}</p>
            {withoutCost > 0 && (
              <p className="text-xs text-muted-foreground">Margem subestimada</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Margem media</p>
            <p className={`text-3xl font-bold ${avgMargin >= 25 ? "text-green-600" : avgMargin >= 10 ? "text-yellow-600" : "text-red-600"}`}>
              {avgMargin.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Custo por Produto</CardTitle>
              <CardDescription>
                Edite o custo de aquisicao/investimento por unidade. O valor alimenta o velocimetro de lucro.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Filtrar produtos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="divide-y divide-border rounded-xl border">
                {activeProducts.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">Nenhum produto encontrado.</p>
                ) : (
                  pagedProducts.map((product) => {
                    const currentCost = product.cost ?? 0;
                    const draft = getDraft(product.id, product.cost);
                    const isDirty = draftCosts[product.id] !== undefined && draftCosts[product.id] !== String(currentCost);
                    const margin =
                      currentCost > 0 && product.price > 0
                        ? ((product.price - currentCost) / product.price) * 100
                        : null;

                    return (
                      <div
                        key={product.id}
                        className="flex flex-wrap items-center gap-3 p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{product.name}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5">
                            <Badge variant="outline" className="text-xs">{product.category}</Badge>
                            <span className="text-xs text-muted-foreground">
                              Venda: {formatPrice(product.price, { decimals: 2 })}
                            </span>
                            {margin !== null ? (
                              <span
                                className={`text-xs font-semibold ${margin >= 25 ? "text-green-600" : margin >= 10 ? "text-yellow-600" : "text-red-600"}`}
                              >
                                {margin.toFixed(1)}% margem
                              </span>
                            ) : (
                              <span className="text-xs text-amber-600">Sem custo</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="relative w-32">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                            <Input
                              className="pl-8 text-sm"
                              value={draft}
                              placeholder="0,00"
                              onChange={(e) =>
                                setDraftCosts((prev) => ({ ...prev, [product.id]: e.target.value }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") void handleSaveCost(product.id);
                              }}
                            />
                          </div>
                          <Button
                            size="sm"
                            variant={isDirty ? "default" : "outline"}
                            disabled={savingId === product.id || !isDirty}
                            onClick={() => void handleSaveCost(product.id)}
                          >
                            {savingId === product.id ? (
                              "..."
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              {costoTotalPages > 1 && (
                <div className="flex items-center justify-between pt-3">
                  <p className="text-sm text-muted-foreground">
                    Pág. {costoPage} / {costoTotalPages} · {activeProducts.length} produto(s)
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={costoPage <= 1} onClick={() => setCostoPage((p) => Math.max(1, p - 1))}>
                      Anterior
                    </Button>
                    <Button variant="outline" size="sm" disabled={costoPage >= costoTotalPages} onClick={() => setCostoPage((p) => Math.min(costoTotalPages, p + 1))}>
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <ProfitGauge orders={orders} />
          <Card>
            <CardContent className="pt-6 space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-semibold">Como funciona?</p>
              </div>
              <p className="text-xs text-muted-foreground">
                O custo informado aqui representa o investimento por unidade vendida (produto, embalagem, frete de compra, etc).
              </p>
              <p className="text-xs text-muted-foreground">
                O velocimetro compara receita confirmada com o custo total dos pedidos pagos, calculando a margem real.
              </p>
              <p className="text-xs text-amber-600">
                Produtos sem custo ficam fora do calculo, deixando a margem subestimada.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
