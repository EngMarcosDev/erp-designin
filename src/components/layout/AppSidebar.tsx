import {
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  FileText,
  Settings,
  Store,
  Menu,
  ChevronLeft,
  LogOut,
} from "lucide-react";
import type { ComponentType } from "react";
import { useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import type { Permission } from "@/types/erp";

type MenuItem = {
  title: string;
  url: string;
  icon: ComponentType<{ className?: string }>;
  permission: Permission;
};

const menuItems: MenuItem[] = [
  { title: "Pedidos", url: "/pedidos", icon: ShoppingCart, permission: "gerenciar_pedidos" },
  { title: "Produtos", url: "/produtos", icon: Package, permission: "gerenciar_produtos" },
  { title: "Usuários", url: "/usuarios", icon: Users, permission: "gerenciar_usuarios" },
  { title: "Estoque", url: "/estoque", icon: BarChart3, permission: "gerenciar_estoque" },
  { title: "Relatórios", url: "/relatorios", icon: FileText, permission: "ver_relatorios" },
  { title: "Configurações", url: "/configuracoes", icon: Settings, permission: "gerenciar_usuarios" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const headshopUrl = import.meta.env.VITE_HEADSHOP_URL || "http://localhost:8080";

  const visibleMenuItems = user?.active ? menuItems.filter((item) => hasPermission(item.permission)) : [];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Sidebar
      className={cn(
        "border-r border-sidebar-border transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
      )}
      collapsible="icon"
    >
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <span className="text-sidebar-primary-foreground font-bold text-sm">B</span>
            </div>
            <span className="font-bold text-sidebar-foreground">Abacaxita</span>
          </div>
        )}
        <SidebarTrigger className="text-sidebar-foreground hover:bg-sidebar-accent rounded-md p-2">
          {isCollapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </SidebarTrigger>
      </div>

      <SidebarContent className="py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                      activeClassName="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary"
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!isCollapsed && <span className="font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {visibleMenuItems.length === 0 && !isCollapsed && (
                <div className="px-3 py-3 text-xs text-sidebar-foreground/70">
                  Este usuário não possui permissões de menu ativas.
                </div>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {!isCollapsed && (
        <div className="mt-auto p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center">
              <Users className="h-4 w-4 text-sidebar-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.email || "Usuário"}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                {user?.isAdmin ? "Admin" : "Usuário"}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-3 gap-2 bg-primary text-primary-foreground border-primary hover:bg-primary/85 hover:text-primary-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 gap-2"
            onClick={() => window.open(headshopUrl, "_blank")}
          >
            <Store className="h-4 w-4" />
            Ir para HeadShop
          </Button>
        </div>
      )}
    </Sidebar>
  );
}
