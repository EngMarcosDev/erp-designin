import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Tag, Edit, Trash2, ToggleLeft, ToggleRight, Percent, DollarSign, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { fetchCoupons, createCoupon, updateCoupon, deleteCoupon, ErpCoupon } from "@/api/erp";

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(value));
};

const emptyForm = (): Omit<ErpCoupon, "id" | "usedCount" | "createdAt"> => ({
  code: "",
  description: "",
  type: "PERCENT",
  value: 10,
  minOrderValue: null,
  maxUses: null,
  isActive: true,
  startsAt: null,
  expiresAt: null,
});

type StatusFilter = "all" | "active" | "inactive" | "expired" | "full";

export default function CuponsPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ["erp", "coupons"],
    queryFn: fetchCoupons,
    staleTime: 30_000,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        code: form.code.trim().toUpperCase(),
        value: Number(form.value),
        minOrderValue: form.minOrderValue != null ? Number(form.minOrderValue) : null,
        maxUses: form.maxUses != null ? Number(form.maxUses) : null,
        startsAt: form.startsAt || null,
        expiresAt: form.expiresAt || null,
      };
      if (editingId) return updateCoupon(editingId, payload);
      return createCoupon(payload);
    },
    onSuccess: () => {
      toast.success(editingId ? "Cupom atualizado!" : "Cupom criado!");
      queryClient.invalidateQueries({ queryKey: ["erp", "coupons"] });
      closeModal();
    },
    onError: (error: any) => toast.error(error?.message || "Erro ao salvar cupom."),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      updateCoupon(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["erp", "coupons"] }),
    onError: (error: any) => toast.error(error?.message || "Erro ao atualizar cupom."),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCoupon,
    onSuccess: () => {
      toast.success("Cupom removido.");
      queryClient.invalidateQueries({ queryKey: ["erp", "coupons"] });
    },
    onError: (error: any) => toast.error(error?.message || "Erro ao remover cupom."),
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (coupon: ErpCoupon) => {
    setEditingId(coupon.id);
    setForm({
      code: coupon.code,
      description: coupon.description ?? "",
      type: coupon.type,
      value: coupon.value,
      minOrderValue: coupon.minOrderValue ?? null,
      maxUses: coupon.maxUses ?? null,
      isActive: coupon.isActive,
      startsAt: coupon.startsAt ? coupon.startsAt.slice(0, 10) : null,
      expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : null,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm());
  };

  const now = new Date();
  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      if (search.trim() && !c.code.toLowerCase().includes(search.trim().toLowerCase())) return false;
      if (statusFilter === "active") return c.isActive;
      if (statusFilter === "inactive") return !c.isActive;
      if (statusFilter === "expired") return c.expiresAt ? new Date(c.expiresAt) < now : false;
      if (statusFilter === "full") return c.maxUses != null && c.usedCount >= c.maxUses;
      return true;
    });
  }, [coupons, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredCoupons.length / PAGE_SIZE));
  const pagedCoupons = filteredCoupons.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const activeCoupons = coupons.filter((c) => c.isActive).length;
  const totalUses = coupons.reduce((sum, c) => sum + c.usedCount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cupons de Desconto</h1>
          <p className="text-muted-foreground">Crie e gerencie cupons para o checkout da HeadShop.</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Cupom
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3"><Tag className="h-6 w-6 text-primary" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total de cupons</p>
                <p className="text-2xl font-bold">{coupons.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-status-success/10 p-3"><ToggleRight className="h-6 w-6 text-status-success" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Ativos</p>
                <p className="text-2xl font-bold text-status-success">{activeCoupons}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-accent/10 p-3"><Percent className="h-6 w-6 text-accent" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total de usos</p>
                <p className="text-2xl font-bold">{totalUses}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Cupons</CardTitle>
          <CardDescription>Clique em Editar para alterar ou no toggle para ativar/desativar.</CardDescription>
          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por código..."
                className="pl-9 uppercase"
                value={search}
                onChange={(e) => { setSearch(e.target.value.toUpperCase()); setPage(1); }}
              />
              {search && (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => { setSearch(""); setPage(1); }}
                  aria-label="Limpar busca"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as StatusFilter); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
                <SelectItem value="expired">Vencidos</SelectItem>
                <SelectItem value="full">Esgotados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">Carregando cupons...</p>
          ) : filteredCoupons.length === 0 ? (
            <div className="p-12 text-center">
              <Tag className="mx-auto mb-4 h-10 w-10 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                {coupons.length === 0 ? "Nenhum cupom cadastrado. Crie o primeiro!" : "Nenhum cupom encontrado com os filtros aplicados."}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Usos</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedCoupons.map((coupon) => {
                    const isExpired = coupon.expiresAt ? new Date(coupon.expiresAt) < new Date() : false;
                    const isFull = coupon.maxUses != null && coupon.usedCount >= coupon.maxUses;
                    return (
                      <TableRow key={coupon.id}>
                        <TableCell>
                          <div>
                            <p className="font-mono font-bold text-sm">{coupon.code}</p>
                            {coupon.description ? (
                              <p className="text-xs text-muted-foreground">{coupon.description}</p>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            {coupon.type === "PERCENT" ? <Percent className="h-3 w-3" /> : <DollarSign className="h-3 w-3" />}
                            {coupon.type === "PERCENT" ? "%" : "R$"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {coupon.type === "PERCENT"
                            ? `${coupon.value}%`
                            : `R$ ${Number(coupon.value).toFixed(2)}`}
                          {coupon.minOrderValue ? (
                            <p className="text-xs text-muted-foreground">
                              Mín: R$ {Number(coupon.minOrderValue).toFixed(2)}
                            </p>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          {coupon.usedCount}
                          {coupon.maxUses ? (
                            <span className="text-muted-foreground"> / {coupon.maxUses}</span>
                          ) : null}
                          {isFull ? <Badge variant="secondary" className="ml-1 text-xs">Esgotado</Badge> : null}
                        </TableCell>
                        <TableCell className="text-sm">
                          {coupon.expiresAt ? (
                            <span className={isExpired ? "text-destructive" : "text-muted-foreground"}>
                              {formatDate(coupon.expiresAt)}
                              {isExpired ? " (vencido)" : ""}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Sem validade</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={coupon.isActive}
                            onCheckedChange={(checked) => toggleMutation.mutate({ id: coupon.id, isActive: checked })}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="outline" size="sm" onClick={() => openEdit(coupon)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteMutation.mutate(coupon.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-sm text-muted-foreground">Pág. {page} / {totalPages} · {filteredCoupons.length} cupom(ns)</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal criar/editar */}
      <Dialog open={modalOpen} onOpenChange={(open) => { if (!open) closeModal(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="dialog-titlebar -mx-6 -mt-6 rounded-t-lg px-6 pb-4 pt-6">
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              {editingId ? "Editar Cupom" : "Novo Cupom"}
            </DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Código *</Label>
                <Input
                  placeholder="EX: VERAO20"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  className="uppercase font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={form.type}
                  onValueChange={(v: "PERCENT" | "FIXED") => setForm((f) => ({ ...f, type: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENT">Percentual (%)</SelectItem>
                    <SelectItem value="FIXED">Valor fixo (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{form.type === "PERCENT" ? "Desconto (%)" : "Desconto (R$)"} *</Label>
                <Input
                  type="number"
                  min={0.01}
                  max={form.type === "PERCENT" ? 100 : undefined}
                  step={0.01}
                  value={form.value}
                  onChange={(e) => setForm((f) => ({ ...f, value: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Pedido mínimo (R$)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="Opcional"
                  value={form.minOrderValue ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, minOrderValue: e.target.value ? Number(e.target.value) : null }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Input
                placeholder="Ex: Desconto de verão"
                value={form.description ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Máx. de usos</Label>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  placeholder="Ilimitado"
                  value={form.maxUses ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value ? Number(e.target.value) : null }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Válido até</Label>
                <Input
                  type="date"
                  value={form.expiresAt ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value || null }))}
                />
              </div>
            </div>

            <div className="flex items-center justify-between border-t pt-3">
              <Label>Cupom ativo</Label>
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, isActive: checked }))}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>Cancelar</Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !form.code.trim() || !form.value}
            >
              {saveMutation.isPending ? "Salvando..." : editingId ? "Atualizar" : "Criar Cupom"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
