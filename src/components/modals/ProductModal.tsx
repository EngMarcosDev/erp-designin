import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogBody,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useERP } from "@/contexts/ERPContext";
import { Category, CATEGORY_COLORS, CATEGORY_LABELS, LocalSpot } from "@/types/erp";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ImageIcon, Upload, Crop, Sparkles, Move, RotateCcw, RotateCw, FlipHorizontal, FlipVertical, Grid3x3 } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface ProductModalProps {
  open: boolean;
  onClose: () => void;
  productId: string | null;
  initialMode?: "product" | "banner";
}

const categories = Object.keys(CATEGORY_LABELS) as Category[];
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const dedupeImageList = (items: string[]) => Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string" && reader.result.trim()) {
        resolve(reader.result);
      } else {
        reject(new Error("Arquivo vazio"));
      }
    };
    reader.onerror = () => reject(new Error("Falha ao ler imagem"));
    reader.readAsDataURL(file);
  });

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Falha ao carregar imagem para ajuste"));
    image.src = src;
  });

const optimizeDataUrl = async (source: string, params?: { maxSide?: number; quality?: number }) => {
  const image = await loadImage(source);
  const maxSide = params?.maxSide ?? 1800;
  const quality = params?.quality ?? 0.86;

  const largestSide = Math.max(image.width, image.height) || 1;
  const resizeRatio = largestSide > maxSide ? maxSide / largestSide : 1;
  const targetWidth = Math.max(1, Math.round(image.width * resizeRatio));
  const targetHeight = Math.max(1, Math.round(image.height * resizeRatio));

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas indisponivel");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, targetWidth, targetHeight);
  context.drawImage(image, 0, 0, targetWidth, targetHeight);
  return canvas.toDataURL("image/jpeg", quality);
};

const readFileAsOptimizedDataUrl = async (file: File, params?: { maxSide?: number; quality?: number }) => {
  const raw = await readFileAsDataUrl(file);
  return optimizeDataUrl(raw, params);
};

const renderAdjustedImage = async (params: {
  source: string;
  zoom: number;
  offsetX: number;
  offsetY: number;
  rotation: number;
  flipX: boolean;
  flipY: boolean;
  outputSize?: number;
}) => {
  const outputSize = params.outputSize ?? 1000;
  const image = await loadImage(params.source);
  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas indisponivel");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, outputSize, outputSize);

  const coverScale = Math.max(outputSize / image.width, outputSize / image.height);
  const scaledWidth = image.width * coverScale * params.zoom;
  const scaledHeight = image.height * coverScale * params.zoom;
  const translateX = (params.offsetX / 100) * outputSize;
  const translateY = (params.offsetY / 100) * outputSize;
  context.save();
  context.translate(outputSize / 2 + translateX, outputSize / 2 + translateY);
  context.rotate((params.rotation * Math.PI) / 180);
  context.scale(params.flipX ? -1 : 1, params.flipY ? -1 : 1);
  context.drawImage(image, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
  context.restore();

  return canvas.toDataURL("image/jpeg", 0.9);
};

export function ProductModal({ open, onClose, productId, initialMode = "product" }: ProductModalProps) {
  const { products, addProduct, updateProduct } = useERP();
  const [isLoading, setIsLoading] = useState(false);
  const productInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const dragMovedRef = useRef(false);

  const [galleryUrlInput, setGalleryUrlInput] = useState("");
  const [bannerUrlInput, setBannerUrlInput] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorSource, setEditorSource] = useState("");
  const [editorTarget, setEditorTarget] = useState<number | "banner" | null>(null);
  const [editorZoom, setEditorZoom] = useState(1);
  const [editorOffsetX, setEditorOffsetX] = useState(0);
  const [editorOffsetY, setEditorOffsetY] = useState(0);
  const [editorRotation, setEditorRotation] = useState(0);
  const [editorFlipX, setEditorFlipX] = useState(false);
  const [editorFlipY, setEditorFlipY] = useState(false);
  const [editorGridEnabled, setEditorGridEnabled] = useState(true);
  const [isApplyingAdjust, setIsApplyingAdjust] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    details: "",
    price: "",
    category: "" as Category | "",
    brand: "",
    subcategory: "",
    material: "",
    stock: "",
    image: "",
    gallery: [] as string[],
    banner: "",
    showBannerPrice: false,
    active: true,
    localSpot: "categoria" as LocalSpot,
  });

  const isEditing = productId !== null;
  const isBannerIntent = !isEditing && initialMode === "banner";
  const existingProduct = productId ? products.find((product) => product.id === productId) : null;

  useEffect(() => {
    if (existingProduct) {
      const normalizedGallery = dedupeImageList([existingProduct.image || "", ...(existingProduct.gallery || [])]);
      setFormData({
        name: existingProduct.name,
        description: existingProduct.description || "",
        details: existingProduct.details || "",
        price: existingProduct.price.toString(),
        category: existingProduct.category,
        brand: existingProduct.brand || "",
        subcategory: existingProduct.subcategory || "",
        material: existingProduct.material || "",
        stock: existingProduct.stock.toString(),
        image: normalizedGallery[0] || existingProduct.image || "",
        gallery: normalizedGallery,
        banner: existingProduct.banner || "",
        showBannerPrice: existingProduct.showBannerPrice === true,
        active: existingProduct.active,
        localSpot: existingProduct.localSpot || "categoria",
      });
    } else {
      setFormData({
        name: "",
        description: "",
        details: "",
        price: isBannerIntent ? "0" : "",
        category: isBannerIntent ? "banners" : "",
        brand: "",
        subcategory: "",
        material: "",
        stock: isBannerIntent ? "0" : "",
        image: "",
        gallery: [],
        banner: "",
        showBannerPrice: false,
        active: true,
        localSpot: isBannerIntent ? "novidades" : "categoria",
      });
    }

    setGalleryUrlInput("");
    setBannerUrlInput("");
    setEditorOpen(false);
  }, [existingProduct, open, isBannerIntent]);

  const isBannerMode = isBannerIntent || formData.category === "banners" || existingProduct?.category === "banners";

  const openEditor = (target: number | "banner", source: string) => {
    if (!source) return;
    setEditorTarget(target);
    setEditorSource(source);
    setEditorZoom(1);
    setEditorOffsetX(0);
    setEditorOffsetY(0);
    setEditorRotation(0);
    setEditorFlipX(false);
    setEditorFlipY(false);
    setEditorGridEnabled(true);
    dragStartRef.current = null;
    setEditorOpen(true);
  };

  const addGalleryImages = (urls: string[]) => {
    setFormData((previous) => {
      const nextGallery = dedupeImageList([...previous.gallery, ...urls]);
      return {
        ...previous,
        gallery: nextGallery,
        image: nextGallery[0] || "",
      };
    });
  };

  const handleProductFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (files.length === 0) return;

    const invalidType = files.find((file) => !ALLOWED_IMAGE_TYPES.includes(file.type));
    if (invalidType) {
      toast.error("Formato invalido. Use JPG, PNG ou WEBP.");
      return;
    }

    try {
      const payload = await Promise.all(
        files.map((file) =>
          readFileAsOptimizedDataUrl(file, {
            maxSide: 1800,
            quality: 0.86,
          })
        )
      );
      addGalleryImages(payload);
      toast.success(`${payload.length} imagem(ns) adicionada(s).`);
    } catch (error: any) {
      toast.error(error?.message || "Falha ao processar imagens");
    }
  };

  const handleBannerFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Formato invalido. Use JPG, PNG ou WEBP.");
      return;
    }

    try {
      const dataUrl = await readFileAsOptimizedDataUrl(file, { maxSide: 2200, quality: 0.88 });
      setFormData((previous) => ({ ...previous, banner: dataUrl }));
      toast.success("Banner carregado.");
    } catch (error: any) {
      toast.error(error?.message || "Falha ao carregar banner");
    }
  };

  const addImageFromUrl = () => {
    const nextUrl = galleryUrlInput.trim();
    if (!nextUrl) return;
    addGalleryImages([nextUrl]);
    setGalleryUrlInput("");
  };

  const removeGalleryImage = (index: number) => {
    setFormData((previous) => {
      const nextGallery = previous.gallery.filter((_, itemIndex) => itemIndex !== index);
      return {
        ...previous,
        gallery: nextGallery,
        image: nextGallery[0] || "",
      };
    });
  };

  const setPrimaryImage = (index: number) => {
    setFormData((previous) => {
      const target = previous.gallery[index];
      if (!target) return previous;
      const rest = previous.gallery.filter((_, itemIndex) => itemIndex !== index);
      const nextGallery = [target, ...rest];
      return {
        ...previous,
        gallery: nextGallery,
        image: nextGallery[0] || "",
      };
    });
  };

  const repositionByPointer = (clientX: number, clientY: number) => {
    const preview = previewRef.current;
    if (!preview) return;

    const rect = preview.getBoundingClientRect();
    const pointX = clamp((clientX - rect.left) / Math.max(rect.width, 1), 0, 1);
    const pointY = clamp((clientY - rect.top) / Math.max(rect.height, 1), 0, 1);

    // Shift clicked/touched point toward center for precision alignment.
    const nextOffsetX = clamp((0.5 - pointX) * 90, -45, 45);
    const nextOffsetY = clamp((0.5 - pointY) * 90, -45, 45);
    setEditorOffsetX(nextOffsetX);
    setEditorOffsetY(nextOffsetY);
  };

  const handlePreviewPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();

    dragMovedRef.current = false;
    dragStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      offsetX: editorOffsetX,
      offsetY: editorOffsetY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePreviewPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = dragStartRef.current;
    const preview = previewRef.current;
    if (!start || !preview) return;

    const rect = preview.getBoundingClientRect();
    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    const nextOffsetX = clamp(start.offsetX + (deltaX / Math.max(rect.width, 1)) * 100, -45, 45);
    const nextOffsetY = clamp(start.offsetY + (deltaY / Math.max(rect.height, 1)) * 100, -45, 45);

    if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
      dragMovedRef.current = true;
    }

    setEditorOffsetX(nextOffsetX);
    setEditorOffsetY(nextOffsetY);
  };

  const handlePreviewPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (!dragMovedRef.current) {
      repositionByPointer(event.clientX, event.clientY);
    }

    dragStartRef.current = null;
    dragMovedRef.current = false;
  };

  const handlePreviewWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const delta = event.deltaY < 0 ? 0.05 : -0.05;
    setEditorZoom((current) => clamp(Number((current + delta).toFixed(2)), 1, 3));
  };

  const applyEditor = async () => {
    if (!editorSource || editorTarget == null) return;
    setIsApplyingAdjust(true);

    try {
      const adjustedImage = await renderAdjustedImage({
        source: editorSource,
        zoom: editorZoom,
        offsetX: editorOffsetX,
        offsetY: editorOffsetY,
        rotation: editorRotation,
        flipX: editorFlipX,
        flipY: editorFlipY,
      });

      if (editorTarget === "banner") {
        setFormData((previous) => ({ ...previous, banner: adjustedImage }));
      } else {
        setFormData((previous) => {
          const nextGallery = [...previous.gallery];
          if (!nextGallery[editorTarget]) return previous;
          nextGallery[editorTarget] = adjustedImage;
          return {
            ...previous,
            gallery: nextGallery,
            image: nextGallery[0] || "",
          };
        });
      }

      setEditorOpen(false);
      toast.success("Imagem ajustada com sucesso.");
    } catch (error: any) {
      toast.error(error?.message || "Falha ao aplicar ajuste da imagem");
    } finally {
      setIsApplyingAdjust(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    if (!formData.name.trim()) {
      toast.error("Nome do produto e obrigatorio");
      setIsLoading(false);
      return;
    }

    const price = parseFloat(isBannerMode ? formData.price || "0" : formData.price);
    if (Number.isNaN(price) || price < 0) {
      toast.error("Preco invalido");
      setIsLoading(false);
      return;
    }

    const stock = parseInt(isBannerMode ? formData.stock || "0" : formData.stock, 10);
    if (Number.isNaN(stock) || stock < 0) {
      toast.error("Estoque invalido");
      setIsLoading(false);
      return;
    }

    if (!isBannerMode && !formData.category) {
      toast.error("Selecione uma categoria");
      setIsLoading(false);
      return;
    }

    const normalizedCategory = (isBannerMode ? "banners" : formData.category) as Category;
    const normalizedGallery = dedupeImageList(formData.gallery);

    const productData = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      details: formData.details.trim() || undefined,
      price,
      category: normalizedCategory,
      brand: formData.brand.trim() || undefined,
      subcategory: formData.subcategory.trim() || undefined,
      material: formData.material.trim() || undefined,
      stock,
      image: isBannerMode ? undefined : normalizedGallery[0] || undefined,
      gallery: isBannerMode ? undefined : normalizedGallery,
      banner: isBannerMode ? formData.banner.trim() || undefined : undefined,
      showBannerPrice: isBannerMode ? formData.showBannerPrice : false,
      active: formData.active,
      localSpot: isBannerMode ? "novidades" : formData.localSpot,
    };

    try {
      if (isEditing && productId) {
        await updateProduct(productId, productData);
        toast.success("Produto atualizado com sucesso!");
      } else {
        await addProduct(productData);
        toast.success("Produto cadastrado com sucesso!");
      }
      onClose();
    } catch (error: any) {
      toast.error(error?.message || "Erro ao salvar produto");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-h-[94vh] p-0 sm:max-w-4xl xl:max-w-5xl">
          <DialogHeader className="dialog-titlebar shrink-0 px-6 pt-6 pb-4 rounded-t-lg">
            <DialogTitle>{isEditing ? "Editar Produto" : isBannerIntent ? "Novo Banner" : "Novo Produto"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <DialogBody className="space-y-4 px-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Produto</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(event) => setFormData((previous) => ({ ...previous, name: event.target.value }))}
                placeholder="Ex: Seda Premium"
              />
            </div>

            {!isBannerMode && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="description">Resumo curto</Label>
                  <Textarea
                    id="description"
                    rows={2}
                    value={formData.description}
                    onChange={(event) => setFormData((previous) => ({ ...previous, description: event.target.value }))}
                    placeholder="Texto curto para apresentar o produto."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="details">Detalhes para o cliente</Label>
                  <Textarea
                    id="details"
                    rows={4}
                    value={formData.details}
                    onChange={(event) => setFormData((previous) => ({ ...previous, details: event.target.value }))}
                    placeholder="Ex: Esse kit e composto por seda slim, piteira de vidro e dichavador."
                  />
                  <p className="text-xs text-muted-foreground">
                    Esse bloco aparece organizado na pagina do produto no HeadShop.
                  </p>
                </div>
              </>
            )}

            {!isBannerMode && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Preco (R$)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(event) => setFormData((previous) => ({ ...previous, price: event.target.value }))}
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
                      onChange={(event) => setFormData((previous) => ({ ...previous, stock: event.target.value }))}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand">Marca</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(event) => setFormData((previous) => ({ ...previous, brand: event.target.value }))}
                      placeholder="Ex: Bem Bolado"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="material">Material</Label>
                    <Input
                      id="material"
                      value={formData.material}
                      onChange={(event) => setFormData((previous) => ({ ...previous, material: event.target.value }))}
                      placeholder="Ex: Papel, Madeira..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subcategory">Subcategoria</Label>
                  <Input
                    id="subcategory"
                    value={formData.subcategory}
                    onChange={(event) => setFormData((previous) => ({ ...previous, subcategory: event.target.value }))}
                    placeholder="Ex: Slim, King Size, Tradicional..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Campo livre para facilitar filtros por tipo interno da categoria.
                  </p>
                </div>
              </>
            )}

            {!isBannerMode && (
              <div className="space-y-2">
                <Label>Local</Label>
                <Select
                  value={formData.localSpot}
                  onValueChange={(value: LocalSpot) => setFormData((previous) => ({ ...previous, localSpot: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="categoria">Categoria (padrao)</SelectItem>
                    <SelectItem value="novidades">Novidades (vitrine)</SelectItem>
                    <SelectItem value="mais_vendidos">Mais vendidos</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Defina em qual vitrine da Home esse produto deve aparecer.
                </p>
              </div>
            )}

            {isBannerMode && (
              <p className="text-xs text-muted-foreground">Este cadastro sera salvo como banner de novidades.</p>
            )}

            {isBannerMode ? (
              <div className="space-y-2">
                <Label>Categoria</Label>
                <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">
                  {CATEGORY_LABELS.banners}
                </div>
                <div className="h-1 rounded-full bg-amber-600/80" />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={formData.category || undefined}
                  onValueChange={(value: Category) => setFormData((previous) => ({ ...previous, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter((category) => category !== "banners")
                      .map((category) => (
                        <SelectItem key={category} value={category}>
                          {CATEGORY_LABELS[category]}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <div
                  className={cn(
                    "h-1 rounded-full transition-colors",
                    formData.category ? CATEGORY_COLORS[formData.category] : "bg-muted"
                  )}
                />
              </div>
            )}

            {isBannerMode ? (
              <div className="space-y-2">
                <Label>Banner principal (novidades)</Label>

                <div className="flex flex-wrap gap-2">
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={handleBannerFile}
                  />
                  <Button type="button" variant="outline" className="gap-2" onClick={() => bannerInputRef.current?.click()}>
                    <Upload className="h-4 w-4" />
                    Upload
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    disabled={!formData.banner}
                    onClick={() => openEditor("banner", formData.banner)}
                  >
                    <Crop className="h-4 w-4" />
                    Ajustar
                  </Button>
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <ImageIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={bannerUrlInput}
                      onChange={(event) => setBannerUrlInput(event.target.value)}
                      placeholder="https://exemplo.com/banner.jpg"
                      className="pl-10"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const nextValue = bannerUrlInput.trim();
                      if (!nextValue) return;
                      setFormData((previous) => ({ ...previous, banner: nextValue }));
                      setBannerUrlInput("");
                    }}
                  >
                    Adicionar URL
                  </Button>
                </div>

                {formData.banner ? (
                  <div className="mt-2 rounded-lg overflow-hidden border bg-muted/30 h-24 flex items-center justify-center relative">
                    <img src={formData.banner} alt="Preview do banner" className="max-h-full max-w-full object-contain" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-1 right-1 text-xs text-destructive h-6"
                      onClick={() => setFormData((previous) => ({ ...previous, banner: "" }))}
                    >
                      Remover
                    </Button>
                  </div>
                ) : null}

                <p className="text-xs text-muted-foreground">
                  Recomendado: 1920x720 e ate 8MB. Upload nao sera bloqueado por tamanho/peso.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="banner-price">Valor do banner (R$)</Label>
                    <Input
                      id="banner-price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(event) => setFormData((previous) => ({ ...previous, price: event.target.value }))}
                      placeholder="0.00"
                    />
                    <p className="text-xs text-muted-foreground">Opcional: usado apenas se o valor for exibido no banner.</p>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="show-banner-price">Exibir valor?</Label>
                    <p className="text-xs text-muted-foreground">Mostra o preco no canto inferior esquerdo do banner.</p>
                  </div>
                  <Switch
                    id="show-banner-price"
                    checked={formData.showBannerPrice}
                    onCheckedChange={(checked) => setFormData((previous) => ({ ...previous, showBannerPrice: checked }))}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Galeria de imagens do produto</Label>

                <div className="flex flex-wrap gap-2">
                  <input
                    ref={productInputRef}
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={handleProductFiles}
                  />
                  <Button type="button" variant="outline" className="gap-2" onClick={() => productInputRef.current?.click()}>
                    <Upload className="h-4 w-4" />
                    Adicionar imagens
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    disabled={formData.gallery.length === 0}
                    onClick={() => openEditor(0, formData.gallery[0])}
                  >
                    <Sparkles className="h-4 w-4" />
                    Ajustar principal
                  </Button>
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <ImageIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={galleryUrlInput}
                      onChange={(event) => setGalleryUrlInput(event.target.value)}
                      placeholder="https://exemplo.com/produto.jpg"
                      className="pl-10"
                    />
                  </div>
                  <Button type="button" variant="outline" onClick={addImageFromUrl}>
                    Adicionar URL
                  </Button>
                </div>

                {formData.gallery.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                    {formData.gallery.map((image, index) => (
                      <div key={`${image}-${index}`} className="rounded-lg border border-border bg-muted/30 p-2 space-y-2">
                        <div className="h-24 overflow-hidden rounded-md bg-white/80">
                          <img src={image} alt={`Imagem ${index + 1}`} className="h-full w-full object-cover" />
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant={index === 0 ? "default" : "outline"}
                            className="h-7 px-2 text-[11px]"
                            onClick={() => setPrimaryImage(index)}
                          >
                            {index === 0 ? "Principal" : "Tornar principal"}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-[11px]"
                            onClick={() => openEditor(index, image)}
                          >
                            Ajustar
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-[11px] text-destructive"
                            onClick={() => removeGalleryImage(index)}
                          >
                            Remover
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground">
                    Nenhuma imagem adicionada ainda.
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Recomendado: 1200x1200 e ate 5MB por imagem. Upload nao sera bloqueado por tamanho/peso.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="active">Status</Label>
                <p className="text-sm text-muted-foreground">Produto visivel no site</p>
              </div>
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData((previous) => ({ ...previous, active: checked }))}
              />
            </div>
            </DialogBody>

            <DialogFooter className="shrink-0 gap-2 border-t border-border bg-background px-6 py-4 sm:gap-0">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-h-[94vh] p-0 sm:max-w-5xl">
          <DialogHeader className="dialog-titlebar -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-lg">
            <DialogTitle>Ajustar Imagem</DialogTitle>
          </DialogHeader>

          <DialogBody className="space-y-4 px-6 py-4">
            <div
              ref={previewRef}
              className="relative mx-auto aspect-square w-full max-w-[540px] touch-none overflow-hidden rounded-[28px] border border-border bg-muted/30 shadow-sm"
              onPointerDown={handlePreviewPointerDown}
              onPointerMove={handlePreviewPointerMove}
              onPointerUp={handlePreviewPointerUp}
              onPointerCancel={handlePreviewPointerUp}
              onWheel={handlePreviewWheel}
            >
              {editorSource ? (
                <>
                  <img
                    src={editorSource}
                    alt="Editor"
                    className="h-full w-full object-cover transition-transform duration-75"
                    style={{
                      transform: `translate(${editorOffsetX}%, ${editorOffsetY}%) scale(${editorZoom}) rotate(${editorRotation}deg) scaleX(${
                        editorFlipX ? -1 : 1
                      }) scaleY(${editorFlipY ? -1 : 1})`,
                      transformOrigin: "center",
                    }}
                  />
                  {editorGridEnabled ? (
                    <div
                      className="pointer-events-none absolute inset-0 opacity-70"
                      style={{
                        backgroundImage:
                          "linear-gradient(to right, rgba(255,255,255,0.45) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.45) 1px, transparent 1px)",
                        backgroundSize: "20% 20%",
                      }}
                    />
                  ) : null}
                </>
              ) : null}
              <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/45 px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] text-white">
                <Move className="mr-1 inline-block h-3 w-3" />
                Arraste, toque ou use o scroll para zoom
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Zoom</Label>
                <Slider
                  value={[editorZoom]}
                  min={1}
                  max={3}
                  step={0.05}
                  onValueChange={(value) => setEditorZoom(value[0] || 1)}
                />
              </div>

              <div className="space-y-2">
                <Label>Centralizacao horizontal</Label>
                <Slider
                  value={[editorOffsetX]}
                  min={-45}
                  max={45}
                  step={1}
                  onValueChange={(value) => setEditorOffsetX(value[0] || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label>Centralizacao vertical</Label>
                <Slider
                  value={[editorOffsetY]}
                  min={-45}
                  max={45}
                  step={1}
                  onValueChange={(value) => setEditorOffsetY(value[0] || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label>Rotacao</Label>
                <Slider
                  value={[editorRotation]}
                  min={-180}
                  max={180}
                  step={1}
                  onValueChange={(value) => setEditorRotation(value[0] || 0)}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => setEditorRotation((prev) => clamp(prev - 90, -180, 180))}>
                  <RotateCcw className="mr-1 h-4 w-4" />
                  -90°
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setEditorRotation((prev) => clamp(prev + 90, -180, 180))}>
                  <RotateCw className="mr-1 h-4 w-4" />
                  +90°
                </Button>
                <Button type="button" size="sm" variant={editorFlipX ? "default" : "outline"} onClick={() => setEditorFlipX((prev) => !prev)}>
                  <FlipHorizontal className="mr-1 h-4 w-4" />
                  Espelhar X
                </Button>
                <Button type="button" size="sm" variant={editorFlipY ? "default" : "outline"} onClick={() => setEditorFlipY((prev) => !prev)}>
                  <FlipVertical className="mr-1 h-4 w-4" />
                  Espelhar Y
                </Button>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2">
                <div className="flex items-center gap-2 text-sm">
                  <Grid3x3 className="h-4 w-4 text-muted-foreground" />
                  Grid de alinhamento
                </div>
                <Switch checked={editorGridEnabled} onCheckedChange={setEditorGridEnabled} />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              O ajuste aplica corte quadrado com preview em tempo real. Role o mouse sobre a imagem para zoom e arraste para ajuste fino.
            </p>
          </DialogBody>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setEditorOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={applyEditor} disabled={isApplyingAdjust}>
              {isApplyingAdjust ? "Aplicando..." : "Aplicar ajuste"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
