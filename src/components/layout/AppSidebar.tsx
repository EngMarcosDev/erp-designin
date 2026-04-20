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
  Megaphone,
  DollarSign,
  LineChart,
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

const mainMenuItems: MenuItem[] = [
  { title: "Pedidos", url: "/pedidos", icon: ShoppingCart, permission: "gerenciar_pedidos" },
  { title: "Produtos", url: "/produtos", icon: Package, permission: "gerenciar_produtos" },
  { title: "Conteúdo", url: "/conteudo", icon: Megaphone, permission: "gerenciar_produtos" },
  { title: "Custos", url: "/custos", icon: DollarSign, permission: "ver_relatorios" },
  { title: "Relatórios", url: "/relatorios", icon: FileText, permission: "ver_relatorios" },
  { title: "Estoque", url: "/estoque", icon: BarChart3, permission: "gerenciar_estoque" },
];

const adminMenuItems: MenuItem[] = [
  { title: "Usuários", url: "/usuarios", icon: Users, permission: "gerenciar_usuarios" },
  { title: "Estatísticas", url: "/estatisticas", icon: LineChart, permission: "gerenciar_usuarios" },
  { title: "Configurações", url: "/configuracoes", icon: Settings, permission: "gerenciar_usuarios" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const headshopUrl = import.meta.env.VITE_HEADSHOP_URL || "https://bacaxita.com.br";

  const visibleMainItems = user?.active ? mainMenuItems.filter((item) => hasPermission(item.permission)) : [];
  const visibleAdminItems = user?.active ? adminMenuItems.filter((item) => hasPermission(item.permission)) : [];

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
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[hsl(28_40%_36%)]/35 bg-[hsl(28_40%_36%)]/15 shadow-sm">
              <img src="/assets/branding/logo-erp.png" alt="Abacaxita ERP" className="h-8 w-8 rounded-full object-cover ring-1 ring-white/60" />
            </div>
            <span className="font-bold text-sidebar-foreground">Abacaxita ERP</span>
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
              {visibleMainItems.map((item) => (
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

              {visibleAdminItems.length > 0 && (
                <>
                  <div className={`my-1.5 border-t border-sidebar-border/50 ${isCollapsed ? "mx-2" : "mx-3"}`} />
                  {visibleAdminItems.map((item) => (
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
                </>
              )}

              {visibleMainItems.length === 0 && visibleAdminItems.length === 0 && !isCollapsed && (
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
                {user?.email || "Usuario"}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                {user?.isAdmin ? "Admin" : "Usuario"}
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

