import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ImagePlus, Save, SquarePen, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useERP } from "@/contexts/ERPContext";
import {
  createCategory,
  createSitePopup,
  deactivateSitePopup,
  fetchCategories,
  fetchSitePopups,
  reorderCategories,
  reorderSitePopups,
  toggleCategoryStatus,
  toggleSitePopupStatus,
  updateCategory,
  updateSitePopup,
  type ErpCategory,
  type ErpSitePopup,
  type ErpSitePopupLevel,
  type ErpSitePopupType,
} from "@/api/erp";
import { ProductModal } from "@/components/modals/ProductModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/lib/priceFormatter";

type PopupForm = {
  type: ErpSitePopupType;
  level: ErpSitePopupLevel;
  title: string;
  message: string;
  iconKey: string;
  imageUrl: string;
  buttonLabel: string;
  buttonUrl: string;
  startsAt: string;
  endsAt: string;
  displaySeconds: string;
  priority: string;
  isActive: boolean;
  dismissible: boolean;
};

type CategoryForm = {
  name: string;
  slug: string;
  description: string;
  image: string;
  isActive: boolean;
};

const POPUP_ICONS = [
  { key: "icon_padrao", label: "Padrao" },
  { key: "icon_analise", label: "Analise" },
  { key: "icon_bravo", label: "Sucesso / Bravo" },
  { key: "icon_confuso", label: "Insucesso / Confuso" },
  { key: "icon_lombrado", label: "Alerta / Lombrado" },
] as const;

const DEFAULT_POPUP_FORM: PopupForm = {
  type: "FIRST",
  level: "INFO",
  title: "",
  message: "",
  iconKey: "icon_padrao",
  imageUrl: "",
  buttonLabel: "",
  buttonUrl: "",
  startsAt: "",
  endsAt: "",
  displaySeconds: "",
  priority: "1",
  isActive: true,
  dismissible: true,
};

const DEFAULT_CATEGORY_FORM: CategoryForm = {
  name: "",
  slug: "",
  description: "",
  image: "",
  isActive: true,
};

const POPUP_TYPE_LABEL: Record<ErpSitePopupType, string> = {
  FIRST: "Primeiro popup",
  ALERT: "Alarme",
  NEWS: "Novidade",
};

const POPUP_LEVEL_LABEL: Record<ErpSitePopupLevel, string> = {
  INFO: "Info",
  SUCCESS: "Sucesso",
  WARNING: "Aviso",
  ERROR: "Erro",
};

const toLocalInput = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
};

const toIsoOrNull = (value: string) => {
  const v = value.trim();
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

const popupIconUrl = (popup: ErpSitePopup) =>
  popup.imageUrl?.trim()
    ? popup.imageUrl
    : `/assets/status-icons/${popup.iconKey || "icon_padrao"}.png`;

export default function SiteContentPage() {
  const queryClient = useQueryClient();
  const { products, toggleProductStatus } = useERP();

  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);

  const [popupForm, setPopupForm] = useState<PopupForm>(DEFAULT_POPUP_FORM);
  const [editingPopupId, setEditingPopupId] = useState<number | null>(null);

  const [categoryForm, setCategoryForm] = useState<CategoryForm>(DEFAULT_CATEGORY_FORM);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);

  const popupsQuery = useQuery({
    queryKey: ["erp", "site-popups"],
    queryFn: () => fetchSitePopups(),
  });

  const categoriesQuery = useQuery({
    queryKey: ["erp", "categories-manage"],
    queryFn: () => fetchCategories(true),
  });

  const banners = useMemo(
    () => products.filter((item) => item.category === "banners"),
    [products]
  );

  const popups = popupsQuery.data ?? [];
  const categories = [...(categoriesQuery.data ?? [])].sort(
    (a, b) => Number(a.position || 0) - Number(b.position || 0)
  );

  const savePopup = useMutation({
    mutationFn: async () => {
      const payload = {
        type: popupForm.type,
        level: popupForm.level,
        title: popupForm.title.trim(),
        message: popupForm.message.trim(),
        iconKey: popupForm.iconKey || null,
        imageUrl: popupForm.imageUrl.trim() || null,
        buttonLabel: popupForm.buttonLabel.trim() || null,
        buttonUrl: popupForm.buttonUrl.trim() || null,
        startsAt: toIsoOrNull(popupForm.startsAt),
        endsAt: toIsoOrNull(popupForm.endsAt),
        displaySeconds: popupForm.displaySeconds.trim() ? Number(popupForm.displaySeconds) : null,
        priority: popupForm.priority.trim() ? Number(popupForm.priority) : 100,
        isActive: popupForm.isActive,
        dismissible: popupForm.dismissible,
      };

      if (!payload.title || !payload.message) {
        throw new Error("Titulo e mensagem sao obrigatorios.");
      }
      if (payload.startsAt && payload.endsAt && new Date(payload.endsAt) <= new Date(payload.startsAt)) {
        throw new Error("Fim deve ser maior que inicio.");
      }

      if (editingPopupId) return updateSitePopup(editingPopupId, payload);
      return createSitePopup(payload);
    },
    onSuccess: () => {
      toast.success(editingPopupId ? "Popup atualizado." : "Popup criado.");
      setPopupForm(DEFAULT_POPUP_FORM);
      setEditingPopupId(null);
      queryClient.invalidateQueries({ queryKey: ["erp", "site-popups"] });
    },
    onError: (error: any) => toast.error(error?.message || "Falha ao salvar popup."),
  });

  const saveCategory = useMutation({
    mutationFn: async () => {
      const payload = {
        name: categoryForm.name.trim(),
        slug: categoryForm.slug.trim() || undefined,
        description: categoryForm.description.trim() || null,
        image: categoryForm.image.trim() || null,
        isActive: categoryForm.isActive,
      };
      if (!payload.name) throw new Error("Nome da categoria e obrigatorio.");
      if (editingCategoryId) return updateCategory(editingCategoryId, payload);
      return createCategory(payload);
    },
    onSuccess: () => {
      toast.success(editingCategoryId ? "Categoria atualizada." : "Categoria criada.");
      setCategoryForm(DEFAULT_CATEGORY_FORM);
      setEditingCategoryId(null);
      queryClient.invalidateQueries({ queryKey: ["erp", "categories-manage"] });
      queryClient.invalidateQueries({ queryKey: ["erp", "products"] });
    },
    onError: (error: any) => toast.error(error?.message || "Falha ao salvar categoria."),
  });

  const movePopup = async (id: number, direction: "up" | "down") => {
    const list = [...popups];
    const index = list.findIndex((p) => p.id === id);
    const target = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    await reorderSitePopups(list.map((item) => item.id));
    queryClient.invalidateQueries({ queryKey: ["erp", "site-popups"] });
  };

  const moveCategory = async (id: number, direction: "up" | "down") => {
    const list = [...categories];
    const index = list.findIndex((c) => c.id === id);
    const target = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    await reorderCategories(list.map((item) => item.id));
    queryClient.invalidateQueries({ queryKey: ["erp", "categories-manage"] });
  };

  const loadPopupToForm = (popup: ErpSitePopup) => {
    setEditingPopupId(popup.id);
    setPopupForm({
      type: popup.type,
      level: popup.level,
      title: popup.title || "",
      message: popup.message || "",
      iconKey: popup.iconKey || "icon_padrao",
      imageUrl: popup.imageUrl || "",
      buttonLabel: popup.buttonLabel || "",
      buttonUrl: popup.buttonUrl || "",
      startsAt: toLocalInput(popup.startsAt),
      endsAt: toLocalInput(popup.endsAt),
      displaySeconds: popup.displaySeconds != null ? String(popup.displaySeconds) : "",
      priority: String(popup.priority || 100),
      isActive: popup.isActive,
      dismissible: popup.dismissible,
    });
  };

  const loadCategoryToForm = (category: ErpCategory) => {
    setEditingCategoryId(category.id);
    setCategoryForm({
      name: category.name || "",
      slug: category.slug || "",
      description: category.description || "",
      image: category.image || "",
      isActive: category.isActive !== false,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Conteudo do Site</h1>
        <p className="text-muted-foreground">
          Nova aba para controlar banners, popups e categorias.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-xl">Banners</CardTitle>
            <CardDescription>Botao de Novo Banner movido para esta aba.</CardDescription>
          </div>
          <Button
            className="gap-2"
            onClick={() => {
              setEditingBannerId(null);
              setBannerModalOpen(true);
            }}
          >
            <ImagePlus className="h-4 w-4" />
            Novo Banner
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {banners.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              Nenhum banner cadastrado.
            </div>
          ) : (
            banners.map((banner) => (
              <div key={banner.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <img
                    src={banner.banner || banner.image || "/placeholder.svg"}
                    alt={banner.name}
                    className="h-12 w-20 rounded border object-cover"
                  />
                  <div>
                    <p className="font-semibold">{banner.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {banner.showBannerPrice ? formatPrice(banner.price, { decimals: 2 }) : "Preco oculto"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={banner.active ? "default" : "secondary"}>
                    {banner.active ? "Ativo" : "Inativo"}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingBannerId(banner.id);
                      setBannerModalOpen(true);
                    }}
                  >
                    <SquarePen className="mr-1 h-4 w-4" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      void toggleProductStatus(banner.id).catch((error: any) =>
                        toast.error(error?.message || "Falha ao atualizar banner.")
                      )
                    }
                  >
                    {banner.active ? "Desativar" : "Ativar"}
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Popups</CardTitle>
          <CardDescription>Primeiro popup + alarmes + novidades.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={popupForm.type} onValueChange={(value: ErpSitePopupType) => setPopupForm((p) => ({ ...p, type: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FIRST">Primeiro popup</SelectItem>
                  <SelectItem value="ALERT">Alarme</SelectItem>
                  <SelectItem value="NEWS">Novidade</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nivel</Label>
              <Select value={popupForm.level} onValueChange={(value: ErpSitePopupLevel) => setPopupForm((p) => ({ ...p, level: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="INFO">Info</SelectItem>
                  <SelectItem value="SUCCESS">Sucesso</SelectItem>
                  <SelectItem value="WARNING">Aviso</SelectItem>
                  <SelectItem value="ERROR">Erro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Titulo</Label>
            <Input value={popupForm.title} onChange={(e) => setPopupForm((p) => ({ ...p, title: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Mensagem</Label>
            <Textarea rows={3} value={popupForm.message} onChange={(e) => setPopupForm((p) => ({ ...p, message: e.target.value }))} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Icone</Label>
              <Select value={popupForm.iconKey} onValueChange={(value) => setPopupForm((p) => ({ ...p, iconKey: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {POPUP_ICONS.map((icon) => (
                    <SelectItem key={icon.key} value={icon.key}>{icon.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Imagem URL (opcional)</Label>
              <Input value={popupForm.imageUrl} onChange={(e) => setPopupForm((p) => ({ ...p, imageUrl: e.target.value }))} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Texto do botao (opcional)</Label>
              <Input
                value={popupForm.buttonLabel}
                onChange={(e) => setPopupForm((p) => ({ ...p, buttonLabel: e.target.value }))}
                placeholder="Ex: Ver novidade"
              />
            </div>
            <div className="space-y-2">
              <Label>URL do botao (opcional)</Label>
              <Input
                value={popupForm.buttonUrl}
                onChange={(e) => setPopupForm((p) => ({ ...p, buttonUrl: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Inicio</Label>
              <Input type="datetime-local" value={popupForm.startsAt} onChange={(e) => setPopupForm((p) => ({ ...p, startsAt: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Fim</Label>
              <Input type="datetime-local" value={popupForm.endsAt} onChange={(e) => setPopupForm((p) => ({ ...p, endsAt: e.target.value }))} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Input type="number" min="1" value={popupForm.priority} onChange={(e) => setPopupForm((p) => ({ ...p, priority: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Auto fechar (segundos)</Label>
              <Input type="number" min="0" value={popupForm.displaySeconds} onChange={(e) => setPopupForm((p) => ({ ...p, displaySeconds: e.target.value }))} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-sm">Popup ativo</span>
              <Switch checked={popupForm.isActive} onCheckedChange={(checked) => setPopupForm((p) => ({ ...p, isActive: checked }))} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-sm">Pode fechar</span>
              <Switch checked={popupForm.dismissible} onCheckedChange={(checked) => setPopupForm((p) => ({ ...p, dismissible: checked }))} />
            </div>
          </div>

          <div className="flex gap-2">
            <Button className="gap-2" onClick={() => savePopup.mutate()} disabled={savePopup.isPending}>
              <Save className="h-4 w-4" />
              {editingPopupId ? "Atualizar popup" : "Criar popup"}
            </Button>
            <Button variant="outline" onClick={() => { setEditingPopupId(null); setPopupForm(DEFAULT_POPUP_FORM); }}>
              Limpar
            </Button>
          </div>

          <div className="space-y-2">
            {popups.map((popup, index) => (
              <div key={popup.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <img src={popupIconUrl(popup)} alt={popup.title} className="h-10 w-10 rounded-full border object-cover" />
                  <div>
                    <p className="font-semibold">{popup.title}</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-line break-words">{popup.message}</p>
                    <div className="flex gap-2 pt-1">
                      <Badge variant="outline">{POPUP_TYPE_LABEL[popup.type]}</Badge>
                      <Badge variant="secondary">{POPUP_LEVEL_LABEL[popup.level]}</Badge>
                      <Badge variant={popup.isActive ? "default" : "secondary"}>{popup.isActive ? "Ativo" : "Inativo"}</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" disabled={index === 0} onClick={() => void movePopup(popup.id, "up")}><ArrowUp className="h-4 w-4" /></Button>
                  <Button variant="outline" size="icon" disabled={index === popups.length - 1} onClick={() => void movePopup(popup.id, "down")}><ArrowDown className="h-4 w-4" /></Button>
                  <Button variant="outline" size="sm" onClick={() => loadPopupToForm(popup)}><SquarePen className="mr-1 h-4 w-4" />Editar</Button>
                  <Button variant="outline" size="sm" onClick={() => void toggleSitePopupStatus(popup.id, !popup.isActive).then(() => queryClient.invalidateQueries({ queryKey: ["erp", "site-popups"] }))}>
                    {popup.isActive ? "Desativar" : "Ativar"}
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => void deactivateSitePopup(popup.id).then(() => queryClient.invalidateQueries({ queryKey: ["erp", "site-popups"] }))}>
                    <Trash2 className="mr-1 h-4 w-4" />
                    Desativar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Categorias</CardTitle>
          <CardDescription>Cadastrar e ordenar categorias.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={categoryForm.name} onChange={(e) => setCategoryForm((c) => ({ ...c, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Slug (opcional)</Label>
              <Input value={categoryForm.slug} onChange={(e) => setCategoryForm((c) => ({ ...c, slug: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Descricao</Label>
            <Textarea rows={2} value={categoryForm.description} onChange={(e) => setCategoryForm((c) => ({ ...c, description: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Imagem URL (opcional)</Label>
            <Input value={categoryForm.image} onChange={(e) => setCategoryForm((c) => ({ ...c, image: e.target.value }))} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <span className="text-sm">Categoria ativa</span>
            <Switch checked={categoryForm.isActive} onCheckedChange={(checked) => setCategoryForm((c) => ({ ...c, isActive: checked }))} />
          </div>
          <div className="flex gap-2">
            <Button className="gap-2" onClick={() => saveCategory.mutate()} disabled={saveCategory.isPending}>
              <Save className="h-4 w-4" />
              {editingCategoryId ? "Atualizar categoria" : "Criar categoria"}
            </Button>
            <Button variant="outline" onClick={() => { setEditingCategoryId(null); setCategoryForm(DEFAULT_CATEGORY_FORM); }}>
              Limpar
            </Button>
          </div>

          <div className="space-y-2">
            {categories.map((category, index) => (
              <div key={category.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                <div>
                  <p className="font-semibold">{category.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {category.slug} | {category._count?.products ?? 0} produto(s)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={category.isActive ? "default" : "secondary"}>{category.isActive ? "Ativa" : "Inativa"}</Badge>
                  <Button variant="outline" size="icon" disabled={index === 0} onClick={() => void moveCategory(category.id, "up")}><ArrowUp className="h-4 w-4" /></Button>
                  <Button variant="outline" size="icon" disabled={index === categories.length - 1} onClick={() => void moveCategory(category.id, "down")}><ArrowDown className="h-4 w-4" /></Button>
                  <Button variant="outline" size="sm" onClick={() => loadCategoryToForm(category)}><SquarePen className="mr-1 h-4 w-4" />Editar</Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      void toggleCategoryStatus(category.id, !(category.isActive !== false))
                        .then(() => queryClient.invalidateQueries({ queryKey: ["erp", "categories-manage"] }))
                    }
                  >
                    {category.isActive ? "Desativar" : "Ativar"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <ProductModal
        open={bannerModalOpen}
        onClose={() => {
          setBannerModalOpen(false);
          setEditingBannerId(null);
        }}
        productId={editingBannerId}
        initialMode="banner"
      />
    </div>
  );
}
