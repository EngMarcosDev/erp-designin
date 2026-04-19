// ERP Abacaxita shared types

export type Category = string;

export type UserRole = "ADMIN" | "USUARIO" | "CLIENTE";

export type OrderStatus = "pendente" | "pago" | "enviado" | "cancelado";

// Auditoria feita em 2026-04-18: mapeamos toda a superficie de rotas ERP
// (products, orders, stock, users, reports, categories, site/popups,
// users/audit, cupons). Cada area no backend ganhou uma permissao
// correspondente aqui - assim o grid de permissoes em UsersPage cobre
// tudo que existe hoje, sem "buracos" onde uma acao ficaria sempre
// permitida por falta de flag.
export type Permission =
  | "gerenciar_produtos"
  | "gerenciar_pedidos"
  | "gerenciar_estoque"
  | "gerenciar_usuarios"
  | "ver_relatorios"
  | "gerenciar_categorias"
  | "gerenciar_site"
  | "gerenciar_cupons"
  | "ver_auditoria";

export type LocalSpot = "novidades" | "mais_vendidos" | "categoria";

export const PERMISSION_LABELS: Record<Permission, string> = {
  gerenciar_produtos: "Gerenciar produtos",
  gerenciar_pedidos: "Gerenciar pedidos",
  gerenciar_estoque: "Gerenciar estoque",
  gerenciar_usuarios: "Gerenciar usuarios",
  ver_relatorios: "Ver relatorios",
  gerenciar_categorias: "Gerenciar categorias",
  gerenciar_site: "Gerenciar site (popups, banners)",
  gerenciar_cupons: "Gerenciar cupons & descontos",
  ver_auditoria: "Ver registros de auditoria",
};

export interface Product {
  id: string;
  name: string;
  description?: string;
  details?: string;
  price: number;
  originalPrice?: number | null;
  discountPercent?: number | null;
  discountAmount?: number | null;
  discountLabel?: string | null;
  discountActive?: boolean;
  category: Category;
  brand?: string;
  subcategory?: string;
  material?: string;
  stock: number;
  image?: string;
  gallery?: string[];
  banner?: string;
  showBannerPrice?: boolean;
  active: boolean;
  localSpot?: LocalSpot;
  localCategory?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  accessType?: "ERP" | "HEADSHOP";
  avatar?: string;
  active: boolean;
  permissions: Permission[];
  createdAt: Date;
}

export type AuditTarget = "produto" | "usuario";

export interface AuditLog {
  id: string;
  target: AuditTarget;
  action: "criou" | "editou" | "ativou" | "desativou" | "permissoes" | "sync";
  title: string;
  user: string;
  timestamp: Date;
  details?: string;
}

export interface Order {
  id: string;
  orderNumber?: string;
  email?: string;
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  couponCode?: string | null;
  couponDiscount?: number;
  total: number;
  status: OrderStatus;
  paymentStatus?: string;
  createdAt: Date;
  paidAt?: Date;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  cost?: number;
}

export interface StockComparison {
  productId: string;
  productName: string;
  erpStock: number;
  headshopStock: number;
  difference: number;
}

export const CATEGORY_LABELS: Record<string, string> = {
  sedas: "Sedas",
  piteira: "Piteiras",
  fumigenos: "Fumigenos",
  cuia: "Cuias",
  bacakits: "AbacaKits",
  acessorios: "Acessorios",
  banners: "Banners",
};

export const CATEGORY_COLORS: Record<string, string> = {
  bacakits: "category-bacakits",
  sedas: "category-sedas",
  piteira: "category-piteira",
  cuia: "category-cuia",
  acessorios: "category-acessorios",
  fumigenos: "category-fumigenos",
  banners: "bg-amber-600/80",
};

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pendente: "Pendente",
  pago: "Pago",
  enviado: "Enviado",
  cancelado: "Cancelado",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrador",
  USUARIO: "Usuario",
  CLIENTE: "Cliente",
};

export const DEFAULT_ADMIN_PERMISSIONS: Permission[] = [
  "gerenciar_produtos",
  "gerenciar_pedidos",
  "gerenciar_estoque",
  "gerenciar_usuarios",
  "ver_relatorios",
  "gerenciar_categorias",
  "gerenciar_site",
  "gerenciar_cupons",
  "ver_auditoria",
];

export const DEFAULT_USER_PERMISSIONS: Permission[] = ["gerenciar_pedidos", "ver_relatorios"];
