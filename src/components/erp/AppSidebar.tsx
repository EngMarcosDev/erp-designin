import { ShoppingCart, Package, Users, BarChart3, FileText, Settings } from "lucide-react";
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

const menuItems = [
  { title: "Pedidos", url: "/", icon: ShoppingCart },
  { title: "Produtos", url: "/produtos", icon: Package },
  { title: "Usuários", url: "/usuarios", icon: Users },
  { title: "Estoque", url: "/estoque", icon: BarChart3 },
  { title: "Relatórios", url: "/relatorios", icon: FileText },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

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
          <div className="flex items-center gap-3">
            <img src="/assets/branding/logo-erp.png" alt="ERP Bacaxita" className="h-9 w-9 object-contain" />
            <span className="font-bold text-sidebar-foreground">ERP Bacaxita</span>
          </div>
        )}
        <SidebarTrigger className="text-sidebar-foreground hover:bg-sidebar-accent rounded-md p-2" />
      </div>

      <SidebarContent className="py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
