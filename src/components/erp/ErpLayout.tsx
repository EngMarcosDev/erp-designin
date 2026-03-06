import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { MainLayout } from "./MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ErpLayoutProps {
  children: ReactNode;
}

const ErpLayout = ({ children }: ErpLayoutProps) => {
  const { user, logout } = useAuth();

  return (
    <MainLayout>
      <div className="space-y-6 logo-watermark">
        <Card className="card-soft overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-[#c1a062] via-[#7fbf72] to-[#f05f3b]" />
          <div className="flex items-center justify-between gap-4 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white border border-border flex items-center justify-center shadow-sm">
                <img src="/assets/branding/logo-circle.svg" alt="Logo Abacaxita" className="h-7 w-7 object-contain opacity-90" />
              </div>
              <p className="text-sm text-muted-foreground">Painel interno</p>
            </div>
            <div className="text-xs flex items-center gap-3">
              <span className="opacity-90">{user?.email}</span>
              <Button size="sm" onClick={logout} className="bg-[#2c9b4f] hover:brightness-110">
                Sair
              </Button>
            </div>
          </div>
        </Card>

        {children}
      </div>
    </MainLayout>
  );
};

export default ErpLayout;
