import { ReactNode } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {/* Barra colorida no topo */}
        <div className="fixed top-0 left-0 right-0 h-1 z-50 gradient-bar" />
        
        <AppSidebar />
        
        <main className="flex-1 flex flex-col min-h-screen pt-1">
          <div className="flex-1 p-6 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
