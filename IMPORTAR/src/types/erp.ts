// Tipos do ERP Abacaxita

export type Category = 'sedas' | 'piteira' | 'cuia' | 'bacakits' | 'acessorios';

export type UserRole = 'ADMIN' | 'USUARIO';

export type OrderStatus = 'pendente' | 'pago' | 'enviado' | 'cancelado';

export type Permission = 'gerenciar_produtos' | 'gerenciar_pedidos' | 'gerenciar_estoque' | 'gerenciar_usuarios' | 'ver_relatorios';

export const PERMISSION_LABELS: Record<Permission, string> = {
  gerenciar_produtos: 'Gerenciar Produtos',
  gerenciar_pedidos: 'Gerenciar Pedidos',
  gerenciar_estoque: 'Gerenciar Estoque',
  gerenciar_usuarios: 'Gerenciar Usuários',
  ver_relatorios: 'Ver Relatórios',
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
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  active: boolean;
  permissions: Permission[];
  createdAt: Date;
}

export interface Order {
  id: string;
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
  sedas: 'Sedas',
  piteira: 'Piteira',
  cuia: 'Cuia',
  bacakits: 'BacaKits',
  acessorios: 'Acessórios',
};

export const CATEGORY_COLORS: Record<Category, string> = {
  sedas: 'category-sedas',
  piteira: 'category-piteira',
  cuia: 'category-cuia',
  bacakits: 'category-bacakits',
  acessorios: 'category-acessorios',
};

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pendente: 'Pendente',
  pago: 'Pago',
  enviado: 'Enviado',
  cancelado: 'Cancelado',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  USUARIO: 'Usuário',
};

export const DEFAULT_ADMIN_PERMISSIONS: Permission[] = [
  'gerenciar_produtos',
  'gerenciar_pedidos',
  'gerenciar_estoque',
  'gerenciar_usuarios',
  'ver_relatorios',
];

export const DEFAULT_USER_PERMISSIONS: Permission[] = [
  'gerenciar_pedidos',
  'ver_relatorios',
];
