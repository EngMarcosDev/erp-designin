import { useState, useEffect, useMemo, useRef } from "react";
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
import { useErpCategories, resolveCategoryColor, resolveCategoryLabel } from "@/hooks/useErpCategories";
import { Category, CATEGORY_LABELS, LocalSpot } from "@/types/erp";
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

type EditorAspectMode = "free" | "square" | "banner";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const EDITOR_OFFSET_LIMIT = 65;
const PRODUCT_IMAGE_MAX_SIDE = 2600;
const BANNER_IMAGE_MAX_SIDE = 4200;
const MIN_FREE_CROP_RATIO = 0.28;

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

const imageCache = new Map<string, Promise<HTMLImageElement>>();

const loadImage = (src: string) => {
  const cacheKey = src.trim();
  if (!cacheKey) {
    return Promise.reject(new Error("Imagem vazia"));
  }

  const cached = imageCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Falha ao carregar imagem para ajuste"));
    image.src = cacheKey;
  });
  const guardedPromise = promise.catch((error) => {
    imageCache.delete(cacheKey);
    throw error;
  });
  imageCache.set(cacheKey, guardedPromise);
  return guardedPromise;
};

const resolveMimeType = (source: string, preferredType?: string) => {
  const normalizedPreferred = String(preferredType || "").trim().toLowerCase();
  if (normalizedPreferred === "image/png") return "image/png";
  if (normalizedPreferred === "image/webp") return "image/webp";
  if (normalizedPreferred === "image/jpeg" || normalizedPreferred === "image/jpg") return "image/jpeg";
  if (source.startsWith("data:image/png")) return "image/png";
  if (source.startsWith("data:image/webp")) return "image/webp";
  if (/\.png(\?|$)/i.test(source)) return "image/png";
  if (/\.webp(\?|$)/i.test(source)) return "image/webp";
  return "image/jpeg";
};

const optimizeDataUrl = async (
  source: string,
  params?: { maxSide?: number; quality?: number; preferredType?: string }
) => {
  const image = await loadImage(source);
  const maxSide = params?.maxSide ?? PRODUCT_IMAGE_MAX_SIDE;
  const quality = params?.quality ?? 0.92;
  const mimeType = resolveMimeType(source, params?.preferredType);

  const largestSide = Math.max(image.width, image.height) || 1;
  const resizeRatio = largestSide > maxSide ? maxSide / largestSide : 1;
  if (resizeRatio >= 1) {
    return source;
  }

  const targetWidth = Math.max(1, Math.round(image.width * resizeRatio));
  const targetHeight = Math.max(1, Math.round(image.height * resizeRatio));

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas indisponivel");
  }

  if (mimeType === "image/jpeg") {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, targetWidth, targetHeight);
  } else {
    context.clearRect(0, 0, targetWidth, targetHeight);
  }

  context.drawImage(image, 0, 0, targetWidth, targetHeight);
  return mimeType === "image/png" ? canvas.toDataURL(mimeType) : canvas.toDataURL(mimeType, quality);
};

const readFileAsOptimizedDataUrl = async (file: File, params?: { maxSide?: number; quality?: number }) => {
  const raw = await readFileAsDataUrl(file);
  return optimizeDataUrl(raw, {
    ...params,
    preferredType: file.type,
  });
};

const renderAdjustedImage = async (params: {
  source: string;
  zoom: number;
  offsetX: number;
  offsetY: number;
  rotation: number;
  flipX: boolean;
  flipY: boolean;
  aspectMode?: EditorAspectMode;
  maxSide?: number;
  cropWidthRatio?: number;
  cropHeightRatio?: number;
  targetCanvas?: HTMLCanvasElement;
}) => {
  const image = await loadImage(params.source);
  const aspectMode = params.aspectMode ?? "free";
  const maxSide = params.maxSide ?? PRODUCT_IMAGE_MAX_SIDE;
  const mimeType = resolveMimeType(params.source);
  const sourceAspect = image.width > 0 && image.height > 0 ? image.width / image.height : 1;
  const largestSide = Math.max(image.width, image.height) || 1;
  const resizeRatio = largestSide > maxSide ? maxSide / largestSide : 1;
  const baseWidth = Math.max(1, Math.round(image.width * resizeRatio));
  const baseHeight = Math.max(1, Math.round(image.height * resizeRatio));
  const cropWidthRatio = clamp(params.cropWidthRatio ?? 1, MIN_FREE_CROP_RATIO, 1);
  const cropHeightRatio = clamp(params.cropHeightRatio ?? 1, MIN_FREE_CROP_RATIO, 1);
  const targetAspect =
    aspectMode === "square"
      ? 1
      : aspectMode === "banner"
        ? 16 / 6
        : ((sourceAspect || 1) * cropWidthRatio) / Math.max(cropHeightRatio, 0.01);
  const boundedMaxSide = Math.min(maxSide, Math.max(baseWidth, baseHeight) || maxSide);
  let canvasWidth =
    targetAspect >= 1 ? boundedMaxSide : Math.max(1, Math.round(boundedMaxSide * targetAspect));
  let canvasHeight =
    targetAspect >= 1 ? Math.max(1, Math.round(boundedMaxSide / targetAspect)) : boundedMaxSide;

  if (aspectMode === "free") {
    canvasWidth = Math.max(1, Math.round(baseWidth * cropWidthRatio));
    canvasHeight = Math.max(1, Math.round(baseHeight * cropHeightRatio));
  }

  const canvas = params.targetCanvas ?? document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas indisponivel");
  }
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  if (mimeType === "image/jpeg") {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvasWidth, canvasHeight);
  } else {
    context.clearRect(0, 0, canvasWidth, canvasHeight);
  }

  const coverScale = Math.max(canvasWidth / baseWidth, canvasHeight / baseHeight);
  const scaledWidth = (aspectMode === "free" ? baseWidth : baseWidth * coverScale) * params.zoom;
  const scaledHeight = (aspectMode === "free" ? baseHeight : baseHeight * coverScale) * params.zoom;
  const translateX = (params.offsetX / 100) * (aspectMode === "free" ? baseWidth : canvasWidth);
  const translateY = (params.offsetY / 100) * (aspectMode === "free" ? baseHeight : canvasHeight);
  context.save();
  context.translate(canvasWidth / 2 + translateX, canvasHeight / 2 + translateY);
  context.rotate((params.rotation * Math.PI) / 180);
  context.scale(params.flipX ? -1 : 1, params.flipY ? -1 : 1);
  context.drawImage(image, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
  context.restore();

  if (params.targetCanvas) {
    return;
  }

  return mimeType === "image/png" ? canvas.toDataURL(mimeType) : canvas.toDataURL(mimeType, 0.94);
};

export function ProductModal({ open, onClose, productId, initialMode = "product" }: ProductModalProps) {
  const { products, addProduct, updateProduct } = useERP();
  const { categories: availableCategories, categoryMap } = useErpCategories(true);
  const [isLoading, setIsLoading] = useState(false);
  const productInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const dragMovedRef = useRef(false);
  const previewRenderRef = useRef(0);

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
  const [editorAspectMode, setEditorAspectMode] = useState<EditorAspectMode>("free");
  const [editorSourceAspect, setEditorSourceAspect] = useState(1);
  const [editorSourceSize, setEditorSourceSize] = useState({ width: 1, height: 1 });
  const [editorCropWidthRatio, setEditorCropWidthRatio] = useState(1);
  const [editorCropHeightRatio, setEditorCropHeightRatio] = useState(1);
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
  const editorMaxSide = editorTarget === "banner" ? BANNER_IMAGE_MAX_SIDE : PRODUCT_IMAGE_MAX_SIDE;
  const editorResizeRatio = useMemo(() => {
    const largestSide = Math.max(editorSourceSize.width, editorSourceSize.height) || 1;
    return largestSide > editorMaxSide ? editorMaxSide / largestSide : 1;
  }, [editorSourceSize.height, editorSourceSize.width, editorMaxSide]);
  const editorBaseWidth = useMemo(
    () => Math.max(1, Math.round(editorSourceSize.width * editorResizeRatio)),
    [editorSourceSize.width, editorResizeRatio],
  );
  const editorBaseHeight = useMemo(
    () => Math.max(1, Math.round(editorSourceSize.height * editorResizeRatio)),
    [editorSourceSize.height, editorResizeRatio],
  );
  const editorPreviewAspect = useMemo(() => {
    if (editorAspectMode === "square") return 1;
    if (editorAspectMode === "banner") return 16 / 6;
    return Math.max(0.45, ((editorSourceAspect || 1) * editorCropWidthRatio) / Math.max(editorCropHeightRatio, 0.01));
  }, [editorAspectMode, editorSourceAspect, editorCropWidthRatio, editorCropHeightRatio]);
  const editorOffsetLimitX = useMemo(() => {
    if (editorAspectMode !== "free") return EDITOR_OFFSET_LIMIT;
    return Math.min(95, Math.max(0, (editorZoom - editorCropWidthRatio) * 50));
  }, [editorAspectMode, editorZoom, editorCropWidthRatio]);
  const editorOffsetLimitY = useMemo(() => {
    if (editorAspectMode !== "free") return EDITOR_OFFSET_LIMIT;
    return Math.min(95, Math.max(0, (editorZoom - editorCropHeightRatio) * 50));
  }, [editorAspectMode, editorZoom, editorCropHeightRatio]);
  const editorEstimatedWidth = useMemo(() => {
    if (editorAspectMode === "free") {
      return Math.max(1, Math.round(editorBaseWidth * editorCropWidthRatio));
    }
    if (editorAspectMode === "square") {
      return Math.min(editorBaseWidth, editorBaseHeight);
    }
    const maxSide = Math.min(editorMaxSide, Math.max(editorBaseWidth, editorBaseHeight));
    return maxSide;
  }, [editorAspectMode, editorBaseWidth, editorBaseHeight, editorCropWidthRatio, editorMaxSide]);
  const editorEstimatedHeight = useMemo(() => {
    if (editorAspectMode === "free") {
      return Math.max(1, Math.round(editorBaseHeight * editorCropHeightRatio));
    }
    if (editorAspectMode === "square") {
      return Math.min(editorBaseWidth, editorBaseHeight);
    }
    return Math.max(1, Math.round(editorEstimatedWidth / (16 / 6)));
  }, [editorAspectMode, editorBaseHeight, editorBaseWidth, editorCropHeightRatio, editorEstimatedWidth]);

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
    setEditorAspectMode(target === "banner" ? "banner" : "free");
    setEditorCropWidthRatio(1);
    setEditorCropHeightRatio(1);
    setEditorGridEnabled(true);
    setEditorSourceAspect(target === "banner" ? 16 / 6 : 1);
    setEditorSourceSize({ width: 1, height: 1 });
    dragStartRef.current = null;
    void loadImage(source)
      .then((image) => {
        const nextAspect = image.width > 0 && image.height > 0 ? image.width / image.height : 1;
        setEditorSourceAspect(nextAspect || 1);
        setEditorSourceSize({
          width: image.width || 1,
          height: image.height || 1,
        });
      })
      .catch(() => {
        setEditorSourceAspect(target === "banner" ? 16 / 6 : 1);
        setEditorSourceSize({ width: 1, height: 1 });
      });
    setEditorOpen(true);
  };

  useEffect(() => {
    setEditorOffsetX((previous) => clamp(previous, -editorOffsetLimitX, editorOffsetLimitX));
    setEditorOffsetY((previous) => clamp(previous, -editorOffsetLimitY, editorOffsetLimitY));
  }, [editorOffsetLimitX, editorOffsetLimitY]);

  useEffect(() => {
    if (!editorOpen || !editorSource || !previewCanvasRef.current) return;

    const renderId = ++previewRenderRef.current;
    void renderAdjustedImage({
      source: editorSource,
      zoom: editorZoom,
      offsetX: editorOffsetX,
      offsetY: editorOffsetY,
      rotation: editorRotation,
      flipX: editorFlipX,
      flipY: editorFlipY,
      aspectMode: editorAspectMode,
      maxSide: Math.min(editorMaxSide, editorTarget === "banner" ? 1100 : 900),
      cropWidthRatio: editorCropWidthRatio,
      cropHeightRatio: editorCropHeightRatio,
      targetCanvas: previewCanvasRef.current,
    }).catch(() => {
      if (renderId !== previewRenderRef.current) return;
      const context = previewCanvasRef.current?.getContext("2d");
      if (context) {
        context.clearRect(0, 0, previewCanvasRef.current?.width || 0, previewCanvasRef.current?.height || 0);
      }
    });
  }, [
    editorOpen,
    editorSource,
    editorZoom,
    editorOffsetX,
    editorOffsetY,
    editorRotation,
    editorFlipX,
    editorFlipY,
    editorAspectMode,
    editorTarget,
    editorCropWidthRatio,
    editorCropHeightRatio,
    editorMaxSide,
  ]);

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
            maxSide: PRODUCT_IMAGE_MAX_SIDE,
            quality: 0.94,
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
      const dataUrl = await readFileAsOptimizedDataUrl(file, {
        maxSide: BANNER_IMAGE_MAX_SIDE,
        quality: 0.94,
      });
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
    const nextOffsetX = clamp((0.5 - pointX) * Math.max(editorOffsetLimitX * 1.8, 0), -editorOffsetLimitX, editorOffsetLimitX);
    const nextOffsetY = clamp((0.5 - pointY) * Math.max(editorOffsetLimitY * 1.8, 0), -editorOffsetLimitY, editorOffsetLimitY);
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
    const nextOffsetX = clamp(
      start.offsetX + (deltaX / Math.max(rect.width, 1)) * 100,
      -editorOffsetLimitX,
      editorOffsetLimitX
    );
    const nextOffsetY = clamp(
      start.offsetY + (deltaY / Math.max(rect.height, 1)) * 100,
      -editorOffsetLimitY,
      editorOffsetLimitY
    );

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
        aspectMode: editorAspectMode,
        maxSide: editorMaxSide,
        cropWidthRatio: editorCropWidthRatio,
        cropHeightRatio: editorCropHeightRatio,
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

    // Nome e obrigatorio apenas para produtos comuns; banners podem omiti-lo
    // pois o texto esta na propria imagem editada pelo usuario.
    if (!isBannerMode && !formData.name.trim()) {
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
      // Para banners: image = versão mobile, banner = versão desktop.
      image: isBannerMode ? (formData.image.trim() || undefined) : normalizedGallery[0] || undefined,
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
              <Label htmlFor="name">
                {isBannerMode ? "Nome do Banner (opcional)" : "Nome do Produto"}
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(event) => setFormData((previous) => ({ ...previous, name: event.target.value }))}
                placeholder={isBannerMode ? "Ex: Promoção de Verão (opcional)" : "Ex: Seda Premium"}
              />
              {isBannerMode && (
                <p className="text-xs text-muted-foreground">
                  O texto ficará na imagem — não é exibido por cima do banner.
                </p>
              )}
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
                  <p className="text-xs text-muted-foreground">Exibido na pagina do produto.</p>
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
                  <p className="text-xs text-muted-foreground">Usado para filtros internos.</p>
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
                    <SelectItem value="categoria">Categoria</SelectItem>
                    <SelectItem value="novidades">Novidades (vitrine)</SelectItem>
                    <SelectItem value="mais_vendidos">Mais vendidos</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Define onde o produto aparece na Home.</p>
              </div>
            )}

            {isBannerMode && (
              <p className="text-xs text-muted-foreground">Salvo como banner de novidades.</p>
            )}

            {isBannerMode ? (
              <div className="space-y-2">
                <Label>Categoria</Label>
                <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">
                  {resolveCategoryLabel("banners", categoryMap, CATEGORY_LABELS.banners)}
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
                    {availableCategories
                      .filter((category) => category.slug !== "banners" && category.isActive !== false)
                      .map((category) => (
                        <SelectItem key={category.slug} value={category.slug}>
                          {resolveCategoryLabel(category.slug, categoryMap, category.name)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <div
                  className={cn(
                    "h-1 rounded-full transition-colors",
                    formData.category ? resolveCategoryColor(formData.category) : "bg-muted"
                  )}
                />
              </div>
            )}

            {isBannerMode ? (
              <div className="space-y-2">
                <Label>Banner Desktop (paisagem larga)</Label>

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

                <p className="text-xs text-muted-foreground">Recomendado: 2200×780px ou mais largo (paisagem).</p>
              </div>
            ) : null}

            {isBannerMode ? (
              <div className="space-y-2">
                <Label>Banner Mobile (quadrado ou retrato)</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <ImageIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={formData.image}
                      onChange={(e) => setFormData((p) => ({ ...p, image: e.target.value }))}
                      placeholder="https://exemplo.com/banner-mobile.jpg"
                      className="pl-10"
                    />
                  </div>
                </div>
                {formData.image && formData.image !== formData.banner ? (
                  <div className="mt-2 rounded-lg overflow-hidden border bg-muted/30 h-24 flex items-center justify-center relative">
                    <img src={formData.image} alt="Preview mobile" className="max-h-full max-w-full object-contain" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-1 right-1 text-xs text-destructive h-6"
                      onClick={() => setFormData((p) => ({ ...p, image: "" }))}
                    >
                      Remover
                    </Button>
                  </div>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  Recomendado: 780×780px (quadrado) ou 780×1000px (retrato). Se vazio, usa o desktop.
                </p>
              </div>
            ) : null}

            {isBannerMode ? (
              <>
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
                    <p className="text-xs text-muted-foreground">Opcional.</p>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="show-banner-price">Exibir valor?</Label>
                    <p className="text-xs text-muted-foreground">Exibe o preco no banner.</p>
                  </div>
                  <Switch
                    id="show-banner-price"
                    checked={formData.showBannerPrice}
                    onCheckedChange={(checked) => setFormData((previous) => ({ ...previous, showBannerPrice: checked }))}
                  />
                </div>
              </>
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
                        <div className="h-24 overflow-hidden rounded-md bg-white/80 p-1">
                          <img src={image} alt={`Imagem ${index + 1}`} className="h-full w-full object-contain" />
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

                <p className="text-xs text-muted-foreground">Recomendado: 1200px ou mais no maior lado.</p>
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
          <DialogHeader className="dialog-titlebar shrink-0 rounded-t-lg px-6 pb-4 pt-6">
            <DialogTitle>Ajustar Imagem</DialogTitle>
          </DialogHeader>

          <DialogBody className="space-y-4 px-6 py-4">
            <div
              ref={previewRef}
              className="relative mx-auto w-full max-w-[760px] touch-none overflow-hidden rounded-[28px] border border-border bg-muted/30 shadow-sm"
              style={{
                aspectRatio: String(editorPreviewAspect),
              }}
              onPointerDown={handlePreviewPointerDown}
              onPointerMove={handlePreviewPointerMove}
              onPointerUp={handlePreviewPointerUp}
              onPointerCancel={handlePreviewPointerUp}
              onWheel={handlePreviewWheel}
            >
              <canvas ref={previewCanvasRef} className="h-full w-full" />
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
              <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/45 px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] text-white">
                <Move className="mr-1 inline-block h-3 w-3" />
                Arraste, toque ou use o scroll para zoom
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Formato</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={editorAspectMode === "free" ? "default" : "outline"}
                    onClick={() => setEditorAspectMode("free")}
                  >
                    Livre
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={editorAspectMode === "square" ? "default" : "outline"}
                    onClick={() => setEditorAspectMode("square")}
                  >
                    Quadrado
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={editorAspectMode === "banner" ? "default" : "outline"}
                    onClick={() => setEditorAspectMode("banner")}
                  >
                    Banner
                  </Button>
                </div>
              </div>

              {editorAspectMode === "free" ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Largura do corte</Label>
                    <Slider
                      value={[editorCropWidthRatio]}
                      min={MIN_FREE_CROP_RATIO}
                      max={1}
                      step={0.01}
                      onValueChange={(value) => setEditorCropWidthRatio(value[0] || 1)}
                    />
                    <p className="text-xs text-muted-foreground">
                      {Math.round(editorCropWidthRatio * 100)}% da largura redimensionada (maximo de {editorBaseWidth}px)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Altura do corte</Label>
                    <Slider
                      value={[editorCropHeightRatio]}
                      min={MIN_FREE_CROP_RATIO}
                      max={1}
                      step={0.01}
                      onValueChange={(value) => setEditorCropHeightRatio(value[0] || 1)}
                    />
                    <p className="text-xs text-muted-foreground">
                      {Math.round(editorCropHeightRatio * 100)}% da altura redimensionada (maximo de {editorBaseHeight}px)
                    </p>
                  </div>
                </div>
              ) : null}

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
                  min={-editorOffsetLimitX}
                  max={editorOffsetLimitX}
                  step={1}
                  onValueChange={(value) => setEditorOffsetX(value[0] || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label>Centralizacao vertical</Label>
                <Slider
                  value={[editorOffsetY]}
                  min={-editorOffsetLimitY}
                  max={editorOffsetLimitY}
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
              Resultado estimado: {editorEstimatedWidth} x {editorEstimatedHeight}px.
            </p>
          </DialogBody>

          <DialogFooter className="shrink-0 gap-2 border-t border-border bg-background px-6 py-4 sm:gap-0">
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
