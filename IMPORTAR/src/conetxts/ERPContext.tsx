import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Product, User, Order, StockComparison, Permission } from '@/types/erp';
import { initialProducts, initialUsers, initialOrders, mockStockComparison } from '@/data/mockData';

interface ERPContextType {
  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  toggleProductStatus: (id: string) => void;

  // Users
  users: User[];
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  toggleUserStatus: (id: string) => void;
  batchToggleUserStatus: (ids: string[], active: boolean) => void;
  updateUserPermissions: (id: string, permissions: Permission[]) => void;

  // Orders
  orders: Order[];
  updateOrderStatus: (id: string, status: Order['status']) => void;

  // Stock
  stockComparison: StockComparison[];
  refreshStockComparison: () => void;
  syncToHeadshop: (productId: string) => void;
  syncFromHeadshop: (productId: string) => void;

  // Auth (simulated)
  currentUser: User;
}

const ERPContext = createContext<ERPContextType | undefined>(undefined);

export function ERPProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [stockComparison, setStockComparison] = useState<StockComparison[]>(mockStockComparison);

  // Simulated current user (first admin)
  const currentUser = users.find(u => u.role === 'ADMIN') || users[0];

  // Product functions
  const addProduct = (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProduct: Product = {
      ...product,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setProducts(prev => [...prev, newProduct]);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev =>
      prev.map(p =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
      )
    );
  };

  const toggleProductStatus = (id: string) => {
    setProducts(prev =>
      prev.map(p =>
        p.id === id ? { ...p, active: !p.active, updatedAt: new Date() } : p
      )
    );
  };

  // User functions
  const addUser = (user: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...user,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    setUsers(prev => [...prev, newUser]);
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers(prev =>
      prev.map(u => (u.id === id ? { ...u, ...updates } : u))
    );
  };

  const toggleUserStatus = (id: string) => {
    setUsers(prev =>
      prev.map(u => (u.id === id ? { ...u, active: !u.active } : u))
    );
  };

  const batchToggleUserStatus = (ids: string[], active: boolean) => {
    setUsers(prev =>
      prev.map(u => (ids.includes(u.id) ? { ...u, active } : u))
    );
  };

  const updateUserPermissions = (id: string, permissions: Permission[]) => {
    setUsers(prev =>
      prev.map(u => (u.id === id ? { ...u, permissions } : u))
    );
  };

  // Order functions
  const updateOrderStatus = (id: string, status: Order['status']) => {
    setOrders(prev =>
      prev.map(o =>
        o.id === id
          ? { ...o, status, paidAt: status === 'pago' ? new Date() : o.paidAt }
          : o
      )
    );
  };

  // Stock functions
  const refreshStockComparison = () => {
    const newComparison = products.map(p => {
      const existingComparison = stockComparison.find(sc => sc.productId === p.id);
      const headshopStock = existingComparison?.headshopStock ?? p.stock;
      return {
        productId: p.id,
        productName: p.name,
        erpStock: p.stock,
        headshopStock,
        difference: p.stock - headshopStock,
      };
    });
    setStockComparison(newComparison);
  };

  const syncToHeadshop = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setStockComparison(prev =>
        prev.map(sc =>
          sc.productId === productId
            ? { ...sc, headshopStock: product.stock, difference: 0 }
            : sc
        )
      );
    }
  };

  const syncFromHeadshop = (productId: string) => {
    const comparison = stockComparison.find(sc => sc.productId === productId);
    if (comparison) {
      setProducts(prev =>
        prev.map(p =>
          p.id === productId
            ? { ...p, stock: comparison.headshopStock, updatedAt: new Date() }
            : p
        )
      );
      setStockComparison(prev =>
        prev.map(sc =>
          sc.productId === productId
            ? { ...sc, erpStock: sc.headshopStock, difference: 0 }
            : sc
        )
      );
    }
  };

  return (
    <ERPContext.Provider
      value={{
        products,
        addProduct,
        updateProduct,
        toggleProductStatus,
        users,
        addUser,
        updateUser,
        toggleUserStatus,
        batchToggleUserStatus,
        updateUserPermissions,
        orders,
        updateOrderStatus,
        stockComparison,
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
    throw new Error('useERP must be used within an ERPProvider');
  }
  return context;
}
