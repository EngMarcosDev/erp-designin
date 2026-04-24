import React, { createContext, useContext, ReactNode, useMemo, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Product,
  User,
  Order,
  StockComparison,
  Permission,
  Category,
  LocalSpot,
  DEFAULT_ADMIN_PERMISSIONS,
  DEFAULT_USER_PERMISSIONS,
} from "@/types/erp";
import {
  fetchProducts as apiFetchProducts,
  createProduct as apiCreateProduct,
  updateProduct as apiUpdateProduct,
  deleteProduct as apiDeleteProduct,
  fetchUsers as apiFetchUsers,
  createUser as apiCreateUser,
  updateUser as apiUpdateUser,
  deleteUser as apiDeleteUser,
  fetchOrders as apiFetchOrders,
  updateOrderStatus as apiUpdateOrderStatus,
  updateOrderDiscount as apiUpdateOrderDiscount,
  updateOrderShipping as apiUpdateOrderShipping,
  fetchStockComparison as apiFetchStockComparison,
  syncStockPull,
  syncStockPush,
} from "@/api/erp";
import { useAuth } from "@/contexts/AuthContext";

type AsyncVoid = Promise<void>;

interface ERPContextType {
  // Products
  products: Product[];
  addProduct: (product: Omit<Product, "id" | "createdAt" | "updatedAt">) => AsyncVoid;
  updateProduct: (id: string, product: Partial<Product>) => AsyncVoid;
  deleteProduct: (id: string) => AsyncVoid;
  toggleProductStatus: (id: string) => AsyncVoid;

  // Users
  users: User[];
  addUser: (user: Omit<User, "id" | "createdAt"> & { password: string }) => AsyncVoid;
  updateUser: (id: string, user: Partial<User> & { password?: string }) => AsyncVoid;
  deleteUser: (id: string) => AsyncVoid;
  toggleUserStatus: (id: string) => AsyncVoid;
  batchToggleUserStatus: (ids: string[], active: boolean) => AsyncVoid;
  updateUserPermissions: (id: string, permissions: Permission[]) => AsyncVoid;

  // Orders
  orders: Order[];
  updateOrderStatus: (id: string, status: Order["status"]) => AsyncVoid;
  updateOrderDiscount: (id: string, discount: number, reason?: string) => AsyncVoid;
  updateOrderShipping: (id: string, shipping: number, reason?: string) => AsyncVoid;

  // Stock
  stockComparison: StockComparison[];
  refreshStockComparison: () => AsyncVoid;
  syncToHeadshop: () => AsyncVoid;
  syncFromHeadshop: () => AsyncVoid;

  // Auth (derived)
  currentUser: User;
}

const ERPContext = createContext<ERPContextType | undefined>(undefined);

export function ERPProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();
  const canManageUsers = Boolean(authUser?.active && (authUser?.isAdmin || authUser?.permissions?.includes("gerenciar_usuarios")));

  // -------- Queries --------
  const productsQuery = useQuery({
    queryKey: ["erp", "products"],
    queryFn: apiFetchProducts,
  });

  const usersQuery = useQuery({
    queryKey: ["erp", "users"],
    queryFn: apiFetchUsers,
    enabled: canManageUsers,
    retry: false,
  });

  const prevOrderCountRef = useRef<number | null>(null);

  const ordersQuery = useQuery({
    queryKey: ["erp", "orders"],
    queryFn: apiFetchOrders,
    refetchInterval: 30000, // polling a cada 30s
  });

  // Notificação de novos pedidos — só dispara após carga inicial
  useEffect(() => {
    if (!ordersQuery.data) return; // aguarda dados reais chegarem
    const list = Array.isArray(ordersQuery.data) ? ordersQuery.data : [];
    const count = list.length;
    if (prevOrderCountRef.current === null) {
      prevOrderCountRef.current = count; // inicializa silenciosamente
      return;
    }
    const newCount = count - prevOrderCountRef.current;
    if (newCount > 0) {
      toast.success(
        `🛒 ${newCount} novo${newCount > 1 ? "s pedidos chegaram" : " pedido chegou"}! Confira a lista.`,
        { duration: 8000 }
      );
    }
    prevOrderCountRef.current = count;
  }, [ordersQuery.data]);

  const stockQuery = useQuery({
    queryKey: ["erp", "stock-compare"],
    queryFn: apiFetchStockComparison,
  });

  // -------- Mutations --------
  const createProductMut = useMutation({
    mutationFn: apiCreateProduct,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["erp", "products"] }),
  });

  const updateProductMut = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Product> }) =>
      apiUpdateProduct(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["erp", "products"] });
      queryClient.invalidateQueries({ queryKey: ["erp", "stock-compare"] });
    },
  });

  const deleteProductMut = useMutation({
    mutationFn: (id: number) => apiDeleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["erp", "products"] });
      queryClient.invalidateQueries({ queryKey: ["erp", "stock-compare"] });
    },
  });

  const createUserMut = useMutation({
    mutationFn: apiCreateUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["erp", "users"] }),
  });

  const updateUserMut = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<User> & { password?: string } }) => apiUpdateUser(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["erp", "users"] }),
  });

  const deleteUserMut = useMutation({
    mutationFn: (id: number) => apiDeleteUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["erp", "users"] }),
  });

  const updateOrderStatusMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "pendente" | "pago" | "cancelado" }) =>
      apiUpdateOrderStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["erp", "orders"] }),
  });

  const updateOrderDiscountMut = useMutation({
    mutationFn: ({ id, discount, reason }: { id: number; discount: number; reason?: string }) =>
      apiUpdateOrderDiscount(id, discount, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["erp", "orders"] }),
  });

  const updateOrderShippingMut = useMutation({
    mutationFn: ({ id, shipping, reason }: { id: number; shipping: number; reason?: string }) =>
      apiUpdateOrderShipping(id, shipping, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["erp", "orders"] }),
  });

  const mapSpotToFlags = (spot?: LocalSpot) => {
    if (spot === "mais_vendidos") {
      return { isFeatured: false, isPopular: true };
    }
    if (spot === "novidades") {
      return { isFeatured: true, isPopular: false };
    }
    return { isFeatured: false, isPopular: false };
  };

  const normalizeCategoryValue = (value: unknown): Category => {
    const normalized = String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    if (!normalized) return "acessorios";
    if (normalized === "sedas") return "sedas";
    if (normalized === "piteira" || normalized === "piteiras") return "piteira";
    if (normalized === "fumigeno" || normalized === "fumigenos") return "fumigenos";
    if (normalized === "cuia" || normalized === "cuias") return "cuia";
    if (
      normalized === "bacakit" ||
      normalized === "bacakits" ||
      normalized === "abacakit" ||
      normalized === "abacakits"
    ) {
      return "bacakits";
    }
    if (normalized === "acessorio" || normalized === "acessorios") return "acessorios";
    if (normalized === "banner" || normalized === "banners") return "banners";
    return normalized;
  };

  // -------- Mapping helpers --------
  const mappedProducts: Product[] = useMemo(() => {
    const list = Array.isArray(productsQuery.data) ? productsQuery.data : [];
    return list.map((p) => {
      const galleryList = Array.isArray((p as any).gallery)
        ? (p as any).gallery.filter((entry: unknown) => typeof entry === "string" && String(entry).trim())
        : [];
      const primaryImage = p.image || p.imageUrl || galleryList[0] || "";
      const normalizedGallery = Array.from(new Set([primaryImage, ...galleryList].filter(Boolean)));
      const mappedCategory = normalizeCategoryValue(
        typeof p.category === "string" ? p.category : p.category?.slug || p.category?.name || "acessorios"
      );
      const mappedSpot = (
        mappedCategory === "banners"
          ? "novidades"
          : p.isPopular
            ? "mais_vendidos"
            : p.isFeatured
              ? "novidades"
              : "categoria"
      ) as LocalSpot;

      return {
      // Accept either legacy string category or backend category object.
      // This prevents UI crashes when API payload shape changes.
      category: mappedCategory,
      description: typeof p.description === "string" ? p.description : undefined,
      details: typeof p.details === "string" ? p.details : undefined,
      brand: typeof p.brand === "string" ? p.brand : undefined,
      subcategory: typeof p.subcategory === "string" ? p.subcategory : undefined,
      material: typeof p.material === "string" ? p.material : undefined,
      id: String(p.id),
      name: p.name,
      price: Number(p.price || 0),
      originalPrice: p.originalPrice != null ? Number(p.originalPrice) : null,
      discountPercent: p.discountPercent != null ? Number(p.discountPercent) : null,
      discountAmount: p.discountAmount != null ? Number(p.discountAmount) : null,
      discountLabel: typeof p.discountLabel === "string" ? p.discountLabel : null,
      discountActive: p.discountActive === true,
      stock: Number(p.stock ?? p.stockQty ?? 0),
      image: primaryImage,
      gallery: normalizedGallery,
      banner: p.bannerImage || "",
      showBannerPrice: p.showBannerPrice === true,
      active: (p.active ?? p.isActive) !== false,
      localSpot: mappedSpot,
      localCategory: mappedSpot === "categoria" ? mappedCategory : null,
      createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
      updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
      };
    });
  }, [productsQuery.data]);

  const mappedUsers: User[] = useMemo(() => {
    const list = Array.isArray(usersQuery.data) ? usersQuery.data : [];
    return list.map((u) => ({
      id: String(u.id),
      name: u.name || u.email,
      email: u.email,
      role: (u.role || "USUARIO") as User["role"],
      accessType: u.accessType,
      avatar: u.avatar || "",
      active: u.active !== false,
      permissions: Array.isArray(u.permissions)
        ? (u.permissions as Permission[])
        : (u.role || "").toUpperCase() === "ADMIN"
          ? DEFAULT_ADMIN_PERMISSIONS
          : (u.role || "").toUpperCase() === "CLIENTE"
            ? []
            : DEFAULT_USER_PERMISSIONS,
      createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
    }));
  }, [usersQuery.data]);

  const mappedOrders: Order[] = useMemo(() => {
    const list = Array.isArray(ordersQuery.data) ? ordersQuery.data : [];
    return list.map((o) => ({
      id: String(o.id),
      orderNumber: o.orderNumber,
      customerName: o.customerName || o.email || "Cliente",
      email: o.email || "cliente@desconhecido.com",
      items: (Array.isArray(o.items) ? o.items : []).map((item: any) => ({
        productId: String(item.productId),
        productName: String(item.productName || "Produto"),
        quantity: Number(item.quantity || 0),
        unitPrice: Number(item.unitPrice || 0),
        cost: Number(item.cost || 0),
      })),
      subtotal: Number((o as any).subtotal || 0),
      shipping: Number((o as any).shipping || 0),
      tax: Number((o as any).tax || 0),
      discount: Number((o as any).discount || 0),
      couponCode: (o as any).couponCode || null,
      couponDiscount: Number((o as any).couponDiscount || 0),
      total: Number(o.total || 0),
      status: (o.status || "pendente") as Order["status"],
      paymentStatus: (o as any).paymentStatus,
      createdAt: o.createdAt ? new Date(o.createdAt) : new Date(),
      paidAt: o.paidAt ? new Date(o.paidAt) : undefined,
    }));
  }, [ordersQuery.data]);

  const mappedStock: StockComparison[] = useMemo(() => {
    const list = Array.isArray(stockQuery.data) ? stockQuery.data : [];
    return list.map((item) => {
      const erpStock = item.erp?.stock ?? 0;
      const headStock = item.headshop?.stock ?? 0;
      return {
        productId: item.key,
        productName: item.name,
        erpStock,
        headshopStock: headStock,
        difference: erpStock - headStock,
      };
    });
  }, [stockQuery.data]);

  const currentUser = useMemo<User>(() => {
    const email = authUser?.email?.toLowerCase();
    const fromList = email ? mappedUsers.find((entry) => entry.email.toLowerCase() === email) : undefined;
    if (fromList) return fromList;

    if (authUser) {
      return {
        id: String(authUser.id ?? "session"),
        name: authUser.name || authUser.email,
        email: authUser.email,
        role: authUser.isAdmin ? "ADMIN" : "USUARIO",
        avatar: "",
        active: authUser.active !== false,
        permissions: authUser.permissions?.length
          ? authUser.permissions
          : authUser.isAdmin
            ? DEFAULT_ADMIN_PERMISSIONS
            : DEFAULT_USER_PERMISSIONS,
        createdAt: new Date(),
      };
    }

    return {
      id: "guest",
      name: "Visitante",
      email: "guest@local",
      role: "USUARIO",
      avatar: "",
      active: false,
      permissions: [],
      createdAt: new Date(),
    };
  }, [authUser, mappedUsers]);

  // -------- Actions --------
  const addProduct: ERPContextType["addProduct"] = async (product) => {
    const flags = mapSpotToFlags(product.localSpot);
    await createProductMut.mutateAsync({
      name: product.name,
      description: product.description,
      details: product.details,
      price: product.price,
      originalPrice: product.originalPrice ?? null,
      discountPercent: product.discountPercent ?? null,
      discountAmount: product.discountAmount ?? null,
      discountLabel: product.discountLabel ?? null,
      discountActive: product.discountActive ?? false,
      category: product.category,
      brand: product.brand,
      subcategory: product.subcategory,
      material: product.material,
      stock: product.stock,
      image: product.image,
      gallery: product.gallery,
      bannerImage: product.banner,
      showBannerPrice: product.showBannerPrice ?? false,
      active: product.active,
      ...flags,
    });
  };

  const updateProductFn: ERPContextType["updateProduct"] = async (id, payload) => {
    const { localSpot, localCategory: _ignoredLocalCategory, ...rest } = payload as any;
    const nextPayload: Record<string, unknown> = { ...rest };

    if ("banner" in nextPayload) {
      nextPayload.bannerImage = nextPayload.banner;
      delete nextPayload.banner;
    }

    if (localSpot) {
      Object.assign(nextPayload, mapSpotToFlags(localSpot));
    }

    await updateProductMut.mutateAsync({
      id: Number(id),
      payload: nextPayload as Partial<Product>,
    });
  };

  const deleteProductFn: ERPContextType["deleteProduct"] = async (id) => {
    await deleteProductMut.mutateAsync(Number(id));
  };

  const toggleProductStatus: ERPContextType["toggleProductStatus"] = async (id) => {
    const product = mappedProducts.find((p) => p.id === id);
    if (!product) return;
    await updateProductMut.mutateAsync({ id: Number(id), payload: { active: !product.active } });
  };

  const addUser: ERPContextType["addUser"] = async (user) => {
    const permissions = user.role === "ADMIN" ? DEFAULT_ADMIN_PERMISSIONS : user.permissions ?? [];
    await createUserMut.mutateAsync({
      name: user.name,
      email: user.email.toLowerCase(),
      role: user.role,
      accessType: user.accessType,
      active: user.active,
      password: (user as any).password,
      permissions,
      avatar: user.avatar,
    });
  };

  const updateUserFn: ERPContextType["updateUser"] = async (id, payload) => {
    await updateUserMut.mutateAsync({
      id: Number(id),
      payload: {
        ...payload,
        email: payload.email?.toLowerCase(),
      },
    });
  };

  const deleteUserFn: ERPContextType["deleteUser"] = async (id) => {
    await deleteUserMut.mutateAsync(Number(id));
  };

  const toggleUserStatus: ERPContextType["toggleUserStatus"] = async (id) => {
    const user = mappedUsers.find((u) => u.id === id);
    if (!user) return;
    await updateUserFn(id, { active: !user.active });
  };

  const batchToggleUserStatus: ERPContextType["batchToggleUserStatus"] = async (ids, active) => {
    await Promise.all(ids.map((id) => updateUserFn(id, { active })));
  };

  const updateUserPermissions: ERPContextType["updateUserPermissions"] = async (id, permissions) => {
    await updateUserFn(id, { permissions });
  };

  const updateOrderStatus: ERPContextType["updateOrderStatus"] = async (id, status) => {
    const normalizedStatus = status === "enviado" ? "pago" : status;
    await updateOrderStatusMut.mutateAsync({
      id: Number(id),
      status: normalizedStatus,
    });
  };

  const updateOrderDiscount: ERPContextType["updateOrderDiscount"] = async (id, discount, reason) => {
    await updateOrderDiscountMut.mutateAsync({
      id: Number(id),
      discount,
      reason,
    });
  };

  const updateOrderShipping: ERPContextType["updateOrderShipping"] = async (id, shipping, reason) => {
    await updateOrderShippingMut.mutateAsync({
      id: Number(id),
      shipping,
      reason,
    });
  };

  const refreshStockComparison: ERPContextType["refreshStockComparison"] = async () => {
    await queryClient.invalidateQueries({ queryKey: ["erp", "stock-compare"] });
  };

  const syncToHeadshop: ERPContextType["syncToHeadshop"] = async () => {
    await syncStockPush();
    await queryClient.invalidateQueries({ queryKey: ["erp", "stock-compare"] });
  };

  const syncFromHeadshop: ERPContextType["syncFromHeadshop"] = async () => {
    await syncStockPull();
    await queryClient.invalidateQueries({ queryKey: ["erp", "stock-compare"] });
    await queryClient.invalidateQueries({ queryKey: ["erp", "products"] });
  };

  return (
    <ERPContext.Provider
      value={{
        products: mappedProducts,
        addProduct,
        updateProduct: updateProductFn,
        deleteProduct: deleteProductFn,
        toggleProductStatus,
        users: mappedUsers,
        addUser,
        updateUser: updateUserFn,
        deleteUser: deleteUserFn,
        toggleUserStatus,
        batchToggleUserStatus,
        updateUserPermissions,
        orders: mappedOrders,
        updateOrderStatus,
        updateOrderDiscount,
        updateOrderShipping,
        stockComparison: mappedStock,
        refreshStockComparison,
        syncToHeadshop,
        syncFromHeadshop,
        currentUser,
      }}
    >
      {children}
    </ERPContext.Provider>
  );
}

export function useERP() {
  const context = useContext(ERPContext);
  if (context === undefined) {
    throw new Error("useERP must be used within an ERPProvider");
  }
  return context;
}

