// ERP Abacaxita shared types

export type Category = "bacakits" | "sedas" | "piteira" | "cuia" | "acessorios" | "fumigenos";

export type UserRole = "ADMIN" | "USUARIO" | "CLIENTE";

export type OrderStatus = "pendente" | "pago" | "enviado" | "cancelado";

export type Permission =
  | "gerenciar_produtos"
  | "gerenciar_pedidos"
  | "gerenciar_estoque"
  | "gerenciar_usuarios"
  | "ver_relatorios";

export type LocalSpot = "novidades" | "mais_vendidos" | "categoria";

export const PERMISSION_LABELS: Record<Permission, string> = {
  gerenciar_produtos: "Gerenciar produtos",
  gerenciar_pedidos: "Gerenciar pedidos",
  gerenciar_estoque: "Gerenciar estoque",
  gerenciar_usuarios: "Gerenciar usuarios",
  ver_relatorios: "Ver relatorios",
};

export interface Product {
  id: string;
  name: string;
  price: number;
  category: Category;
  stock: number;
  image?: string;
  banner?: string;
  active: boolean;
  localSpot?: LocalSpot;
  localCategory?: Category | null;
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
  email?: string;
  customerName: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: Date;
  paidAt?: Date;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface StockComparison {
  productId: string;
  productName: string;
  erpStock: number;
  headshopStock: number;
  difference: number;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  bacakits: "BacaKits",
  sedas: "Sedas",
  piteira: "Piteira",
  cuia: "Cuia",
  acessorios: "Acessórios",
  fumigenos: "Fumígenos",
};

export const CATEGORY_COLORS: Record<Category, string> = {
  bacakits: "category-bacakits",
  sedas: "category-sedas",
  piteira: "category-piteira",
  cuia: "category-cuia",
  acessorios: "category-acessorios",
  fumigenos: "category-fumigenos",
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
];

export const DEFAULT_USER_PERMISSIONS: Permission[] = ["gerenciar_pedidos", "ver_relatorios"];
